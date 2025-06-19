import { EventEmitter } from 'events';
import { LogEntry } from '../shared/types';
import { generateId } from '../shared/utils';

interface LogFilter {
  level?: LogEntry['level'];
  source?: string;
}

export class LogStore extends EventEmitter {
  private logs: LogEntry[] = [];
  private filter: LogFilter = {};
  private maxLogs = 1000;

  addLog(level: LogEntry['level'], message: string, source?: string, details?: any) {
    const log: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      source: source || 'system',
      message,
      details,
    };

    this.logs.push(log);
    
    // 최대 로그 수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.emit('log', log);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getFilteredLogs(): LogEntry[] {
    return this.logs.filter(log => {
      if (this.filter.level && log.level !== this.filter.level) {
        return false;
      }
      if (this.filter.source && !log.source.includes(this.filter.source)) {
        return false;
      }
      return true;
    });
  }

  setFilter(filter: LogFilter) {
    this.filter = filter;
    this.emit('filter-changed', filter);
  }

  getFilter(): LogFilter {
    return this.filter;
  }

  clearLogs() {
    this.logs = [];
    this.emit('cleared');
  }

  // 편의 메서드
  debug(message: string, source?: string, details?: any) {
    this.addLog('debug', message, source, details);
  }

  info(message: string, source?: string, details?: any) {
    this.addLog('info', message, source, details);
  }

  warn(message: string, source?: string, details?: any) {
    this.addLog('warn', message, source, details);
  }

  error(message: string, source?: string, details?: any) {
    this.addLog('error', message, source, details);
  }
}