import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import path from 'path';
import { MCPManager } from './mcp/MCPManager';
import { ClaudeCodeBridge } from './claude/ClaudeCodeBridge';
import { TerminalManager } from './terminal/TerminalManager';
import { autoUpdater } from 'electron-updater';

class ClaudeCodeController {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private mcpManager: MCPManager;
  private claudeBridge: ClaudeCodeBridge;
  private terminalManager: TerminalManager;

  constructor() {
    this.mcpManager = new MCPManager();
    this.claudeBridge = new ClaudeCodeBridge();
    this.terminalManager = new TerminalManager();
  }

  async initialize() {
    // 앱 기본 설정
    app.name = 'Claude Code Controller';
    
    // 단일 인스턴스 보장
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    // 앱 이벤트 처리
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    await app.whenReady();
    
    // 초기화 순서
    await this.setupTray();
    await this.createMainWindow();
    await this.connectMCPServers();
    await this.initializeIPC();
    
    // 자동 업데이트 체크
    autoUpdater.checkForUpdatesAndNotify();
  }

  private async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: 'Claude Code Controller',
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#1e1e1e',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
    });

    // 개발 모드에서는 로컬 서버, 프로덕션에서는 파일 로드
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // macOS dock 숨김 처리
    this.mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });
  }

  private async setupTray() {
    this.tray = new Tray(path.join(__dirname, '../../assets/tray-icon.png'));
    
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
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setToolTip('Claude Code Controller');
    this.tray.setContextMenu(contextMenu);
    
    // 트레이 클릭 시 창 토글
    this.tray.on('click', () => {
      if (this.mainWindow?.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow?.show();
      }
    });
  }

  private async connectMCPServers() {
    try {
      await this.mcpManager.connect();
      console.log('MCP servers connected successfully');
    } catch (error) {
      console.error('Failed to connect MCP servers:', error);
    }
  }

  private async initializeIPC() {
    // MCP 관련 IPC
    ipcMain.handle('mcp:taskmanager:createRequest', async (_, data) => {
      return await this.mcpManager.taskManager.createRequest(data);
    });

    ipcMain.handle('mcp:context7:search', async (_, query) => {
      return await this.mcpManager.context7.search(query);
    });

    // Claude Code 관련 IPC
    ipcMain.handle('claude:execute', async (_, command) => {
      return await this.claudeBridge.execute(command);
    });

    ipcMain.on('claude:stream', (event, command) => {
      this.claudeBridge.executeStream(command, (data) => {
        event.reply('claude:stream:data', data);
      });
    });

    // Terminal 관련 IPC
    ipcMain.handle('terminal:create', async () => {
      return await this.terminalManager.createTerminal();
    });

    ipcMain.on('terminal:input', (_, { id, data }) => {
      this.terminalManager.write(id, data);
    });
  }
}

// 앱 인스턴스 생성 및 초기화
const app = new ClaudeCodeController();
app.initialize().catch(console.error);

// 앱 종료 처리
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 재활성화 처리
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.createMainWindow();
  }
});

// 종료 전 정리
app.on('before-quit', () => {
  app.isQuitting = true;
});