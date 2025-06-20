import * as blessed from 'blessed';
import { LogStore, LogLevel } from '../../stores/LogStore';

interface LogPanelOptions {
  parent: blessed.Widgets.Node;
  left: string | number;
  width: string | number;
  height: string | number;
  logStore: LogStore;
}

interface LogFilter {
  level?: LogLevel;
  category?: string;
  searchTerm?: string;
}

export class EnhancedLogPanel {
  private box: blessed.Widgets.BoxElement;
  private log: blessed.Widgets.BoxElement;
  private searchBox?: blessed.Widgets.TextboxElement;
  private filterStatus: blessed.Widgets.TextElement;
  private logStore: LogStore;
  private currentFilter: LogFilter = {};
  private isSearchMode: boolean = false;

  constructor(options: LogPanelOptions) {
    this.logStore = options.logStore;

    // 패널 컨테이너
    this.box = blessed.box({
      parent: options.parent,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Logs ',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'white',
        },
      },
    });

    // 필터 상태 표시
    this.filterStatus = blessed.text({
      parent: this.box,
      top: 0,
      left: 1,
      width: '100%-3',
      height: 1,
      content: 'All logs',
      style: {
        fg: 'gray',
      },
    });

    // 로그 영역
    this.log = blessed.box({
      parent: this.box,
      top: 1,
      left: 0,
      width: '100%-2',
      height: '100%-3',
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: true,
      tags: true,
      style: {
        fg: 'white',
        bg: 'black',
        scrollbar: {
          ch: '┃',
          inverse: false,
        },
      },
      scrollbar: {
        ch: '┃',
        track: {
          bg: 'cyan',
        },
        style: {
          inverse: true,
        },
      },
    });

    this.setupEventHandlers();
    this.render();

    // 로그 업데이트 리스너
    this.logStore.on('log', () => {
      this.render();
      this.box.screen.render();
    });
  }

  private setupEventHandlers() {
    // 로그 클리어 (c 키)
    this.log.key(['c'], () => {
      this.showClearConfirmation();
    });

    // 레벨 필터 (l 키)
    this.log.key(['l'], () => {
      this.showLevelFilter();
    });

    // 카테고리 필터 (g 키)
    this.log.key(['g'], () => {
      this.showCategoryFilter();
    });

    // 검색 (/ 키)
    this.log.key(['/'], () => {
      this.enterSearchMode();
    });

    // 필터 리셋 (r 키)
    this.log.key(['r'], () => {
      this.resetFilters();
    });

    // 위아래 스크롤
    this.log.key(['up', 'k'], () => {
      this.log.scroll(-1);
      this.box.screen.render();
    });

    this.log.key(['down', 'j'], () => {
      this.log.scroll(1);
      this.box.screen.render();
    });

    // 페이지 스크롤
    this.log.key(['pageup', 'b'], () => {
      this.log.scroll(-this.log.height);
      this.box.screen.render();
    });

    this.log.key(['pagedown', 'f'], () => {
      this.log.scroll(this.log.height as number);
      this.box.screen.render();
    });

    // 처음/끝으로
    this.log.key(['home', 'g'], () => {
      this.log.setScrollPerc(0);
      this.box.screen.render();
    });

    this.log.key(['end', 'G'], () => {
      this.log.setScrollPerc(100);
      this.box.screen.render();
    });
  }

  private showClearConfirmation() {
    const confirm = blessed.question({
      parent: this.box.screen,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      label: ' Clear Logs ',
      tags: true,
      keys: true,
      vi: true,
      style: {
        border: { fg: 'red' },
        label: { fg: 'red', bold: true },
      },
    });

    confirm.ask('Clear all logs? (y/n)', (_err, value) => {
      if (value && value.toLowerCase() === 'y') {
        this.logStore.clearLogs();
        this.render();
      }
      this.box.screen.render();
    });
  }

  private showLevelFilter() {
    const form = blessed.form({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: 30,
      height: 8,
      label: ' Filter by Level ',
      border: {
        type: 'line',
      },
      keys: true,
      style: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow', bold: true },
      },
    });

    const levelSelect = blessed.list({
      parent: form,
      top: 1,
      left: 1,
      width: '100%-3',
      height: 5,
      items: ['All', 'Debug', 'Info', 'Warn', 'Error'],
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
        },
      },
      keys: true,
      mouse: true,
    });

    levelSelect.on('select', (item) => {
      const level = item.getText().toLowerCase();
      if (level === 'all') {
        delete this.currentFilter.level;
      } else {
        this.currentFilter.level = level as LogLevel;
      }
      form.destroy();
      this.applyFilters();
    });

    form.key(['escape'], () => {
      form.destroy();
      this.box.screen.render();
    });

    levelSelect.focus();
    this.box.screen.render();
  }

  private showCategoryFilter() {
    const categories = this.logStore.getCategories();

    const form = blessed.form({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: 40,
      height: Math.min(categories.length + 4, 20),
      label: ' Filter by Category ',
      border: {
        type: 'line',
      },
      keys: true,
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'cyan', bold: true },
      },
    });

    const categorySelect = blessed.list({
      parent: form,
      top: 1,
      left: 1,
      width: '100%-3',
      height: '100%-3',
      items: ['All', ...categories],
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
        },
      },
      keys: true,
      mouse: true,
      scrollable: true,
    });

    categorySelect.on('select', (item) => {
      const category = item.getText();
      if (category === 'All') {
        delete this.currentFilter.category;
      } else {
        this.currentFilter.category = category;
      }
      form.destroy();
      this.applyFilters();
    });

    form.key(['escape'], () => {
      form.destroy();
      this.box.screen.render();
    });

    categorySelect.focus();
    this.box.screen.render();
  }

  private enterSearchMode() {
    if (this.isSearchMode) return;

    this.isSearchMode = true;

    this.searchBox = blessed.textbox({
      parent: this.box,
      bottom: 0,
      left: 0,
      width: '100%-2',
      height: 1,
      style: {
        bg: 'blue',
        fg: 'white',
      },
      inputOnFocus: true,
    });

    this.searchBox.setValue('/');
    this.searchBox.focus();

    this.searchBox.on('submit', (value) => {
      const searchTerm = value.replace(/^\//, '').trim();
      if (searchTerm) {
        this.currentFilter.searchTerm = searchTerm;
      } else {
        delete this.currentFilter.searchTerm;
      }

      this.exitSearchMode();
      this.applyFilters();
    });

    this.searchBox.key(['escape'], () => {
      this.exitSearchMode();
    });

    this.box.screen.render();
  }

  private exitSearchMode() {
    if (!this.isSearchMode || !this.searchBox) return;

    this.isSearchMode = false;
    this.searchBox.destroy();
    this.searchBox = undefined;
    this.log.focus();
    this.box.screen.render();
  }

  private resetFilters() {
    this.currentFilter = {};
    this.applyFilters();
  }

  private applyFilters() {
    this.logStore.setFilter(this.currentFilter);
    this.updateFilterStatus();
    this.render();
    this.box.screen.render();
  }

  private updateFilterStatus() {
    const parts: string[] = [];

    if (this.currentFilter.level) {
      parts.push(`Level: ${this.currentFilter.level}`);
    }

    if (this.currentFilter.category) {
      parts.push(`Cat: ${this.currentFilter.category}`);
    }

    if (this.currentFilter.searchTerm) {
      parts.push(`Search: "${this.currentFilter.searchTerm}"`);
    }

    const status = parts.length > 0 ? parts.join(' | ') : 'All logs';
    this.filterStatus.setContent(status);
  }

  render() {
    const logs = this.logStore.getFilteredLogs();
    const content: string[] = [];

    logs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const levelColor = this.getLevelColor(log.level);
      const icon = this.getLevelIcon(log.level);
      const categoryStr = log.category ? `[${log.category}] ` : '';

      let message = log.message;

      // 검색어 하이라이트
      if (this.currentFilter.searchTerm) {
        const regex = new RegExp(`(${this.escapeRegex(this.currentFilter.searchTerm)})`, 'gi');
        message = message.replace(regex, '{yellow-bg}{black-fg}$1{/}');
      }

      content.push(
        `{gray-fg}${timestamp}{/} ${icon} {${levelColor}-fg}[${log.level.toUpperCase()}]{/} {dim-fg}${categoryStr}{/}${message}`
      );
    });

    this.log.setContent(content.join('\n'));

    // 자동 스크롤 (새 로그가 추가될 때)
    if (!this.isSearchMode) {
      this.log.setScrollPerc(100);
    }
  }

  private getLevelColor(level: LogLevel): string {
    const colors: { [key in LogLevel]: string } = {
      debug: 'gray',
      info: 'white',
      warn: 'yellow',
      error: 'red',
    };
    return colors[level] || 'white';
  }

  private getLevelIcon(level: LogLevel): string {
    const icons: { [key in LogLevel]: string } = {
      debug: '◯',
      info: 'ℹ',
      warn: '⚠',
      error: '✖',
    };
    return icons[level] || '•';
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  focus() {
    this.log.focus();
    this.box.style.border = { fg: 'cyan' };
    this.box.setLabel(' Logs (f:filter l:level g:category /:search c:clear r:reset) ');
  }

  unfocus() {
    this.box.style.border = { fg: 'white' };
    this.box.setLabel(' Logs ');
  }
}
