import * as blessed from 'blessed';
import { TaskStore } from '../../stores/TaskStore';
import { MCPManager } from '../../shared/types';

interface TaskPanelOptions {
  parent: blessed.Widgets.Node;
  left: string | number;
  width: string | number;
  height: string | number;
  taskStore: TaskStore;
  mcpManager: MCPManager;
}

export class TaskPanel {
  private box: blessed.Widgets.BoxElement;
  private list: blessed.Widgets.ListElement;
  private taskStore: TaskStore;
  private mcpManager: MCPManager; // eslint-disable-line @typescript-eslint/no-unused-vars

  constructor(options: TaskPanelOptions) {
    this.taskStore = options.taskStore;
    this.mcpManager = options.mcpManager;
    void this.mcpManager; // To avoid unused variable warning

    // 패널 컨테이너
    this.box = blessed.box({
      parent: options.parent,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Tasks ',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'white',
        },
      },
    });

    // 작업 목록
    this.list = blessed.list({
      parent: this.box,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      items: [],
      keys: true,
      vi: true,
      mouse: true,
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
        },
      },
    });

    this.setupEventHandlers();
    this.render();
  }

  private setupEventHandlers() {
    // 작업 선택
    this.list.on('select', (_item, index) => {
      const task = this.taskStore.getTasks()[index];
      if (task) {
        this.taskStore.setActiveTask(task.id);
      }
    });

    // 새 작업 (n 키)
    this.list.key(['n'], () => {
      this.showNewTaskDialog();
    });

    // 작업 시작 (Enter)
    this.list.key(['enter'], () => {
      const task = this.taskStore.getActiveTask();
      if (task && task.status === 'pending') {
        this.taskStore.updateTaskStatus(task.id, 'in_progress');
      }
    });

    // 작업 완료 (c 키)
    this.list.key(['c'], () => {
      const task = this.taskStore.getActiveTask();
      if (task && task.status === 'in_progress') {
        this.taskStore.updateTaskStatus(task.id, 'completed');
      }
    });
  }

  private showNewTaskDialog() {
    const form = blessed.form({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 10,
      label: ' New Task ',
      border: {
        type: 'line',
      },
      keys: true,
    });

    const titleInput = blessed.textbox({
      parent: form,
      name: 'title',
      top: 1,
      left: 2,
      width: '100%-4',
      height: 1,
      label: ' Title: ',
      inputOnFocus: true,
      style: {
        fg: 'white',
        bg: 'black',
        focus: {
          bg: 'blue',
        },
      },
    });

    blessed.textbox({
      parent: form,
      name: 'description',
      top: 3,
      left: 2,
      width: '100%-4',
      height: 3,
      label: ' Description: ',
      inputOnFocus: true,
      style: {
        fg: 'white',
        bg: 'black',
        focus: {
          bg: 'blue',
        },
      },
    });

    const submitButton = blessed.button({
      parent: form,
      bottom: 0,
      left: 'center',
      width: 10,
      height: 1,
      content: ' Create ',
      style: {
        bg: 'green',
        fg: 'white',
        focus: {
          bg: 'cyan',
        },
      },
    });

    form.on('submit', (data: any) => {
      if (data.title) {
        this.taskStore.createTask({
          title: data.title,
          description: data.description || '',
          priority: 'medium',
        });
      }
      form.destroy();
      this.box.screen.render();
    });

    submitButton.on('press', () => {
      form.submit();
    });

    // ESC로 취소
    form.key(['escape'], () => {
      form.destroy();
      this.box.screen.render();
    });

    titleInput.focus();
    this.box.screen.render();
  }

  render() {
    const tasks = this.taskStore.getTasks();
    const items = tasks.map(task => {
      const status = task.status === 'completed' ? '✓' : 
                    task.status === 'in_progress' ? '⚡' : '○';
      const priority = task.priority === 'high' ? '!' :
                      task.priority === 'medium' ? '-' : ' ';
      return `${status} ${priority} ${task.title}`;
    });

    this.list.setItems(items);
  }

  focus() {
    this.list.focus();
    this.box.style.border = { fg: 'cyan' };
  }

  unfocus() {
    this.box.style.border = { fg: 'white' };
  }
}