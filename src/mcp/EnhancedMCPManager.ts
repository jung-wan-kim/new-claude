import { EventEmitter } from 'events';
import { TaskManagerClient } from './TaskManagerClient';
import { Context7Client } from './Context7Client';
import { MCPManager } from '../shared/types';

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface MCPServerConfig {
  name: string;
  client: TaskManagerClient | Context7Client;
  required: boolean;
  retryPolicy?: RetryPolicy;
  healthCheckInterval?: number;
}

export interface MCPServerState {
  config: MCPServerConfig;
  client: TaskManagerClient | Context7Client;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected?: Date;
  lastHealthCheck?: Date;
  errorCount: number;
}

export interface InitializationResult {
  success: boolean;
  servers: {
    [key: string]: {
      success: boolean;
      error?: string;
    };
  };
}

export class EnhancedMCPManager extends EventEmitter implements MCPManager {
  private servers: Map<string, MCPServerState> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private initTimeout: number;
  private _initialized = false;

  // MCPManager interface properties
  public taskManager: TaskManagerClient;
  public context7: Context7Client;

  constructor(config?: { initTimeout?: number }) {
    super();
    this.initTimeout = config?.initTimeout || 30000;
    this.taskManager = new TaskManagerClient();
    this.context7 = new Context7Client();
    this.setupServers();
  }

  private setupServers() {
    // TaskManager 설정
    this.registerServer({
      name: 'taskManager',
      client: this.taskManager,
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
      healthCheckInterval: 30000,
    });

    // Context7 설정
    this.registerServer({
      name: 'context7',
      client: this.context7,
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
      healthCheckInterval: 30000,
    });
  }

  private registerServer(config: MCPServerConfig) {
    this.servers.set(config.name, {
      config,
      client: config.client,
      status: 'disconnected',
      errorCount: 0,
    });
  }

  async initialize(): Promise<void> {
    const results = await this._initialize();
    if (!results.success) {
      throw new Error('Required MCP servers failed to initialize');
    }
    this._initialized = true;
  }

  private async _initialize(): Promise<InitializationResult> {
    const results: InitializationResult = {
      success: true,
      servers: {},
    };

    console.log('🚀 Initializing MCP servers...');

    for (const [name, state] of this.servers) {
      try {
        await this.initializeServer(name, state);
        results.servers[name] = { success: true };
        console.log(`✅ ${name} initialized successfully`);
      } catch (error) {
        results.servers[name] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        console.error(
          `❌ ${name} initialization failed:`,
          error instanceof Error ? error.message : String(error)
        );

        if (state.config.required) {
          results.success = false;
        }
      }
    }

    this.emit('initialized', results);
    return results;
  }

  private async initializeServer(name: string, state: MCPServerState): Promise<void> {
    state.status = 'connecting';

    // 타임아웃 설정
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Initialization timeout')), this.initTimeout)
    );

    try {
      await Promise.race([
        this.retryWithPolicy(() => state.client.initialize(), state.config.retryPolicy),
        timeout,
      ]);

      state.status = 'connected';
      state.lastConnected = new Date();
      state.errorCount = 0;

      // 헬스체크 시작
      if (state.config.healthCheckInterval) {
        this.startHealthCheck(name, state);
      }
    } catch (error) {
      state.status = 'error';
      state.errorCount++;
      throw error;
    }
  }

  private async retryWithPolicy<T>(operation: () => Promise<T>, policy?: RetryPolicy): Promise<T> {
    if (!policy) return operation();

    let lastError: Error;
    let delay = policy.initialDelay;

    for (let i = 0; i <= policy.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (i < policy.maxRetries) {
          console.log(`Retry ${i + 1}/${policy.maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelay);
        }
      }
    }

    throw lastError!;
  }

  private startHealthCheck(name: string, state: MCPServerState) {
    const timer = setInterval(async () => {
      try {
        // 간단한 ping 형태의 헬스체크
        (await state.client.getStatus?.()) || (await state.client.list_requests?.());
        state.lastHealthCheck = new Date();

        if (state.status !== 'connected') {
          state.status = 'connected';
          state.errorCount = 0;
          this.emit('serverReconnected', name);
          console.log(`✅ ${name} reconnected`);
        }
      } catch (error) {
        if (state.status === 'connected') {
          state.status = 'disconnected';
          this.emit('serverDisconnected', name, error);
          console.warn(`⚠️  ${name} disconnected, attempting reconnection...`);

          // 자동 재연결 시도
          this.reconnectServer(name).catch(console.error);
        }
      }
    }, state.config.healthCheckInterval);

    this.healthCheckTimers.set(name, timer);
  }

  private async reconnectServer(name: string): Promise<void> {
    const state = this.servers.get(name);
    if (!state) return;

    try {
      await this.initializeServer(name, state);
      console.log(`✅ ${name} reconnected successfully`);
    } catch (error) {
      console.error(`❌ ${name} reconnection failed:`, error);
      // 다음 헬스체크에서 재시도
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting MCP servers...');

    // 헬스체크 타이머 정리
    for (const [, timer] of this.healthCheckTimers) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();

    // 서버 연결 종료
    const disconnectPromises = [];
    for (const [name, state] of this.servers) {
      if (state.client.disconnect) {
        disconnectPromises.push(
          state.client
            .disconnect()
            .then(() => {
              state.status = 'disconnected';
              console.log(`✅ ${name} disconnected`);
            })
            .catch((err) => {
              console.error(`Error disconnecting ${name}:`, err);
            })
        );
      }
    }

    await Promise.all(disconnectPromises);
    this._initialized = false;
    console.log('All MCP servers disconnected');
  }

  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initialize();
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  getStatus(): {
    initialized: boolean;
    services: {
      taskManager: boolean;
      context7: boolean;
    };
  } {
    const taskManagerState = this.servers.get('taskManager');
    const context7State = this.servers.get('context7');

    return {
      initialized: this._initialized,
      services: {
        taskManager: taskManagerState?.status === 'connected',
        context7: context7State?.status === 'connected',
      },
    };
  }

  getDetailedStatus(): {
    initialized: boolean;
    servers: {
      [key: string]: {
        status: string;
        lastConnected?: Date;
        lastHealthCheck?: Date;
        errorCount: number;
      };
    };
  } {
    const servers: Record<
      string,
      { status: string; lastConnected?: Date; lastHealthCheck?: Date; errorCount: number }
    > = {};

    for (const [name, state] of this.servers) {
      servers[name] = {
        status: state.status,
        lastConnected: state.lastConnected,
        lastHealthCheck: state.lastHealthCheck,
        errorCount: state.errorCount,
      };
    }

    return {
      initialized: this._initialized,
      servers,
    };
  }

  getServer(name: string): any {
    const state = this.servers.get(name);
    if (!state) {
      throw new Error(`Unknown server: ${name}`);
    }

    if (state.status !== 'connected') {
      console.warn(`Server ${name} is not connected (status: ${state.status})`);
    }

    return state.client;
  }
}
