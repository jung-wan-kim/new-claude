import * as blessed from 'blessed';
import { ClaudeCodeBridge } from '../../claude/ClaudeCodeBridge';
import { LogStore } from '../../stores/LogStore';

interface WorkPanelOptions {
  parent: blessed.Widgets.Node;
  left: string | number;
  width: string | number;
  height: string | number;
  claudeBridge: ClaudeCodeBridge;
  logStore: LogStore;
}

export class WorkPanel {
  private box: blessed.Widgets.BoxElement;
  private terminal: blessed.Widgets.LogElement;
  private input: blessed.Widgets.TextboxElement;
  private claudeBridge: ClaudeCodeBridge;
  private logStore: LogStore;
  private inputMode = false;

  constructor(options: WorkPanelOptions) {
    this.claudeBridge = options.claudeBridge;
    this.logStore = options.logStore;

    // 패널 컨테이너
    this.box = blessed.box({
      parent: options.parent,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Work Area ',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'white',
        },
      },
    });

    // 터미널 출력 영역
    this.terminal = blessed.log({
      parent: this.box,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-4',
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

    // 입력 영역
    this.input = blessed.textbox({
      parent: this.box,
      bottom: 0,
      left: 0,
      width: '100%-2',
      height: 1,
      inputOnFocus: true,
      style: {
        fg: 'white',
        bg: 'black',
        focus: {
          bg: 'blue',
        },
      },
    });

    this.setupEventHandlers();
    this.showPrompt();
  }

  private setupEventHandlers() {
    // 입력 모드 토글 (i 키)
    this.terminal.key(['i'], () => {
      this.enterInputMode();
    });

    // 터미널 클리어 (Ctrl+K)
    this.terminal.key(['C-k'], () => {
      this.terminal.setContent('');
      this.showPrompt();
      this.box.screen.render();
    });

    // 입력 제출
    this.input.on('submit', async (value) => {
      if (value.trim()) {
        await this.executeCommand(value);
      }
      this.exitInputMode();
    });

    // ESC로 입력 모드 종료
    this.input.key(['escape'], () => {
      this.exitInputMode();
    });

    // Claude 출력 수신
    this.claudeBridge.on('data', (data: string) => {
      this.terminal.add(data);
    });
  }

  private showPrompt() {
    this.terminal.add('{cyan-fg}❯{/cyan-fg} Ready (press \'i\' to input command)');
  }

  private enterInputMode() {
    this.inputMode = true;
    this.input.setValue('');
    this.input.focus();
    this.input.readInput();
    this.box.screen.render();
  }

  private exitInputMode() {
    this.inputMode = false;
    this.input.setValue('');
    this.input.cancel();
    this.terminal.focus();
    this.box.screen.render();
  }

  private async executeCommand(command: string) {
    this.terminal.add(`{cyan-fg}❯{/cyan-fg} ${command}`);
    this.terminal.add('{gray-fg}Executing...{/gray-fg}');
    
    try {
      const result = await this.claudeBridge.execute(command);
      if (result.error) {
        this.terminal.add(`{red-fg}Error: ${result.error}{/red-fg}`);
      }
      this.logStore.addLog('info', `Command executed: ${command}`);
    } catch (error: any) {
      this.terminal.add(`{red-fg}Error: ${error.message}{/red-fg}`);
      this.logStore.addLog('error', `Command failed: ${error.message}`);
    }
    
    this.showPrompt();
  }

  render() {
    // 필요시 업데이트
  }

  focus() {
    if (!this.inputMode) {
      this.terminal.focus();
    }
    this.box.style.border = { fg: 'cyan' };
  }

  unfocus() {
    this.box.style.border = { fg: 'white' };
  }
}