import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';

// Renderer 프로세스에 노출할 API
const electronAPI = {
  // MCP TaskManager
  getRequests: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_TASKMANAGER_CREATE),
  createRequest: (request: any) => ipcRenderer.invoke(IPC_CHANNELS.MCP_TASKMANAGER_CREATE, request),
  updateTaskStatus: (taskId: string, status: string) => 
    ipcRenderer.invoke(IPC_CHANNELS.MCP_TASKMANAGER_DONE, { taskId, status }),
  
  // MCP Context7
  getContexts: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_CONTEXT7_SEARCH, { query: '' }),
  searchContexts: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.MCP_CONTEXT7_SEARCH, { query }),
  createContext: (context: any) => ipcRenderer.invoke(IPC_CHANNELS.MCP_CONTEXT7_CREATE, context),
  updateContext: (id: string, updates: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.MCP_CONTEXT7_CREATE, { id, updates }),
  deleteContext: (id: string) => 
    ipcRenderer.invoke(IPC_CHANNELS.MCP_CONTEXT7_CREATE, { id, action: 'delete' }),
  
  // Claude Code
  checkClaudeConnection: () => ipcRenderer.invoke(IPC_CHANNELS.CLAUDE_EXECUTE, { command: '--version' }),
  executeClaudeCommand: (command: string, context?: string[]) => 
    ipcRenderer.invoke(IPC_CHANNELS.CLAUDE_EXECUTE, { command, context }),
  stopClaudeExecution: () => ipcRenderer.invoke(IPC_CHANNELS.CLAUDE_KILL),
  onClaudeOutput: (callback: (data: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CLAUDE_STREAM_DATA, (_, data) => callback(data));
  },
  
  // Terminal
  createTerminal: () => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE),
  sendTerminalInput: (data: string) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_INPUT, data),
  onTerminalOutput: (callback: (data: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TERMINAL_OUTPUT, (_, data) => callback(data));
  },
  resizeTerminal: (cols: number, rows: number) => 
    ipcRenderer.send(IPC_CHANNELS.TERMINAL_RESIZE, { cols, rows }),
  
  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  resetSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET),
  
  // App
  onAppError: (callback: (error: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.APP_ERROR, (_, error) => callback(error));
  },
};

// Window 객체에 API 노출
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript 타입 정의를 위한 global 확장
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}