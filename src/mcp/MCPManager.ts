// MCP 매니저 - TaskManager와 Context7 통합 관리
import { TaskManagerClient } from './TaskManagerClient';
import { Context7Client } from './Context7Client';

export class MCPManager {
  public taskManager: TaskManagerClient;
  public context7: Context7Client;
  private initialized = false;

  constructor() {
    this.taskManager = new TaskManagerClient();
    this.context7 = new Context7Client();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('MCP Manager already initialized');
      return;
    }

    console.log('Initializing MCP servers...');

    try {
      // TaskManager 초기화 시도
      try {
        this.taskManager.initialize();
        console.log('✓ TaskManager MCP client initialized');
      } catch (error) {
        console.warn('⚠ TaskManager initialization failed:', error);
        // TaskManager가 실패해도 계속 진행
      }

      // Context7 초기화 시도
      try {
        this.context7.initialize();
        console.log('✓ Context7 MCP client initialized');
      } catch (error) {
        console.warn('⚠ Context7 initialization failed:', error);
        // Context7가 실패해도 계속 진행
      }

      this.initialized = true;
      console.log('MCP Manager initialization completed');
    } catch (error) {
      console.error('Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting MCP servers...');

    try {
      this.taskManager.disconnect();
      this.context7.disconnect();

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
    services: {
      taskManager: boolean;
      context7: boolean;
    };
  } {
    return {
      initialized: this.initialized,
      services: {
        taskManager: !!this.taskManager,
        context7: !!this.context7,
      },
    };
  }
}
