import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { MCPManager } from './mcp/MCPManager';
import { ClaudeCodeBridge } from './claude/ClaudeCodeBridge';
import { TerminalManager } from './terminal/TerminalManager';
import { IPC_CHANNELS, DEFAULT_SETTINGS } from '../shared/constants';

class ClaudeCodeController {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private mcpManager: MCPManager;
  private claudeBridge: ClaudeCodeBridge;
  private terminalManager: TerminalManager;
  private store: Store;
  private isQuitting = false;

  constructor() {
    this.mcpManager = new MCPManager();
    this.claudeBridge = new ClaudeCodeBridge();
    this.terminalManager = new TerminalManager();
    this.store = new Store();
  }

  async initialize() {
    // 단일 인스턴스 보장
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    // 두 번째 인스턴스 실행 시 첫 번째 인스턴스 활성화
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
      }
    });

    // 앱 준비
    await app.whenReady();
    
    // 환경 설정
    this.setupApp();
    
    // 컴포넌트 초기화
    await this.initializeComponents();
    
    // 메인 윈도우 생성
    this.createMainWindow();
    
    // IPC 핸들러 설정
    this.setupIPC();
    
    // 시스템 트레이 생성
    this.createTray();
  }

  private setupApp() {
    // macOS Dock 아이콘 설정
    if (process.platform === 'darwin') {
      app.dock.setIcon(path.join(__dirname, '../../assets/icon.png'));
    }
    
    // 앱 이름 설정
    app.setName('Claude Code Controller');
  }

  private async initializeComponents() {
    try {
      // MCP 서버 연결
      await this.mcpManager.initialize();
      console.log('MCP servers connected');
      
      // Claude Code 브리지 초기화
      await this.claudeBridge.initialize();
      console.log('Claude Code bridge initialized');
      
      // 터미널 매니저 초기화
      await this.terminalManager.initialize();
      console.log('Terminal manager initialized');
    } catch (error) {
      console.error('Failed to initialize components:', error);
    }
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: 'Claude Code Controller',
      icon: path.join(__dirname, '../../assets/icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false,
    });

    // 개발 모드에서는 React DevTools 활성화
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
      this.mainWindow.loadURL('http://localhost:3000');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // 윈도우 준비 완료 시 표시
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // 윈도우 닫기 이벤트 처리
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // 윈도우 닫힘 이벤트
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray() {
    const icon = nativeImage.createFromPath(
      path.join(__dirname, '../../assets/tray-icon.png')
    );
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Claude Code Controller');
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          this.mainWindow?.show();
        },
      },
      {
        label: 'Hide',
        click: () => {
          this.mainWindow?.hide();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        },
      },
    ]);
    
    this.tray.setContextMenu(contextMenu);
    
    // 트레이 클릭 시 윈도우 토글
    this.tray.on('click', () => {
      if (this.mainWindow?.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow?.show();
      }
    });
  }

  private setupIPC() {
    // MCP TaskManager
    ipcMain.handle(IPC_CHANNELS.MCP_TASKMANAGER_CREATE, async (_, request) => {
      return this.mcpManager.taskManager.createRequest(
        request.originalRequest,
        request.tasks
      );
    });
    
    ipcMain.handle(IPC_CHANNELS.MCP_TASKMANAGER_NEXT, async (_, { requestId }) => {
      return this.mcpManager.taskManager.getNextTask(requestId);
    });
    
    ipcMain.handle(IPC_CHANNELS.MCP_TASKMANAGER_DONE, async (_, { taskId, status }) => {
      return this.mcpManager.taskManager.markTaskDone(taskId, status);
    });
    
    // MCP Context7
    ipcMain.handle(IPC_CHANNELS.MCP_CONTEXT7_SEARCH, async (_, { query }) => {
      return this.mcpManager.context7.search(query);
    });
    
    ipcMain.handle(IPC_CHANNELS.MCP_CONTEXT7_CREATE, async (_, context) => {
      if (context.action === 'delete') {
        return this.mcpManager.context7.deleteContext(context.id);
      } else if (context.id && context.updates) {
        return this.mcpManager.context7.updateContext(context.id, context.updates);
      } else {
        return this.mcpManager.context7.createContext(context);
      }
    });
    
    // Claude Code
    ipcMain.handle(IPC_CHANNELS.CLAUDE_EXECUTE, async (_, { command, context }) => {
      return this.claudeBridge.execute(command, { context });
    });
    
    ipcMain.handle(IPC_CHANNELS.CLAUDE_KILL, async () => {
      return this.claudeBridge.kill();
    });
    
    // Claude 스트리밍 설정
    this.claudeBridge.on('data', (data) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.CLAUDE_STREAM_DATA, data);
    });
    
    // Terminal
    ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE, async () => {
      const id = await this.terminalManager.createTerminal();
      
      // 터미널 출력 전달
      this.terminalManager.on(`data-${id}`, (data) => {
        this.mainWindow?.webContents.send(IPC_CHANNELS.TERMINAL_OUTPUT, data);
      });
      
      return id;
    });
    
    ipcMain.on(IPC_CHANNELS.TERMINAL_INPUT, (_, data) => {
      const terminals = this.terminalManager.getActiveTerminals();
      if (terminals.length > 0) {
        this.terminalManager.write(terminals[0], data);
      }
    });
    
    ipcMain.on(IPC_CHANNELS.TERMINAL_RESIZE, (_, { cols, rows }) => {
      const terminals = this.terminalManager.getActiveTerminals();
      if (terminals.length > 0) {
        this.terminalManager.resize(terminals[0], cols, rows);
      }
    });
    
    // Settings
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
      return this.store.get('settings', DEFAULT_SETTINGS);
    });
    
    ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_, settings) => {
      this.store.set('settings', settings);
      return settings;
    });
    
    ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
      this.store.set('settings', DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    });
  }
}

// 앱 인스턴스 생성 및 초기화
const controller = new ClaudeCodeController();
controller.initialize().catch(console.error);

// 앱 종료 처리
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 재활성화 처리
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    controller.createMainWindow();
  }
});