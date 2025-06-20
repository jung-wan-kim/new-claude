import * as blessed from 'blessed';
import { TaskStore } from '../../stores/TaskStore';
import { Task } from '../../shared/types';
import { ThemeManager } from '../components/ThemeManager';

export class EnhancedTaskPanel {
  private box: blessed.Widgets.BoxElement;
  private list: blessed.Widgets.ListElement;
  private detailsBox?: blessed.Widgets.BoxElement;
  // private selectedTask?: Task; // 미사용 변수 주석 처리

  constructor(
    private parent: blessed.Widgets.Screen,
    private taskStore: TaskStore,
    _themeManager: ThemeManager // 사용하지 않는 매개변수
  ) {
    this.box = blessed.box({
      parent: this.parent,
      label: ' Tasks ',
      border: { type: 'line' },
      width: '25%',
      height: '100%-1',
      top: 0,
      left: 0,
      scrollable: true,
      keys: true,
      vi: true,
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bold: true },
      },
    });

    this.list = blessed.list({
      parent: this.box,
      top: 0,
      left: 0,
      width: '100%-2',
      height: '100%-2',
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: '┃',
        style: { fg: 'cyan' },
      },
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
          bold: true,
        },
        item: {
          hover: { bg: 'gray' },
        },
      },
      tags: true,
    });

    this.setupEventHandlers();
    this.setupTaskStoreListeners();
    this.render();
  }

  private setupEventHandlers() {
    // Enter - 작업 실행
    this.list.key(['enter'], () => {
      const selected = (this.list as any).selected || 0;
      const tasks = this.taskStore.getTasks();
      if (selected >= 0 && selected < tasks.length) {
        const task = tasks[selected];
        this.parent.emit('task:execute', task);
      }
    });

    // Space - 상세 정보 토글
    this.list.key(['space'], () => {
      const selected = (this.list as any).selected || 0;
      const tasks = this.taskStore.getTasks();
      if (selected >= 0 && selected < tasks.length) {
        const task = tasks[selected];
        this.toggleTaskDetails(task);
      }
    });

    // n - 새 작업
    this.list.key(['n'], () => {
      this.showNewTaskDialog();
    });

    // d - 작업 삭제
    this.list.key(['d'], () => {
      const selected = (this.list as any).selected || 0;
      const tasks = this.taskStore.getTasks();
      if (selected >= 0 && selected < tasks.length) {
        const task = tasks[selected];
        if (task.status === 'pending') {
          this.confirmDelete(task);
        }
      }
    });

    // / - 검색
    this.list.key(['/'], () => {
      this.showSearchPrompt();
    });

    // r - 새로고침
    this.list.key(['r'], () => {
      this.render();
    });
  }

  private setupTaskStoreListeners() {
    this.taskStore.on('task:added', () => this.render());
    this.taskStore.on('task:updated', () => this.render());
    this.taskStore.on('task:removed', () => this.render());
  }

  private renderTaskItem(task: Task): string {
    const statusIcon = this.getStatusIcon(task.status);
    const statusColor = this.getStatusColor(task.status);

    let line = `{${statusColor}-fg}${statusIcon}{/} ${task.title}`;

    // 진행률 시각화
    if (task.status === 'in_progress' && task.progress !== undefined) {
      const progressBar = this.createProgressBar(task.progress);
      line += ` ${progressBar}`;
    }

    // 우선순위 표시
    if (task.priority === 'high') {
      line = `{red-fg}↑{/} ${line}`;
    } else if (task.priority === 'low') {
      line = `{gray-fg}↓{/} ${line}`;
    }

    // 예상 소요 시간 표시
    if (task.estimatedTime) {
      line += ` {dim-fg}(⌚${task.estimatedTime}){/}`;
    }

    return line;
  }

  private getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      pending: '○',
      in_progress: '◐',
      completed: '✔',
      failed: '✘',
      paused: '⏸',
      cancelled: '⛔',
    };
    return icons[status] || '?';
  }

  private getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      failed: 'red',
      paused: 'gray',
      cancelled: 'magenta',
    };
    return colors[status] || 'white';
  }

  private showNewTaskDialog() {
    const form = blessed.form({
      parent: this.parent,
      keys: true,
      vi: true,
      left: 'center',
      top: 'center',
      width: '50%',
      height: 20,
      border: { type: 'line' },
      label: ' New Task ',
      style: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow', bold: true },
      },
    });

    blessed.text({
      parent: form,
      content: 'Title:',
      top: 1,
      left: 2,
      style: { fg: 'white' },
    });

    const titleInput = blessed.textbox({
      parent: form,
      name: 'title',
      top: 2,
      left: 2,
      width: '100%-4',
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'yellow' } },
      },
      inputOnFocus: true,
    });

    blessed.text({
      parent: form,
      content: 'Description:',
      top: 6,
      left: 2,
      style: { fg: 'white' },
    });

    const descInput = blessed.textarea({
      parent: form,
      name: 'description',
      top: 7,
      left: 2,
      width: '100%-4',
      height: 6,
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'yellow' } },
      },
      inputOnFocus: true,
    });

    const submitBtn = blessed.button({
      parent: form,
      content: ' Create ',
      top: 14,
      left: '25%-4',
      shrink: true,
      padding: { left: 1, right: 1 },
      style: {
        bg: 'blue',
        fg: 'white',
        hover: { bg: 'lightblue' },
        focus: { bg: 'blue', bold: true },
      },
    });

    const cancelBtn = blessed.button({
      parent: form,
      content: ' Cancel ',
      top: 14,
      right: '25%-4',
      shrink: true,
      padding: { left: 1, right: 1 },
      style: {
        bg: 'red',
        fg: 'white',
        hover: { bg: 'lightred' },
        focus: { bg: 'red', bold: true },
      },
    });

    submitBtn.on('press', () => {
      const title = titleInput.getValue().trim();
      const description = descInput.getValue().trim();

      if (title) {
        this.parent.emit('task:create', {
          title,
          description,
        });
        form.destroy();
        this.parent.render();
      }
    });

    cancelBtn.on('press', () => {
      form.destroy();
      this.parent.render();
    });

    form.key(['escape'], () => {
      form.destroy();
      this.parent.render();
    });

    titleInput.focus();
    this.parent.render();
  }

  private toggleTaskDetails(task: Task) {
    if (this.detailsBox) {
      this.detailsBox.destroy();
      this.detailsBox = undefined;
      this.parent.render();
      return;
    }

    this.detailsBox = blessed.box({
      parent: this.parent,
      label: ` Task Details - ${task.title} `,
      border: { type: 'line' },
      left: '25%+2',
      top: '50%-10',
      width: '50%',
      height: 20,
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'cyan', bold: true },
      },
      content: this.formatTaskDetails(task),
      scrollable: true,
      keys: true,
      vi: true,
      tags: true,
    });

    this.detailsBox.key(['escape', 'q'], () => {
      if (this.detailsBox) {
        this.detailsBox.destroy();
        this.detailsBox = undefined;
        this.parent.render();
      }
    });

    this.detailsBox.focus();
    this.parent.render();
  }

  private formatTaskDetails(task: Task): string {
    const statusColor = this.getStatusColor(task.status);
    const statusIcon = this.getStatusIcon(task.status);
    
    let details = `
{bold}ID:{/bold} ${task.id}
{bold}Title:{/bold} ${task.title}
{bold}Status:{/bold} {${statusColor}-fg}${statusIcon} ${task.status}{/}
{bold}Priority:{/bold} ${this.getPriorityDisplay(task.priority || 'normal')}
{bold}Created:{/bold} ${task.createdAt?.toLocaleString() || 'Unknown'}
`;

    if (task.startedAt) {
      details += `{bold}Started:{/bold} ${new Date(task.startedAt).toLocaleString()}\n`;
      const duration = this.calculateDuration(task.startedAt, task.completedAt);
      details += `{bold}Duration:{/bold} ${duration}\n`;
    }
    
    if (task.completedAt) {
      details += `{bold}Completed:{/bold} ${new Date(task.completedAt).toLocaleString()}\n`;
    }
    
    if (task.progress !== undefined) {
      const progressBar = this.createDetailedProgressBar(task.progress);
      details += `{bold}Progress:{/bold} ${progressBar}\n`;
    }
    
    if (task.estimatedTime) {
      details += `{bold}Estimated Time:{/bold} ${task.estimatedTime}\n`;
    }

    details += `
{bold}Description:{/bold}
${task.description || 'No description provided'}
`;

    if (task.error) {
      details += `\n{bold}{red-fg}Error:{/red-fg}{/bold}\n${task.error}\n`;
    }

    return details;
  }

  private confirmDelete(task: Task) {
    const confirm = blessed.question({
      parent: this.parent,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      label: ' Confirm Delete ',
      tags: true,
      keys: true,
      vi: true,
      style: {
        border: { fg: 'red' },
        label: { fg: 'red', bold: true },
      },
    });

    confirm.ask(`Delete task "${task.title}"? (y/n)`, (_err, value) => {
      if (value && value.toLowerCase() === 'y') {
        this.parent.emit('task:delete', task);
      }
      this.parent.render();
    });
  }

  private showSearchPrompt() {
    const prompt = blessed.prompt({
      parent: this.parent,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      label: ' Search Tasks ',
      tags: true,
      keys: true,
      vi: true,
    });

    prompt.input('Enter search term:', '', (_err, value) => {
      if (value) {
        this.filterTasks(value);
      }
      this.parent.render();
    });
  }

  private filterTasks(searchTerm: string) {
    const tasks = this.taskStore.getTasks();
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const items = filtered.map((task) => this.renderTaskItem(task));
    this.list.setItems(items);
    this.parent.render();
  }

  focus() {
    this.list.focus();
  }

  unfocus() {
    // blessed list doesn't have unfocus, but we can blur it
    if ((this.parent as any).focused === this.list) {
      this.box.focus();
    }
  }

  render() {
    const tasks = this.taskStore.getTasks();
    const items = tasks.map((task) => this.renderTaskItem(task));
    this.list.setItems(items);
    
    // 태스크 수 및 상태 통계 표시
    const stats = this.calculateTaskStats(tasks);
    this.box.setLabel(` Tasks (${stats.total}) - ✔${stats.completed} ◐${stats.inProgress} ○${stats.pending} `);
    
    this.parent.render();
  }

  private createProgressBar(progress: number): string {
    const width = 10;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `{cyan-fg}[${bar}] ${progress}%{/}`;
  }

  private createDetailedProgressBar(progress: number): string {
    const width = 20;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${progress}%`;
  }

  private getPriorityDisplay(priority: string): string {
    const displays: { [key: string]: string } = {
      high: '{red-fg}↑ High{/}',
      medium: '{yellow-fg}→ Medium{/}',
      low: '{gray-fg}↓ Low{/}',
      normal: 'Normal',
    };
    return displays[priority] || priority;
  }

  private calculateDuration(startTime: string | Date, endTime?: string | Date): string {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = end - start;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private calculateTaskStats(tasks: Task[]): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
  } {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }
}
