import * as blessed from 'blessed';
import { TaskPanel } from './panels/TaskPanel';
import { WorkPanel } from './panels/WorkPanel';
import { ContextPanel } from './panels/ContextPanel';
import { LogPanel } from './panels/LogPanel';
import { StatusBar } from './StatusBar';
import { EnhancedTaskPanel } from './panels/EnhancedTaskPanel';
import { EnhancedStatusBar } from './EnhancedStatusBar';
import { ThemeManager } from './components/ThemeManager';
import { NotificationManager } from './components/NotificationManager';
import { HelpModal } from './components/HelpModal';
import { TaskStore } from '../stores/TaskStore';
import { ContextStore } from '../stores/ContextStore';
import { LogStore } from '../stores/LogStore';
import { ClaudeCodeBridge } from '../claude/ClaudeCodeBridge';
import { EnhancedMCPManager } from '../mcp/EnhancedMCPManager';
import { TaskExecutor } from '../workflows/TaskExecutor';

export class UIManager {
  private screen: blessed.Widgets.Screen;
  private taskPanel!: TaskPanel;
  private enhancedTaskPanel!: EnhancedTaskPanel;
  private workPanel!: WorkPanel;
  private contextPanel!: ContextPanel;
  private logPanel!: LogPanel;
  private statusBar!: StatusBar;
  private enhancedStatusBar!: EnhancedStatusBar;
  private themeManager: ThemeManager;
  private notificationManager: NotificationManager;
  private helpModal: HelpModal;
  private taskExecutor: TaskExecutor;
  private useEnhancedUI: boolean = true;
  private currentFocus: 'tasks' | 'work' | 'context' | 'logs' = 'tasks';
  private currentMode: 'normal' | 'input' | 'command' = 'normal';

  constructor(
    screen: blessed.Widgets.Screen,
    private taskStore: TaskStore,
    private contextStore: ContextStore,
    private logStore: LogStore,
    private claudeBridge: ClaudeCodeBridge,
    private mcpManager: EnhancedMCPManager
  ) {
    this.screen = screen;
    this.themeManager = new ThemeManager();
    this.notificationManager = new NotificationManager();
    this.helpModal = new HelpModal(screen);
    this.taskExecutor = new TaskExecutor(taskStore, mcpManager, claudeBridge, logStore, {
      autoApprove: true,
      maxConcurrent: 3,
    });
    this.setupLayout();
    this.setupKeyBindings();
    this.setupEventListeners();
  }

  private setupLayout() {
    // 메인 컨테이너
    const container = blessed.box({
      parent: this.screen,
      width: '100%',
      height: '100%-1', // StatusBar 공간 확보
    });

    if (this.useEnhancedUI) {
      // Enhanced UI 사용 - screen에 직접 추가
      this.enhancedTaskPanel = new EnhancedTaskPanel(
        this.screen,
        this.taskStore,
        this.themeManager
      );

      // 다른 패널들도 screen에 직접 추가
      this.workPanel = new WorkPanel({
        parent: this.screen,
        left: '25%',
        width: '40%',
        height: '100%-1',
        claudeBridge: this.claudeBridge,
        logStore: this.logStore,
      });

      this.contextPanel = new ContextPanel({
        parent: this.screen,
        left: '65%',
        width: '20%',
        height: '100%-1',
        contextStore: this.contextStore,
        mcpManager: this.mcpManager,
      });

      this.logPanel = new LogPanel({
        parent: this.screen,
        left: '85%',
        width: '15%',
        height: '100%-1',
        logStore: this.logStore,
      });
    } else {
      // 기존 UI 사용
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
    }

    // StatusBar
    if (this.useEnhancedUI) {
      this.enhancedStatusBar = new EnhancedStatusBar(this.screen, this.themeManager);
    } else {
      this.statusBar = new StatusBar({
        parent: this.screen,
        bottom: 0,
        height: 1,
        taskStore: this.taskStore,
        mcpManager: this.mcpManager,
      });
    }
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

    // 테마 토글 (t)
    this.screen.key(['t'], () => {
      this.toggleTheme();
    });

    // 전체 화면 (F11)
    this.screen.key(['f11'], () => {
      this.toggleFullscreen();
    });

    // ESC - 현재 패널에서 나가기
    this.screen.key(['escape'], () => {
      this.handleEscape();
    });
  }

  private focusPanel(panel: 'tasks' | 'work' | 'context' | 'logs') {
    // 모든 패널의 포커스 해제
    if (this.useEnhancedUI && this.enhancedTaskPanel) {
      this.enhancedTaskPanel.unfocus();
    } else if (this.taskPanel) {
      this.taskPanel.unfocus();
    }
    this.workPanel.unfocus();
    this.contextPanel.unfocus();
    this.logPanel.unfocus();

    // 선택된 패널에 포커스
    switch (panel) {
      case 'tasks':
        if (this.useEnhancedUI && this.enhancedTaskPanel) {
          this.enhancedTaskPanel.focus();
        } else if (this.taskPanel) {
          this.taskPanel.focus();
        }
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

    this.currentFocus = panel;
    this.updateStatusBar();
    this.screen.render();
  }

  private showHelp() {
    this.helpModal.toggle();
  }

  private setupEventListeners() {
    // Task 관련 이벤트
    this.screen.on(
      'task:create',
      (data: { title: string; description: string; priority?: 'high' | 'medium' | 'low' }) => {
        void (async () => {
          try {
            const task = await this.taskExecutor.createAndExecuteTask({
              title: data.title,
              description: data.description,
              priority: data.priority || 'medium',
            });

            this.notificationManager.showNotification(
              this.screen,
              `Task created: ${task.title}`,
              'success'
            );
          } catch (error) {
            this.notificationManager.showNotification(
              this.screen,
              `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
              'error'
            );
          }
        })();
      }
    );

    this.screen.on('task:execute', async (task: any) => {
      this.logStore.info(`Executing task: ${task.title}`, 'Task');
      try {
        await this.taskExecutor.executeTask(task);
        this.notificationManager.showNotification(
          this.screen,
          `Task started: ${task.title}`,
          'info'
        );
      } catch (error: any) {
        this.notificationManager.showNotification(
          this.screen,
          `Failed to execute task: ${error.message}`,
          'error'
        );
      }
    });

    this.screen.on('task:delete', (task: any) => {
      this.taskStore.removeTask(task.id);
      this.notificationManager.showNotification(this.screen, 'Task deleted', 'info');
    });

    // TaskExecutor 이벤트
    this.taskExecutor.on('task:started', (task) => {
      this.logStore.info(`Task started: ${task.title}`, 'TaskExecutor');
      this.render();
    });

    this.taskExecutor.on('task:completed', (task) => {
      this.notificationManager.showNotification(
        this.screen,
        `Task completed: ${task.title}`,
        'success'
      );
      this.render();
    });

    this.taskExecutor.on('task:failed', ({ task, error }) => {
      this.notificationManager.showNotification(
        this.screen,
        `Task failed: ${task.title} - ${error.message}`,
        'error'
      );
      this.render();
    });

    this.taskExecutor.on('task:output', (data) => {
      // WorkPanel에 출력 표시
      if (this.workPanel) {
        this.workPanel.appendOutput(data);
      }
    });

    // Theme 변경 이벤트
    this.screen.on('theme:changed', () => {
      this.render();
    });

    // Mode 변경 이벤트
    this.screen.on('mode:changed', (mode: 'normal' | 'input' | 'command') => {
      this.currentMode = mode;
      this.updateStatusBar();
    });
  }

  render() {
    // 각 패널 업데이트
    if (this.useEnhancedUI) {
      if (this.enhancedTaskPanel) this.enhancedTaskPanel.render();
    } else {
      if (this.taskPanel) this.taskPanel.render();
    }

    this.workPanel.render();
    this.contextPanel.render();
    this.logPanel.render();

    // 상태바 업데이트
    this.updateStatusBar();

    // 화면 렌더링
    this.screen.render();
  }

  private updateStatusBar() {
    if (this.useEnhancedUI && this.enhancedStatusBar) {
      const activeTask = this.taskStore.getActiveTask();
      const status = this.mcpManager.getStatus();

      this.enhancedStatusBar.updateStatus({
        mode: this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1),
        focusedPanel: this.getPanelDisplayName(this.currentFocus),
        activeTask: activeTask
          ? {
              title: activeTask.title,
              progress: activeTask.progress,
            }
          : undefined,
        mcpServers: {
          taskManager: {
            connected: status.services.taskManager,
            status: undefined,
          },
          context7: {
            connected: status.services.context7,
            status: undefined,
          },
        },
        inputMode: this.currentMode === 'input',
        commandMode: this.currentMode === 'command',
      });
    } else if (this.statusBar) {
      this.statusBar.render();
    }
  }

  private getPanelDisplayName(panel: string): string {
    const names: { [key: string]: string } = {
      tasks: 'Tasks',
      work: 'Work',
      context: 'Context',
      logs: 'Logs',
    };
    return names[panel] || panel;
  }

  private toggleTheme() {
    const themes = ['dark', 'light', 'high-contrast'];
    const currentTheme = this.themeManager.getTheme();
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex] as any;

    this.themeManager.setTheme(nextTheme);
    this.applyTheme(nextTheme);
    this.notificationManager.showNotification(this.screen, `Theme changed to ${nextTheme}`, 'info');
  }

  private applyTheme(theme: string) {
    // 각 패널에 테마 적용
    if (this.enhancedStatusBar) {
      this.enhancedStatusBar.setTheme(theme);
    }

    // 화면 새로고침
    this.render();
  }

  private toggleFullscreen() {
    // Blessed에서는 직접적인 전체화면 지원이 없으므로
    // 사용자에게 터미널 전체화면 단축키를 안내
    this.notificationManager.showNotification(
      this.screen,
      'Use your terminal fullscreen shortcut (usually F11)',
      'info'
    );
  }

  private handleEscape() {
    // 현재 모드가 input이면 normal로 변경
    if (this.currentMode !== 'normal') {
      this.currentMode = 'normal';
      this.screen.emit('mode:changed', 'normal');
      this.updateStatusBar();
    }
  }

  // 빠른 패널 전환을 위한 메서드
  switchToPanel(panel: 'tasks' | 'work' | 'context' | 'logs') {
    this.focusPanel(panel);
  }

  // 태스크 실행 상태 업데이트
  updateTaskProgress(taskId: string, progress: number) {
    const task = this.taskStore.getTaskById(taskId);
    if (task) {
      task.progress = progress;
      this.taskStore.updateTask(task);
      this.updateStatusBar();
    }
  }
}
