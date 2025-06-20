import * as blessed from 'blessed';

export interface Theme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    border: string;
    selection: string;
  };
  blessed: {
    bg: string;
    fg: string;
    border: { fg: string };
    selected: { bg: string; fg: string };
    focus?: { border?: { fg: string } };
  };
}

export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'dark';
  private listeners: ((theme: string) => void)[] = [];

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
        selection: '#264f78',
      },
      blessed: {
        bg: 'black',
        fg: 'white',
        border: { fg: 'cyan' },
        selected: { bg: 'blue', fg: 'white' },
        focus: { border: { fg: 'yellow' } },
      },
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
        selection: '#add8e6',
      },
      blessed: {
        bg: 'white',
        fg: 'black',
        border: { fg: 'blue' },
        selected: { bg: 'cyan', fg: 'black' },
        focus: { border: { fg: 'blue' } },
      },
    });

    this.themes.set('high-contrast', {
      name: 'High Contrast',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#00ffff',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#ffffff',
        border: '#ffffff',
        selection: '#ffff00',
      },
      blessed: {
        bg: 'black',
        fg: 'white',
        border: { fg: 'white' },
        selected: { bg: 'yellow', fg: 'black' },
        focus: { border: { fg: 'yellow' } },
      },
    });
  }

  getCurrentTheme(): Theme {
    return this.themes.get(this.currentTheme)!;
  }

  getThemeNames(): string[] {
    return Array.from(this.themes.keys());
  }

  applyTheme(element: blessed.Widgets.BlessedElement) {
    const theme = this.getCurrentTheme();

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
      this.notifyListeners();
    }
  }

  onThemeChange(callback: (theme: string) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  getStatusColor(status: string): string {
    const theme = this.getCurrentTheme();
    const colorMap: { [key: string]: keyof typeof theme.colors } = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      failed: 'error',
      connected: 'success',
      disconnected: 'error',
    };

    const colorKey = colorMap[status] || 'foreground';
    return theme.colors[colorKey];
  }

  getTheme(): string {
    return this.currentTheme;
  }

  setTheme(themeName: string) {
    this.switchTheme(themeName);
  }
}
