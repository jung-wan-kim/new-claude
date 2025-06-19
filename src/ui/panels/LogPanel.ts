import * as blessed from 'blessed';
import { LogStore } from '../../stores/LogStore';

interface LogPanelOptions {
  parent: blessed.Widgets.Node;
  left: string | number;
  width: string | number;
  height: string | number;
  logStore: LogStore;
}

export class LogPanel {
  private box: blessed.Widgets.BoxElement;
  private log: blessed.Widgets.BoxElement; // LogElement를 BoxElement로 변경
  private logStore: LogStore;

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

    // 로그 영역
    this.log = blessed.box({
      parent: this.box,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
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
          bg: 'blue',
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
      this.logStore.clearLogs();
      this.render();
      this.box.screen.render();
    });

    // 필터 (f 키)
    this.log.key(['f'], () => {
      this.showFilterDialog();
    });
  }

  private showFilterDialog() {
    const form = blessed.form({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: '40%',
      height: 8,
      label: ' Filter Logs ',
      border: {
        type: 'line',
      },
      keys: true,
    });

    const levelSelect = blessed.list({
      parent: form,
      top: 1,
      left: 2,
      width: '100%-4',
      height: 4,
      label: ' Level: ',
      items: ['All', 'Debug', 'Info', 'Warn', 'Error'],
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
        },
      },
    });

    levelSelect.on('select', (item) => {
      const level = item.getText().toLowerCase();
      if (level === 'all') {
        this.logStore.setFilter({});
      } else {
        this.logStore.setFilter({ level: level as any });
      }
      form.destroy();
      this.render();
      this.box.screen.render();
    });

    levelSelect.focus();
    this.box.screen.render();
  }

  render() {
    const logs = this.logStore.getFilteredLogs();
    const content: string[] = [];
    
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const levelColor = {
        debug: 'gray',
        info: 'white',
        warn: 'yellow',
        error: 'red',
      }[log.level] || 'white';
      
      const icon = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[log.level] || '•';
      
      content.push(`{gray-fg}${timestamp}{/} ${icon} {${levelColor}-fg}[${log.level.toUpperCase()}]{/} ${log.message}`);
    });
    
    this.log.setContent(content.join('\n'));
  }

  focus() {
    this.log.focus();
    this.box.style.border = { fg: 'cyan' };
  }

  unfocus() {
    this.box.style.border = { fg: 'white' };
  }
}