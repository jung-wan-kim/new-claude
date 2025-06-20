import { EventEmitter } from 'events';
import { LogEntry } from '../shared/types';
import { generateId } from '../shared/utils';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFilter {
  level?: LogLevel;
  source?: string;
  category?: string;
  searchTerm?: string;
}

export class LogStore extends EventEmitter {
  private logs: LogEntry[] = [];
  private filter: LogFilter = {};
  private maxLogs = 1000;
  private categories: Set<string> = new Set();

  addLog(level: LogEntry['level'], message: string, source?: string, details?: any) {
    const log: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      source: source || 'system',
      message,
      details,
      category: this.extractCategory(source || 'system'),
    };

    this.logs.push(log);
    
    // 카테고리 추가
    if (log.category) {
      this.categories.add(log.category);
    }

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
    return this.logs.filter((log) => {
      // 레벨 필터
      if (this.filter.level && log.level !== this.filter.level) {
        return false;
      }
      
      // 소스 필터
      if (this.filter.source && !log.source.includes(this.filter.source)) {
        return false;
      }
      
      // 카테고리 필터
      if (this.filter.category && log.category !== this.filter.category) {
        return false;
      }
      
      // 검색어 필터
      if (this.filter.searchTerm) {
        const searchLower = this.filter.searchTerm.toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(searchLower);
        const matchSource = log.source.toLowerCase().includes(searchLower);
        const matchCategory = log.category?.toLowerCase().includes(searchLower) || false;
        
        if (!matchMessage && !matchSource && !matchCategory) {
          return false;
        }
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

  // 카테고리 관련 메서드
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  private extractCategory(source: string): string {
    // 소스에서 카테고리 추출 (예: 'MCP:TaskManager' -> 'MCP')
    const parts = source.split(':');
    return parts.length > 1 ? parts[0] : source;
  }
}
