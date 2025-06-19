import { create } from 'zustand';
import { LogEntry } from '../../shared/types';
import { generateId } from '../../shared/utils';

interface LogFilter {
  level?: LogEntry['level'];
  source?: string;
}

interface LogStore {
  logs: LogEntry[];
  filter: LogFilter;
  
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setFilter: (filter: LogFilter) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  filter: {},
  
  addLog: (log) => {
    const entry: LogEntry = {
      ...log,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    
    set((state) => ({
      logs: [...state.logs, entry].slice(-1000), // 최대 1000개 로그 유지
    }));
  },
  
  clearLogs: () => {
    set({ logs: [] });
  },
  
  setFilter: (filter) => {
    set({ filter });
  },
}));