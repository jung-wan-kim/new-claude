import * as blessed from 'blessed';
import { EnhancedMCPManager } from '../mcp/EnhancedMCPManager';
import { ClaudeCodeBridge } from '../claude/ClaudeCodeBridge';
import { UIManager } from '../ui/UIManager';
import { TaskStore } from '../stores/TaskStore';
import { ContextStore } from '../stores/ContextStore';
import { LogStore } from '../stores/LogStore';

export interface ControllerOptions {
  configPath?: string;
  enableMCP?: boolean;
}

export class ClaudeCodeController {
  private screen!: blessed.Widgets.Screen;
  private mcpManager: EnhancedMCPManager;
  private claudeBridge: ClaudeCodeBridge;
  private uiManager!: UIManager;
  private taskStore: TaskStore;
  private contextStore: ContextStore;
  private logStore: LogStore;
  private options: ControllerOptions;

  constructor(options: ControllerOptions = {}) {
    this.options = options;
    this.mcpManager = new EnhancedMCPManager();
    this.claudeBridge = new ClaudeCodeBridge();
    this.taskStore = new TaskStore();
    this.contextStore = new ContextStore();
    this.logStore = new LogStore();

    // MCP 이벤트 리스너 설정
    this.setupMCPEventListeners();
  }

  private setupMCPEventListeners() {
    this.mcpManager.on('initialized', (_result) => {
      this.logStore.info('MCP initialization complete', 'MCP');
    });

    this.mcpManager.on('serverDisconnected', (_name, _error) => {
      this.logStore.warn('MCP server disconnected', 'MCP');
    });

    this.mcpManager.on('serverReconnected', (_name) => {
      this.logStore.info('MCP server reconnected', 'MCP');
    });
  }

  async start() {
    console.log('🚀 Starting Claude Code Controller...\n');

    // MCP 서버 연결 (선택적)
    if (this.options.enableMCP !== false) {
      await this.initializeMCP();
    }

    // 화면 초기화
    this.initializeScreen();

    // UI 매니저 생성
    this.uiManager = new UIManager(
      this.screen,
      this.taskStore,
      this.contextStore,
      this.logStore,
      this.claudeBridge,
      this.mcpManager
    );

    // UI 렌더링
    this.uiManager.render();

    // 화면 렌더링
    this.screen.render();

    // 샘플 Task 추가 (개발 모드)
    if (process.env.NODE_ENV === 'development') {
      this.addSampleTasks();
    }

    this.logStore.info('Application started successfully', 'System');
  }

  private addSampleTasks() {
    const sampleTasks = [
      {
        title: 'Welcome to Claude Code Controller',
        description: 'Press Enter to execute this task',
        priority: 'high' as const,
      },
      {
        title: 'Check MCP Connection',
        description: 'Verify MCP servers are connected',
        priority: 'medium' as const,
      },
      {
        title: 'Run Tests',
        description: 'Execute test suite',
        priority: 'low' as const,
      },
    ];

    sampleTasks.forEach((task) => {
      this.taskStore.addTask({
        ...task,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  private initializeScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Claude Code Controller',
      dockBorders: true,
      fullUnicode: true,
      autoPadding: true,
      terminal: 'xterm',
      warnings: false,
    });

    // 종료 키 설정
    this.screen.key(['q', 'C-c'], () => {
      void this.shutdown();
    });

    // 에러 핸들러
    this.screen.on('error', (err) => {
      console.error('Screen error:', err);
    });
  }

  private async initializeMCP() {
    try {
      await this.mcpManager.initialize();
    } catch (error) {
      console.warn('MCP initialization failed:', error);
    }
  }

  private async shutdown() {
    // 정리 작업
    await this.mcpManager.disconnect();

    // 화면 종료
    this.screen.destroy();

    console.log('\n👋 Goodbye!');
    process.exit(0);
  }
}
