import * as blessed from 'blessed';

interface KeyBinding {
  key: string;
  description: string;
  category?: string;
}

export class HelpModal {
  private modal?: blessed.Widgets.BoxElement;
  private isShowing: boolean = false;

  private keyBindings: KeyBinding[] = [
    // Global Keys
    { key: 'Ctrl+1', description: 'Switch to Tasks panel', category: 'Global' },
    { key: 'Ctrl+2', description: 'Switch to Work panel', category: 'Global' },
    { key: 'Ctrl+3', description: 'Switch to Context panel', category: 'Global' },
    { key: 'Ctrl+4', description: 'Switch to Logs panel', category: 'Global' },
    { key: '?', description: 'Show/Hide this help', category: 'Global' },
    { key: 'r', description: 'Refresh screen', category: 'Global' },
    { key: 'q', description: 'Quit application', category: 'Global' },
    { key: 't', description: 'Toggle theme', category: 'Global' },

    // Task Panel
    { key: '↑/↓', description: 'Navigate tasks', category: 'Task Panel' },
    { key: 'Enter', description: 'Select/Execute task', category: 'Task Panel' },
    { key: 'n', description: 'Create new task', category: 'Task Panel' },
    { key: 'd', description: 'Delete task', category: 'Task Panel' },
    { key: 'e', description: 'Edit task', category: 'Task Panel' },
    { key: 'Space', description: 'Toggle task completion', category: 'Task Panel' },
    { key: 'p', description: 'Change priority', category: 'Task Panel' },

    // Work Panel
    { key: 'i', description: 'Enter input mode', category: 'Work Panel' },
    { key: 'Esc', description: 'Exit input mode', category: 'Work Panel' },
    { key: 'Ctrl+K', description: 'Clear terminal', category: 'Work Panel' },
    { key: 'Ctrl+C', description: 'Cancel current operation', category: 'Work Panel' },
    { key: 'Ctrl+L', description: 'Clear work area', category: 'Work Panel' },

    // Context Panel
    { key: '↑/↓', description: 'Navigate contexts', category: 'Context Panel' },
    { key: 'Enter', description: 'View context details', category: 'Context Panel' },
    { key: 'a', description: 'Add new context', category: 'Context Panel' },
    { key: 'd', description: 'Delete context', category: 'Context Panel' },
    { key: 's', description: 'Search contexts', category: 'Context Panel' },

    // Log Panel
    { key: '↑/↓', description: 'Scroll logs', category: 'Log Panel' },
    { key: 'f', description: 'Filter logs', category: 'Log Panel' },
    { key: 'c', description: 'Clear logs', category: 'Log Panel' },
    { key: 'l', description: 'Change log level', category: 'Log Panel' },
    { key: '/', description: 'Search in logs', category: 'Log Panel' },
  ];

  constructor(private screen: blessed.Widgets.Screen) {}

  show() {
    if (this.isShowing) return;

    const categories = [...new Set(this.keyBindings.map((kb) => kb.category))].filter(Boolean);

    let content = '{center}{bold}Claude Code Controller - Keyboard Shortcuts{/bold}{/center}\n\n';

    categories.forEach((category) => {
      content += `{cyan-fg}{bold}${category}:{/bold}{/cyan-fg}\n`;

      const bindings = this.keyBindings.filter((kb) => kb.category === category);
      const maxKeyLength = Math.max(...bindings.map((kb) => kb.key.length));

      bindings.forEach((binding) => {
        const paddedKey = binding.key.padEnd(maxKeyLength + 2);
        content += `  {yellow-fg}${paddedKey}{/yellow-fg} ${binding.description}\n`;
      });

      content += '\n';
    });

    content +=
      '\n{center}Press {yellow-fg}?{/yellow-fg} or {yellow-fg}Esc{/yellow-fg} to close{/center}';

    this.modal = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      content: content,
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'cyan',
        },
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'cyan',
        },
        style: {
          inverse: true,
        },
      },
      keys: true,
      vi: true,
      mouse: true,
    });

    // Event handlers
    this.modal.key(['?', 'escape', 'q'], () => {
      this.hide();
    });

    this.modal.focus();
    this.screen.render();
    this.isShowing = true;
  }

  hide() {
    if (!this.isShowing || !this.modal) return;

    this.modal.destroy();
    this.modal = undefined;
    this.screen.render();
    this.isShowing = false;
  }

  toggle() {
    if (this.isShowing) {
      this.hide();
    } else {
      this.show();
    }
  }

  // 커스텀 키 바인딩 추가
  addKeyBinding(binding: KeyBinding) {
    this.keyBindings.push(binding);
  }

  // 카테고리별 키 바인딩 가져오기
  getKeyBindingsByCategory(category: string): KeyBinding[] {
    return this.keyBindings.filter((kb) => kb.category === category);
  }
}
