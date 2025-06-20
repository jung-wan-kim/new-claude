import * as blessed from 'blessed';
import { ContextStore } from '../../stores/ContextStore';
import { MCPManager } from '../../shared/types';

interface ContextPanelOptions {
  parent: blessed.Widgets.Node;
  left: string | number;
  width: string | number;
  height: string | number;
  contextStore: ContextStore;
  mcpManager: MCPManager;
}

export class ContextPanel {
  private box: blessed.Widgets.BoxElement;
  private list: blessed.Widgets.ListElement;
  private contextStore: ContextStore;
  private mcpManager: MCPManager; // eslint-disable-line @typescript-eslint/no-unused-vars

  constructor(options: ContextPanelOptions) {
    this.contextStore = options.contextStore;
    this.mcpManager = options.mcpManager;
    void this.mcpManager; // To avoid unused variable warning

    // 패널 컨테이너
    this.box = blessed.box({
      parent: options.parent,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Context ',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'white',
        },
      },
    });

    // 컨텍스트 목록
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
    // 컨텍스트 선택
    this.list.on('select', (_item, index) => {
      const context = this.contextStore.getContexts()[index];
      if (context) {
        this.contextStore.setActiveContext(context.id);
        this.showContextDetail(context);
      }
    });

    // 새 컨텍스트 (n 키)
    this.list.key(['n'], () => {
      this.showNewContextDialog();
    });

    // 검색 (/ 키)
    this.list.key(['/'], () => {
      this.showSearchDialog();
    });

    // 삭제 (d 키)
    this.list.key(['d'], () => {
      const context = this.contextStore.getActiveContext();
      if (context) {
        this.contextStore.deleteContext(context.id);
        this.render();
      }
    });
  }

  private showContextDetail(context: any) {
    const detailBox = blessed.box({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '60%',
      label: ` ${context.title} `,
      content: `Type: ${context.type || 'general'}
Tags: ${context.tags?.join(', ') || 'none'}
Created: ${new Date(context.createdAt).toLocaleString()}

${context.content}`,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'cyan',
        },
      },
    });

    detailBox.key(['q', 'escape'], () => {
      detailBox.destroy();
      this.box.screen.render();
    });

    detailBox.focus();
    this.box.screen.render();
  }

  private showNewContextDialog() {
    const form = blessed.form({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 12,
      label: ' New Context ',
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

    blessed.textarea({
      parent: form,
      name: 'content',
      top: 3,
      left: 2,
      width: '100%-4',
      height: 5,
      label: ' Content: ',
      inputOnFocus: true,
      style: {
        fg: 'white',
        bg: 'black',
        focus: {
          bg: 'blue',
        },
      },
    });

    form.on('submit', (data: any) => {
      if (data.title && data.content) {
        this.contextStore.createContext({
          title: data.title,
          content: data.content,
          type: 'note',
        });
        this.render();
      }
      form.destroy();
      this.box.screen.render();
    });

    titleInput.focus();
    this.box.screen.render();
  }

  private showSearchDialog() {
    const prompt = blessed.prompt({
      parent: this.box.screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      label: ' Search Context ',
      border: {
        type: 'line',
      },
    });

    prompt.input('Enter search query:', '', async (err, value) => {
      if (!err && value) {
        await this.contextStore.searchContexts(value);
        this.render();
      }
      this.box.screen.render();
    });
  }

  render() {
    const contexts = this.contextStore.getContexts();
    const items = contexts.map((ctx) => {
      const icon = ctx.type === 'code' ? '📄' : ctx.type === 'note' ? '📝' : '📋';
      return `${icon} ${ctx.title}`;
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
