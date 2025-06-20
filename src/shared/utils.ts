// 유틸리티 함수들

import { FILE_EXTENSIONS } from './constants';

// 시간 포맷팅
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// 파일 유틸리티
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFileType(filename: string): string {
  const ext = getFileExtension(filename);

  for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return type;
    }
  }

  return 'unknown';
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 문자열 유틸리티
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// 배열 유틸리티
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

export function sortBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
}

// 비동기 유틸리티
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await sleep(waitTime);
      }
    }
  }

  throw lastError!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 에러 처리
export function isError(value: any): value is Error {
  return value instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'Unknown error';
  }
}

// ID 생성
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 플랫폼 체크
export function isMac(): boolean {
  return process.platform === 'darwin';
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function isLinux(): boolean {
  return process.platform === 'linux';
}

// 단축키 포맷팅
export function formatShortcut(shortcut: string): string {
  if (isMac()) {
    return shortcut
      .replace(/cmd/gi, '⌘')
      .replace(/ctrl/gi, '⌃')
      .replace(/alt/gi, '⌥')
      .replace(/shift/gi, '⇧')
      .replace(/\+/g, '');
  } else {
    return shortcut.replace(/cmd/gi, 'Ctrl').replace(/\+/g, '+');
  }
}
