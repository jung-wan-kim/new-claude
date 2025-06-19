import { EventEmitter } from 'events';
import { TaskManagerClient } from './TaskManagerClient';
import { Context7Client } from './Context7Client';

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface MCPServerConfig {
  name: string;
  client: any;
  required: boolean;
  retryPolicy?: RetryPolicy;
  healthCheckInterval?: number;
}

export interface MCPServerState {
  config: MCPServerConfig;
  client: any;
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

export class EnhancedMCPManager extends EventEmitter {
  private servers: Map<string, MCPServerState> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timer> = new Map();
  private initTimeout: number;

  constructor(config?: { initTimeout?: number }) {
    super();
    this.initTimeout = config?.initTimeout || 30000;
    this.setupServers();
  }

  private setupServers() {
    // TaskManager 설정
    this.registerServer({
      name: 'taskManager',
      client: new TaskManagerClient(),
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      healthCheckInterval: 30000
    });

    // Context7 설정
    this.registerServer({
      name: 'context7',
      client: new Context7Client(),
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      healthCheckInterval: 30000
    });
  }

  private registerServer(config: MCPServerConfig) {
    this.servers.set(config.name, {
      config,
      client: config.client,
      status: 'disconnected',
      errorCount: 0
    });
  }

  async initialize(): Promise<InitializationResult> {
    const results: InitializationResult = {
      success: true,
      servers: {}
    };

    console.log('🚀 Initializing MCP servers...');

    for (const [name, state] of this.servers) {
      try {
        await this.initializeServer(name, state);
        results.servers[name] = { success: true };
        console.log(`✅ ${name} initialized successfully`);
      } catch (error: any) {
        results.servers[name] = { 
          success: false, 
          error: error.message 
        };
        console.error(`❌ ${name} initialization failed:`, error.message);
        
        if (state.config.required) {
          results.success = false;
        }
      }
    }

    this.emit('initialized', results);
    return results;
  }

  private async initializeServer(
    name: string, 
    state: MCPServerState
  ): Promise<void> {
    state.status = 'connecting';
    
    // 타임아웃 설정
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initialization timeout')), 
      this.initTimeout)
    );

    try {
      await Promise.race([
        this.retryWithPolicy(
          () => state.client.initialize(),
          state.config.retryPolicy
        ),
        timeout
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

  private async retryWithPolicy(
    operation: () => Promise<any>,
    policy?: RetryPolicy
  ): Promise<any> {
    if (!policy) return operation();

    let lastError: Error;
    let delay = policy.initialDelay;

    for (let i = 0; i <= policy.maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (i < policy.maxRetries) {
          console.log(`Retry ${i + 1}/${policy.maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
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
        await state.client.getStatus?.() || await state.client.list_requests?.();
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
    }, state.config.healthCheckInterval!);

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
    for (const [name, timer] of this.healthCheckTimers) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();

    // 서버 연결 종료
    const disconnectPromises = [];
    for (const [name, state] of this.servers) {
      if (state.client.disconnect) {
        disconnectPromises.push(
          state.client.disconnect()
            .then(() => {
              state.status = 'disconnected';
              console.log(`✅ ${name} disconnected`);
            })
            .catch((err: any) => {
              console.error(`Error disconnecting ${name}:`, err);
            })
        );
      }
    }

    await Promise.all(disconnectPromises);
    console.log('All MCP servers disconnected');
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

  getStatus(): {
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
    const servers: any = {};
    
    for (const [name, state] of this.servers) {
      servers[name] = {
        status: state.status,
        lastConnected: state.lastConnected,
        lastHealthCheck: state.lastHealthCheck,
        errorCount: state.errorCount
      };
    }

    return {
      initialized: Array.from(this.servers.values()).some(s => s.status === 'connected'),
      servers
    };
  }

  // 기존 MCPManager와의 호환성을 위한 getter
  get taskManager(): TaskManagerClient {
    return this.getServer('taskManager');
  }

  get context7(): Context7Client {
    return this.getServer('context7');
  }
}