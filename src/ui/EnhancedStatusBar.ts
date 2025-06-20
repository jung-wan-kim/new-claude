import * as blessed from 'blessed';
import { ThemeManager } from './components/ThemeManager';

export interface StatusInfo {
  mode: string;
  focusedPanel: string;
  activeTask?: {
    title: string;
    progress?: number;
  };
  mcpServers: {
    taskManager?: { connected: boolean; status?: string };
    context7?: { connected: boolean; status?: string };
  };
  inputMode?: boolean;
  commandMode?: boolean;
}

export class EnhancedStatusBar {
  private box: blessed.Widgets.BoxElement;
  private leftSection: blessed.Widgets.TextElement;
  private centerSection: blessed.Widgets.TextElement;
  private rightSection: blessed.Widgets.TextElement;
  private spinner: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex: number = 0;
  private spinnerTimer?: NodeJS.Timeout;

  constructor(
    private parent: blessed.Widgets.Screen,
    _themeManager: ThemeManager
  ) {
    this.box = blessed.box({
      parent: this.parent,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      style: {
        bg: 'blue',
        fg: 'white',
      },
    });

    // 왼쪽 섹션 - 모드와 포커스 정보
    this.leftSection = blessed.text({
      parent: this.box,
      left: 0,
      width: '33%',
      height: 1,
      align: 'left',
      content: ' Normal | Tasks ',
      style: {
        bg: 'blue',
        fg: 'white',
      },
    });

    // 중앙 섹션 - 작업 정보
    this.centerSection = blessed.text({
      parent: this.box,
      left: '33%',
      width: '34%',
      height: 1,
      align: 'center',
      content: 'Ready',
      style: {
        bg: 'blue',
        fg: 'white',
      },
    });

    // 오른쪽 섹션 - 연결 상태와 시간
    this.rightSection = blessed.text({
      parent: this.box,
      right: 0,
      width: '33%',
      height: 1,
      align: 'right',
      content: `MCP: -- | ${this.getTime()} `,
      style: {
        bg: 'blue',
        fg: 'white',
      },
    });

    // 1초마다 시간 업데이트
    setInterval(() => this.updateTime(), 1000);
  }

  updateStatus(status: StatusInfo) {
    // 왼쪽: 모드와 포커스 정보
    let modeDisplay = status.mode;
    if (status.inputMode) {
      modeDisplay = '{yellow-fg}INSERT{/}';
    } else if (status.commandMode) {
      modeDisplay = '{cyan-fg}COMMAND{/}';
    } else {
      modeDisplay = '{green-fg}NORMAL{/}';
    }
    
    const focusIcon = this.getFocusIcon(status.focusedPanel);
    this.leftSection.setContent(` ${modeDisplay} | ${focusIcon} ${status.focusedPanel} `);

    // 중앙: 작업 정보
    if (status.activeTask) {
      this.startSpinner();
      const progress = status.activeTask.progress ? ` ${this.getProgressBar(status.activeTask.progress)}` : '';
      this.centerSection.setContent(
        `${this.spinner[this.spinnerIndex]} ${status.activeTask.title}${progress}`
      );
    } else {
      this.stopSpinner();
      this.centerSection.setContent('{dim-fg}Ready - Press ? for help{/}');
    }

    // 오른쪽: 연결 상태
    const mcpStatus = this.getMCPStatusIcons(status.mcpServers);
    this.rightSection.setContent(` ${mcpStatus} | ${this.getTime()} `);

    this.parent.render();
  }

  private getMCPStatusIcons(servers: any): string {
    let icons = '';

    // TaskManager status
    if (servers.taskManager) {
      const icon = servers.taskManager.connected ? '●' : '○';
      const color = servers.taskManager.connected ? '{green-fg}' : '{red-fg}';
      const status = servers.taskManager.status || (servers.taskManager.connected ? 'OK' : 'OFF');
      icons += `${color}TM:${icon}{/}`;
    } else {
      icons += '{gray-fg}TM:○{/}';
    }

    icons += ' ';

    // Context7 status
    if (servers.context7) {
      const icon = servers.context7.connected ? '●' : '○';
      const color = servers.context7.connected ? '{green-fg}' : '{red-fg}';
      const status = servers.context7.status || (servers.context7.connected ? 'OK' : 'OFF');
      icons += `${color}C7:${icon}{/}`;
    } else {
      icons += '{gray-fg}C7:○{/}';
    }

    return icons;
  }

  private startSpinner() {
    if (this.spinnerTimer) return;

    this.spinnerTimer = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
      this.updateSpinner();
    }, 80);
  }

  private stopSpinner() {
    if (this.spinnerTimer) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = undefined;
      this.spinnerIndex = 0;
    }
  }

  private updateSpinner() {
    const content = this.centerSection.getContent();
    const newContent = content.replace(/^./, this.spinner[this.spinnerIndex]);
    this.centerSection.setContent(newContent);
    this.parent.render();
  }

  private updateTime() {
    const content = this.rightSection.getContent();
    const timeRegex = /\d{2}:\d{2}:\d{2}/;
    const newContent = content.replace(timeRegex, this.getTime());
    this.rightSection.setContent(newContent);
    this.parent.render();
  }

  private getTime(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private getFocusIcon(panel: string): string {
    const icons: { [key: string]: string } = {
      'Tasks': '📋',
      'Work': '💻',
      'Context': '📚',
      'Logs': '📜',
    };
    return icons[panel] || '📄';
  }

  private getProgressBar(progress: number): string {
    const width = 10;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${progress}%`;
  }

  showMessage(message: string, duration: number = 3000) {
    const originalContent = this.centerSection.getContent();
    this.centerSection.setContent(message);
    this.parent.render();

    setTimeout(() => {
      this.centerSection.setContent(originalContent);
      this.parent.render();
    }, duration);
  }

  setTheme(theme: string) {
    const bgColor = theme === 'dark' ? 'blue' : theme === 'light' ? 'cyan' : 'yellow';
    const fgColor = theme === 'dark' ? 'white' : 'black';

    this.box.style.bg = bgColor;
    this.box.style.fg = fgColor;

    [this.leftSection, this.centerSection, this.rightSection].forEach((section) => {
      section.style.bg = bgColor;
      section.style.fg = fgColor;
    });

    this.parent.render();
  }
}
