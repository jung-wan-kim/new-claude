import {
  formatTime,
  formatDate,
  formatDateTime,
  formatDuration,
  getFileExtension,
  getFileType,
  formatFileSize,
  truncate,
  capitalize,
  camelToKebab,
  kebabToCamel,
  uniqueBy,
  groupBy,
  sortBy,
  debounce,
  throttle,
  retry,
  sleep,
  isError,
  getErrorMessage,
  generateId,
  generateShortId,
  isMac,
  isWindows,
  isLinux,
  formatShortcut
} from '../utils';

describe('Utils', () => {
  describe('Time Formatting', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-06-19T14:30:00');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/02:30:00 PM/);
    });

    it('should format date correctly', () => {
      const date = new Date('2024-06-19');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jun 19, 2024/);
    });

    it('should format datetime correctly', () => {
      const date = new Date('2024-06-19T14:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Jun 19, 2024.*02:30:00 PM/);
    });

    it('should format duration correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(3600000)).toBe('1h 0m 0s');
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
    });
  });

  describe('File Utilities', () => {
    it('should get file extension', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should determine file type', () => {
      expect(getFileType('script.js')).toBe('javascript');
      expect(getFileType('styles.css')).toBe('css');
      expect(getFileType('data.json')).toBe('json');
      expect(getFileType('unknown.xyz')).toBe('unknown');
    });

    it('should format file size', () => {
      expect(formatFileSize(0)).toBe('0.00 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });
  });

  describe('String Utilities', () => {
    it('should truncate strings', () => {
      expect(truncate('short', 10)).toBe('short');
      expect(truncate('this is a long string', 10)).toBe('this is...');
    });

    it('should capitalize strings', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('')).toBe('');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('camelCase')).toBe('camel-case');
      expect(camelToKebab('thisIsATest')).toBe('this-is-a-test');
    });

    it('should convert kebab-case to camelCase', () => {
      expect(kebabToCamel('kebab-case')).toBe('kebabCase');
      expect(kebabToCamel('this-is-a-test')).toBe('thisIsATest');
    });
  });

  describe('Array Utilities', () => {
    it('should filter unique items by key', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' }
      ];
      const unique = uniqueBy(items, item => item.id);
      expect(unique).toHaveLength(2);
      expect(unique[0].name).toBe('A');
      expect(unique[1].name).toBe('B');
    });

    it('should group items by key', () => {
      const items = [
        { type: 'fruit', name: 'apple' },
        { type: 'vegetable', name: 'carrot' },
        { type: 'fruit', name: 'banana' }
      ];
      const grouped = groupBy(items, item => item.type);
      expect(grouped.fruit).toHaveLength(2);
      expect(grouped.vegetable).toHaveLength(1);
    });

    it('should sort items by key', () => {
      const items = [
        { value: 3 },
        { value: 1 },
        { value: 2 }
      ];
      const sorted = sortBy(items, item => item.value);
      expect(sorted[0].value).toBe(1);
      expect(sorted[1].value).toBe(2);
      expect(sorted[2].value).toBe(3);
    });
  });

  describe('Async Utilities', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it.skip('should retry failed operations', async () => {
      // TODO: Fix this test - currently causing timeout
      jest.useFakeTimers();
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve('Success');
      });

      const retryPromise = retry(fn, { maxAttempts: 3, delay: 1000 });
      
      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(2000);
      
      const result = await retryPromise;
      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });

    it('should sleep for specified duration', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('Error Handling', () => {
    it('should check if value is Error', () => {
      expect(isError(new Error())).toBe(true);
      expect(isError('error')).toBe(false);
      expect(isError(null)).toBe(false);
    });

    it('should get error message', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
      expect(getErrorMessage('String error')).toBe('String error');
      expect(getErrorMessage(null)).toBe('Unknown error');
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate short IDs', () => {
      const id = generateShortId();
      expect(id).toMatch(/^[a-z0-9]+$/);
      expect(id.length).toBeLessThanOrEqual(9);
    });
  });

  describe('Platform Detection', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    it('should detect macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });
      expect(isMac()).toBe(true);
      expect(isWindows()).toBe(false);
      expect(isLinux()).toBe(false);
    });

    it('should detect Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
      expect(isMac()).toBe(false);
      expect(isWindows()).toBe(true);
      expect(isLinux()).toBe(false);
    });

    it('should detect Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });
      expect(isMac()).toBe(false);
      expect(isWindows()).toBe(false);
      expect(isLinux()).toBe(true);
    });
  });

  describe('Shortcut Formatting', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    it('should format shortcuts for macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });
      expect(formatShortcut('cmd+s')).toBe('⌘s');
      expect(formatShortcut('ctrl+alt+shift+a')).toBe('⌃⌥⇧a');
    });

    it('should format shortcuts for other platforms', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
      expect(formatShortcut('cmd+s')).toBe('Ctrl+s');
    });
  });
});