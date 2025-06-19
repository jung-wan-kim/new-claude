import * as blessed from 'blessed';
import { TaskPanel } from './panels/TaskPanel';
import { WorkPanel } from './panels/WorkPanel';
import { ContextPanel } from './panels/ContextPanel';
import { LogPanel } from './panels/LogPanel';
import { StatusBar } from './StatusBar';
import { TaskStore } from '../stores/TaskStore';
import { ContextStore } from '../stores/ContextStore';
import { LogStore } from '../stores/LogStore';
import { ClaudeCodeBridge } from '../claude/ClaudeCodeBridge';
import { MCPManager } from '../mcp/MCPManager';

export class UIManager {
  private screen: blessed.Widgets.Screen;
  private taskPanel!: TaskPanel;
  private workPanel!: WorkPanel;
  private contextPanel!: ContextPanel;
  private logPanel!: LogPanel;
  private statusBar!: StatusBar;
  
  constructor(
    screen: blessed.Widgets.Screen,
    private taskStore: TaskStore,
    private contextStore: ContextStore,
    private logStore: LogStore,
    private claudeBridge: ClaudeCodeBridge,
    private mcpManager: MCPManager
  ) {
    this.screen = screen;
    this.setupLayout();
    this.setupKeyBindings();
  }

  private setupLayout() {
    // 메인 컨테이너
    const container = blessed.box({
      parent: this.screen,
      width: '100%',
      height: '100%-1', // StatusBar 공간 확보
    });

    // 패널 생성 (25% | 40% | 20% | 15%)
    this.taskPanel = new TaskPanel({
      parent: container,
      left: 0,
      width: '25%',
      height: '100%',
      taskStore: this.taskStore,
      mcpManager: this.mcpManager,
    });

    this.workPanel = new WorkPanel({
      parent: container,
      left: '25%',
      width: '40%',
      height: '100%',
      claudeBridge: this.claudeBridge,
      logStore: this.logStore,
    });

    this.contextPanel = new ContextPanel({
      parent: container,
      left: '65%',
      width: '20%',
      height: '100%',
      contextStore: this.contextStore,
      mcpManager: this.mcpManager,
    });

    this.logPanel = new LogPanel({
      parent: container,
      left: '85%',
      width: '15%',
      height: '100%',
      logStore: this.logStore,
    });

    // StatusBar
    this.statusBar = new StatusBar({
      parent: this.screen,
      bottom: 0,
      height: 1,
      taskStore: this.taskStore,
      mcpManager: this.mcpManager,
    });
  }

  private setupKeyBindings() {
    // 패널 전환 (Cmd+1, 2, 3, 4 또는 Ctrl+1, 2, 3, 4)
    this.screen.key(['C-1'], () => {
      this.focusPanel('tasks');
    });
    
    this.screen.key(['C-2'], () => {
      this.focusPanel('work');
    });
    
    this.screen.key(['C-3'], () => {
      this.focusPanel('context');
    });
    
    this.screen.key(['C-4'], () => {
      this.focusPanel('logs');
    });

    // 도움말 (?)
    this.screen.key(['?'], () => {
      this.showHelp();
    });

    // 새로고침 (r)
    this.screen.key(['r'], () => {
      this.render();
    });
  }

  private focusPanel(panel: 'tasks' | 'work' | 'context' | 'logs') {
    // 모든 패널의 포커스 해제
    this.taskPanel.unfocus();
    this.workPanel.unfocus();
    this.contextPanel.unfocus();
    this.logPanel.unfocus();

    // 선택된 패널에 포커스
    switch (panel) {
      case 'tasks':
        this.taskPanel.focus();
        break;
      case 'work':
        this.workPanel.focus();
        break;
      case 'context':
        this.contextPanel.focus();
        break;
      case 'logs':
        this.logPanel.focus();
        break;
    }

    this.screen.render();
  }

  private showHelp() {
    const helpBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: '50%',
      content: `
{center}Claude Code Controller - Help{/center}

{bold}Global Keys:{/bold}
  Ctrl+1-4  Switch panels
  ?         Show this help
  r         Refresh screen
  q         Quit

{bold}Task Panel:{/bold}
  ↑/↓       Navigate tasks
  Enter     Select task
  n         New task

{bold}Work Panel:{/bold}
  i         Input mode
  Esc       Exit input mode
  Ctrl+K    Clear terminal

Press any key to close...`,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
      },
    });

    helpBox.on('keypress', () => {
      helpBox.destroy();
      this.screen.render();
    });

    helpBox.focus();
    this.screen.render();
  }

  render() {
    // 각 패널 업데이트
    this.taskPanel.render();
    this.workPanel.render();
    this.contextPanel.render();
    this.logPanel.render();
    this.statusBar.render();
    
    // 화면 렌더링
    this.screen.render();
  }
}