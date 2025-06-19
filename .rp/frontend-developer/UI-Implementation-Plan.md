# Frontend Developer - UI Implementation Plan

## 현재 상태 분석

### 구현된 기능
- 기본 레이아웃 (4-패널 구조)
- 간단한 상태바
- 기본적인 키 바인딩 (종료)

### 누락된 주요 기능
1. **작업 관리 UI**
   - 작업 목록 표시
   - 작업 생성 다이얼로그
   - 작업 상태 업데이트
   - 진행률 표시

2. **컨텍스트 관리 UI**
   - 저장된 컨텍스트 목록
   - 검색 기능
   - 컨텍스트 상세 보기

3. **인터랙션 개선**
   - Vi 모드 네비게이션
   - 단축키 시스템
   - 포커스 관리
   - 자동 완성

4. **시각적 개선**
   - 테마 시스템
   - 애니메이션
   - 프로그레스 인디케이터
   - 알림 시스템

## 구현 계획

### 1. Enhanced Task Panel
```typescript
import * as blessed from 'blessed';
import { TaskStore } from '../stores/TaskStore';
import { Task, TaskStatus } from '../shared/types';

export class EnhancedTaskPanel {
  private box: blessed.Widgets.BoxElement;
  private list: blessed.Widgets.ListElement;
  private statusIndicators: Map<string, blessed.Widgets.TextElement>;
  private progressBars: Map<string, blessed.Widgets.ProgressBarElement>;

  constructor(
    private parent: blessed.Widgets.Screen,
    private taskStore: TaskStore
  ) {
    this.box = blessed.box({
      parent: this.parent,
      label: ' Tasks ',
      border: { type: 'line' },
      width: '25%',
      height: '50%',
      top: 0,
      left: 0,
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'white', bold: true }
      }
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
        style: { fg: 'cyan' }
      },
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
          bold: true
        },
        item: {
          hover: { bg: 'gray' }
        }
      }
    });

    this.setupEventHandlers();
    this.setupTaskStoreListeners();
    this.render();
  }

  private setupEventHandlers() {
    // Enter - 작업 실행
    this.list.key(['enter'], () => {
      const selected = this.list.selected;
      const task = this.taskStore.getTasks()[selected];
      if (task) {
        this.parent.emit('task:execute', task);
      }
    });

    // Space - 상세 정보 토글
    this.list.key(['space'], () => {
      const selected = this.list.selected;
      const task = this.taskStore.getTasks()[selected];
      if (task) {
        this.toggleTaskDetails(task);
      }
    });

    // n - 새 작업
    this.list.key(['n'], () => {
      this.showNewTaskDialog();
    });

    // d - 작업 삭제
    this.list.key(['d'], () => {
      const selected = this.list.selected;
      const task = this.taskStore.getTasks()[selected];
      if (task && task.status === 'pending') {
        this.confirmDelete(task);
      }
    });

    // / - 검색
    this.list.key(['/'], () => {
      this.showSearchPrompt();
    });
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
        label: { fg: 'yellow', bold: true }
      }
    });

    const titleInput = blessed.textbox({
      parent: form,
      name: 'title',
      top: 1,
      left: 2,
      width: '100%-4',
      height: 3,
      label: 'Title:',
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'yellow' } }
      }
    });

    const descInput = blessed.textarea({
      parent: form,
      name: 'description',
      top: 5,
      left: 2,
      width: '100%-4',
      height: 8,
      label: 'Description:',
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'yellow' } }
      }
    });

    const submitBtn = blessed.button({
      parent: form,
      content: 'Create',
      top: 14,
      left: '25%-5',
      width: 10,
      height: 3,
      align: 'center',
      style: {
        bg: 'blue',
        fg: 'white',
        hover: { bg: 'lightblue' },
        focus: { bg: 'blue', bold: true }
      }
    });

    const cancelBtn = blessed.button({
      parent: form,
      content: 'Cancel',
      top: 14,
      left: '75%-5',
      width: 10,
      height: 3,
      align: 'center',
      style: {
        bg: 'red',
        fg: 'white',
        hover: { bg: 'lightred' },
        focus: { bg: 'red', bold: true }
      }
    });

    submitBtn.on('press', () => {
      const title = titleInput.getValue();
      const description = descInput.getValue();
      
      if (title.trim()) {
        this.parent.emit('task:create', {
          title: title.trim(),
          description: description.trim()
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

  private renderTaskItem(task: Task): string {
    const statusIcon = this.getStatusIcon(task.status);
    const statusColor = this.getStatusColor(task.status);
    
    let line = `{${statusColor}-fg}${statusIcon}{/} ${task.title}`;
    
    if (task.status === 'in_progress' && task.progress) {
      line += ` {cyan-fg}[${task.progress}%]{/}`;
    }
    
    return line;
  }

  private getStatusIcon(status: TaskStatus): string {
    const icons = {
      pending: '◯',
      in_progress: '◐',
      completed: '✓',
      failed: '✗',
      paused: '⏸'
    };
    return icons[status] || '?';
  }

  private getStatusColor(status: TaskStatus): string {
    const colors = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      failed: 'red',
      paused: 'gray'
    };
    return colors[status] || 'white';
  }
}
```

### 2. Context Panel with Search
```typescript
export class EnhancedContextPanel {
  private box: blessed.Widgets.BoxElement;
  private searchBox: blessed.Widgets.TextboxElement;
  private resultsList: blessed.Widgets.ListElement;
  private detailsBox: blessed.Widgets.BoxElement;
  private searchDebounce: NodeJS.Timeout;

  constructor(
    private parent: blessed.Widgets.Screen,
    private contextStore: ContextStore,
    private mcpManager: MCPManager
  ) {
    this.createLayout();
    this.setupSearchBox();
    this.setupEventHandlers();
  }

  private setupSearchBox() {
    this.searchBox = blessed.textbox({
      parent: this.box,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      border: { type: 'line' },
      label: ' Search ',
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'cyan' }
      }
    });

    this.searchBox.on('keypress', () => {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => {
        this.performSearch(this.searchBox.getValue());
      }, 300);
    });
  }

  private async performSearch(query: string) {
    if (!query.trim()) {
      this.showRecentContexts();
      return;
    }

    try {
      const results = await this.mcpManager.context7.searchContext({
        text: query,
        limit: 20
      });

      this.displayResults(results);
    } catch (error) {
      this.showError('Search failed: ' + error.message);
    }
  }

  private displayResults(results: any[]) {
    const items = results.map(result => ({
      content: `${result.title} - ${result.preview}`,
      data: result
    }));

    this.resultsList.setItems(items.map(i => i.content));
    this.resultsList.setData(items.map(i => i.data));
    this.parent.render();
  }
}
```

### 3. Work Panel Enhancements
```typescript
export class EnhancedWorkPanel {
  private outputBuffer: CircularBuffer<string>;
  private ansiParser: AnsiParser;
  private autoScroll: boolean = true;
  private searchMode: boolean = false;

  constructor(
    private parent: blessed.Widgets.Screen,
    private claudeBridge: ClaudeCodeBridge
  ) {
    this.outputBuffer = new CircularBuffer(10000);
    this.ansiParser = new AnsiParser();
    this.createLayout();
    this.setupClaudeListener();
  }

  private setupClaudeListener() {
    this.claudeBridge.on('output', (data: string) => {
      this.appendOutput(data);
    });

    this.claudeBridge.on('error', (error: Error) => {
      this.appendOutput(`{red-fg}Error: ${error.message}{/}`);
    });

    this.claudeBridge.on('status', (status: string) => {
      this.updateStatus(status);
    });
  }

  private appendOutput(data: string) {
    const lines = data.split('\n');
    lines.forEach(line => {
      this.outputBuffer.push(this.ansiParser.parse(line));
    });

    if (this.autoScroll) {
      this.scrollToBottom();
    }

    this.render();
  }

  private setupKeyBindings() {
    // Ctrl+F - 검색
    this.box.key(['C-f'], () => {
      this.toggleSearchMode();
    });

    // Ctrl+K - 클리어
    this.box.key(['C-k'], () => {
      this.clearOutput();
    });

    // Page Up/Down
    this.box.key(['pageup'], () => {
      this.autoScroll = false;
      this.scrollUp(10);
    });

    this.box.key(['pagedown'], () => {
      this.scrollDown(10);
    });

    // G - 맨 아래로
    this.box.key(['G'], () => {
      this.autoScroll = true;
      this.scrollToBottom();
    });
  }
}
```

### 4. Status Bar with Real-time Updates
```typescript
export class EnhancedStatusBar {
  private leftSection: blessed.Widgets.TextElement;
  private centerSection: blessed.Widgets.TextElement;
  private rightSection: blessed.Widgets.TextElement;
  private spinner: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex: number = 0;
  private spinnerTimer?: NodeJS.Timer;

  updateStatus(status: StatusInfo) {
    // 왼쪽: 모드 정보
    this.leftSection.setContent(
      ` ${status.mode} | ${status.focusedPanel} `
    );

    // 중앙: 작업 정보
    if (status.activeTask) {
      this.startSpinner();
      this.centerSection.setContent(
        ` ${this.spinner[this.spinnerIndex]} ${status.activeTask.title} `
      );
    } else {
      this.stopSpinner();
      this.centerSection.setContent(' Ready ');
    }

    // 오른쪽: 연결 상태
    const mcpStatus = this.getMCPStatusIcons(status.mcpServers);
    this.rightSection.setContent(
      ` MCP: ${mcpStatus} | ${new Date().toLocaleTimeString()} `
    );

    this.parent.render();
  }

  private getMCPStatusIcons(servers: any): string {
    let icons = '';
    
    if (servers.taskManager) {
      icons += servers.taskManager.connected ? '✓' : '✗';
    }
    
    if (servers.context7) {
      icons += servers.context7.connected ? '✓' : '✗';
    }
    
    return icons || 'N/A';
  }
}
```

### 5. Theme System Implementation
```typescript
export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'dark';

  constructor() {
    this.registerDefaultThemes();
  }

  private registerDefaultThemes() {
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        primary: '#007acc',
        success: '#4ec9b0',
        warning: '#ce9178',
        error: '#f44747',
        info: '#9cdcfe',
        border: '#3e3e3e',
        selection: '#264f78'
      },
      blessed: {
        bg: 'black',
        fg: 'white',
        border: { fg: 'cyan' },
        selected: { bg: 'blue', fg: 'white' }
      }
    });

    this.themes.set('light', {
      name: 'Light',
      colors: {
        background: '#ffffff',
        foreground: '#333333',
        primary: '#0066cc',
        success: '#008000',
        warning: '#ff6600',
        error: '#cc0000',
        info: '#0099cc',
        border: '#cccccc',
        selection: '#add8e6'
      },
      blessed: {
        bg: 'white',
        fg: 'black',
        border: { fg: 'blue' },
        selected: { bg: 'cyan', fg: 'black' }
      }
    });
  }

  applyTheme(element: blessed.Widgets.BlessedElement) {
    const theme = this.themes.get(this.currentTheme)!;
    
    if (element.style) {
      Object.assign(element.style, theme.blessed);
    }
    
    // 재귀적으로 자식 요소에도 적용
    if ('children' in element) {
      (element as any).children.forEach((child: any) => {
        this.applyTheme(child);
      });
    }
  }

  switchTheme(themeName: string) {
    if (this.themes.has(themeName)) {
      this.currentTheme = themeName;
      // 모든 UI 요소에 테마 재적용
      this.parent.emit('theme:changed', themeName);
    }
  }
}
```

### 6. Notification System
```typescript
export class NotificationManager {
  private notifications: blessed.Widgets.BoxElement[] = [];
  private maxNotifications: number = 3;

  showNotification(
    parent: blessed.Widgets.Screen,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    duration: number = 3000
  ) {
    const colors = {
      success: { bg: 'green', fg: 'white' },
      warning: { bg: 'yellow', fg: 'black' },
      error: { bg: 'red', fg: 'white' },
      info: { bg: 'blue', fg: 'white' }
    };

    const notification = blessed.box({
      parent,
      content: ` ${this.getIcon(type)} ${message} `,
      top: 2 + (this.notifications.length * 4),
      right: 2,
      width: 'shrink',
      height: 3,
      align: 'center',
      valign: 'middle',
      style: colors[type],
      border: { type: 'line' },
      shadow: true
    });

    this.notifications.push(notification);

    // 애니메이션 효과
    this.animateIn(notification);

    setTimeout(() => {
      this.animateOut(notification, () => {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
        notification.destroy();
        this.repositionNotifications(parent);
        parent.render();
      });
    }, duration);

    parent.render();
  }

  private animateIn(element: blessed.Widgets.BoxElement) {
    // 슬라이드 인 효과 시뮬레이션
    const originalRight = element.right;
    element.right = -50;
    
    let position = -50;
    const interval = setInterval(() => {
      position += 5;
      element.right = position;
      element.screen.render();
      
      if (position >= originalRight) {
        clearInterval(interval);
      }
    }, 10);
  }

  private getIcon(type: string): string {
    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✗',
      info: 'ℹ'
    };
    return icons[type] || '';
  }
}
```

## 구현 우선순위

1. **Phase 1: Core Functionality**
   - Enhanced Task Panel (작업 목록, 생성, 상태 표시)
   - Work Panel 개선 (출력 버퍼링, ANSI 파싱)
   - 기본 키 바인딩 시스템

2. **Phase 2: User Experience**
   - Context Panel with Search
   - Status Bar 실시간 업데이트
   - 알림 시스템

3. **Phase 3: Polish**
   - 테마 시스템
   - 애니메이션
   - 자동 완성
   - 설정 저장/불러오기

## 성능 최적화

### 렌더링 최적화
- Virtual scrolling for long lists
- Debounced updates
- Differential rendering

### 메모리 관리
- Circular buffer for output
- Lazy loading of context
- Resource cleanup on unmount

## 접근성 고려사항

- 모든 인터랙티브 요소에 키보드 접근 가능
- 스크린 리더 호환 레이블
- 고대비 테마 옵션
- 포커스 인디케이터 명확히 표시