// MCP 매니저 - TaskManager와 Context7 통합 관리
import { TaskManagerClient, TaskManagerClientOptions } from './TaskManagerClient';
import { Context7Client, Context7ClientOptions } from './Context7Client';

export interface MCPManagerOptions {
  mode?: 'mock' | 'real';
  taskManager?: TaskManagerClientOptions;
  context7?: Context7ClientOptions;
}

export class MCPManager {
  public taskManager: TaskManagerClient;
  public context7: Context7Client;
  private initialized = false;
  private mode: 'mock' | 'real';

  constructor(options: MCPManagerOptions = {}) {
    this.mode = options.mode || 'mock';
    
    // 전역 모드를 개별 클라이언트에 전달
    this.taskManager = new TaskManagerClient({
      mode: this.mode,
      ...options.taskManager
    });
    
    this.context7 = new Context7Client({
      mode: this.mode,
      ...options.context7
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('MCP Manager already initialized');
      return;
    }

    console.log(`Initializing MCP servers in ${this.mode} mode...`);

    try {
      // TaskManager 초기화 시도
      try {
        await this.taskManager.initialize();
        console.log('✓ TaskManager MCP client initialized');
      } catch (error) {
        console.warn('⚠ TaskManager initialization failed:', error);
        // TaskManager가 실패해도 계속 진행
      }

      // Context7 초기화 시도
      try {
        await this.context7.initialize();
        console.log('✓ Context7 MCP client initialized');
      } catch (error) {
        console.warn('⚠ Context7 initialization failed:', error);
        // Context7가 실패해도 계속 진행
      }

      this.initialized = true;
      console.log(`MCP Manager initialization completed in ${this.mode} mode`);
    } catch (error) {
      console.error('Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting MCP servers...');

    try {
      await this.taskManager.disconnect();
      await this.context7.disconnect();

      this.initialized = false;
      console.log('MCP servers disconnected');
    } catch (error) {
      console.error('Error during MCP disconnect:', error);
    }
  }

  async reconnect(): Promise<void> {
    console.log('Reconnecting MCP servers...');
    await this.disconnect();
    await this.initialize();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getStatus(): {
    initialized: boolean;
    mode: 'mock' | 'real';
    services: {
      taskManager: boolean;
      context7: boolean;
    };
  } {
    return {
      initialized: this.initialized,
      mode: this.mode,
      services: {
        taskManager: !!this.taskManager,
        context7: !!this.context7,
      },
    };
  }
}
