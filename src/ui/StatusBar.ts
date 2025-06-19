import * as blessed from 'blessed';
import { TaskStore } from '../stores/TaskStore';
import { MCPManager } from '../mcp/MCPManager';

interface StatusBarOptions {
  parent: blessed.Widgets.Node;
  bottom: number;
  height: number;
  taskStore: TaskStore;
  mcpManager: MCPManager;
}

export class StatusBar {
  private box: blessed.Widgets.BoxElement;
  private taskStore: TaskStore;
  private mcpManager: MCPManager;

  constructor(options: StatusBarOptions) {
    this.taskStore = options.taskStore;
    this.mcpManager = options.mcpManager;

    this.box = blessed.box({
      parent: options.parent,
      bottom: options.bottom,
      left: 0,
      width: '100%',
      height: options.height,
      style: {
        fg: 'white',
        bg: 'blue',
      },
      tags: true,
    });

    this.render();

    // 주기적 업데이트
    setInterval(() => {
      this.render();
      this.box.screen.render();
    }, 1000);
  }

  render() {
    const tasks = this.taskStore.getTasks();
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    const mcpStatus = this.mcpManager.getStatus();
    const mcpIndicator = mcpStatus.initialized ? '{green-fg}●{/}' : '{red-fg}●{/}';

    const content = ` Tasks: ${completedTasks}/${tasks.length} | Active: ${activeTasks} | MCP: ${mcpIndicator} | ^C Quit | ? Help `;
    
    this.box.setContent(content);
  }
}