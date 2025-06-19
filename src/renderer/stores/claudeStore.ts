import { create } from 'zustand';
import { ClaudeCommand } from '../../shared/types';
import { generateId } from '../../shared/utils';

interface ClaudeStore {
  isConnected: boolean;
  isExecuting: boolean;
  currentCommand: string | null;
  output: string;
  history: ClaudeCommand[];
  
  initialize: () => Promise<void>;
  executeCommand: (command: string, context?: string[]) => Promise<void>;
  clearOutput: () => void;
  stopExecution: () => Promise<void>;
}

export const useClaudeStore = create<ClaudeStore>((set, get) => ({
  isConnected: false,
  isExecuting: false,
  currentCommand: null,
  output: '',
  history: [],
  
  initialize: async () => {
    // Claude Code 연결 상태 확인
    if (window.electronAPI) {
      try {
        const isConnected = await window.electronAPI.checkClaudeConnection();
        set({ isConnected });
        
        // 스트림 데이터 수신 리스너 설정
        window.electronAPI.onClaudeOutput((data: string) => {
          set((state) => ({ output: state.output + data }));
        });
      } catch (error) {
        console.error('Failed to initialize Claude store:', error);
      }
    }
  },
  
  executeCommand: async (command, context) => {
    const commandObj: ClaudeCommand = {
      id: generateId(),
      command,
      context,
      status: 'running',
      startedAt: new Date().toISOString(),
    };
    
    set({
      isExecuting: true,
      currentCommand: command,
      output: get().output + `\n$ ${command}\n`,
    });
    
    set((state) => ({
      history: [...state.history, commandObj],
    }));
    
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.executeClaudeCommand(command, context);
        
        set((state) => ({
          history: state.history.map(cmd =>
            cmd.id === commandObj.id
              ? {
                  ...cmd,
                  status: 'completed',
                  output: result.output,
                  completedAt: new Date().toISOString(),
                }
              : cmd
          ),
          isExecuting: false,
        }));
      } catch (error: any) {
        set((state) => ({
          output: state.output + `\nError: ${error.message}\n`,
          history: state.history.map(cmd =>
            cmd.id === commandObj.id
              ? {
                  ...cmd,
                  status: 'failed',
                  error: error.message,
                  completedAt: new Date().toISOString(),
                }
              : cmd
          ),
          isExecuting: false,
        }));
      }
    }
  },
  
  clearOutput: () => {
    set({ output: '' });
  },
  
  stopExecution: async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.stopClaudeExecution();
        set({ isExecuting: false });
      } catch (error) {
        console.error('Failed to stop execution:', error);
      }
    }
  },
}));