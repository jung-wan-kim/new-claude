// 애플리케이션 상수

export const APP_NAME = 'Claude Code Controller';
export const APP_ID = 'com.claudecodecontroller.app';
export const APP_VERSION = '0.1.0';

// IPC 채널명
export const IPC_CHANNELS = {
  // MCP 관련
  MCP_TASKMANAGER_CREATE: 'mcp:taskmanager:createRequest',
  MCP_TASKMANAGER_NEXT: 'mcp:taskmanager:getNext',
  MCP_TASKMANAGER_DONE: 'mcp:taskmanager:markDone',
  MCP_CONTEXT7_SEARCH: 'mcp:context7:search',
  MCP_CONTEXT7_CREATE: 'mcp:context7:create',
  
  // Claude Code 관련
  CLAUDE_EXECUTE: 'claude:execute',
  CLAUDE_STREAM: 'claude:stream',
  CLAUDE_STREAM_DATA: 'claude:stream:data',
  CLAUDE_KILL: 'claude:kill',
  
  // Terminal 관련
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_OUTPUT: 'terminal:output',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',
  
  // 앱 상태 관련
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  APP_UPDATE: 'app:update',
  
  // 설정 관련
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
} as const;

// 기본 설정값
export const DEFAULT_SETTINGS = {
  general: {
    autoStart: false,
    minimizeToTray: true,
    checkForUpdates: true,
    language: 'en' as const,
  },
  claude: {
    timeout: 300000, // 5분
    maxConcurrent: 3,
  },
  mcp: {
    autoReconnect: true,
  },
  appearance: {
    theme: 'dark' as const,
    fontSize: 14,
    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
  },
  shortcuts: {
    'new-task': 'cmd+n',
    'run-task': 'cmd+enter',
    'stop-task': 'cmd+.',
    'clear-terminal': 'cmd+k',
    'toggle-sidebar': 'cmd+b',
    'search-context': 'cmd+f',
    'quick-command': 'cmd+shift+p',
    'focus-tasks': 'cmd+1',
    'focus-work': 'cmd+2',
    'focus-context': 'cmd+3',
    'focus-logs': 'cmd+4',
  },
} as const;

// 테마 정의
export const THEMES = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    border: '#464647',
    primary: '#007acc',
    secondary: '#40a9ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
  },
  light: {
    background: '#ffffff',
    foreground: '#333333',
    border: '#d9d9d9',
    primary: '#1890ff',
    secondary: '#40a9ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
  },
  'high-contrast': {
    background: '#000000',
    foreground: '#ffffff',
    border: '#ffffff',
    primary: '#00ffff',
    secondary: '#ffff00',
    success: '#00ff00',
    warning: '#ff8800',
    error: '#ff0000',
    info: '#0088ff',
  },
} as const;

// 레이아웃 설정
export const LAYOUTS = {
  default: {
    panels: ['tasks', 'work', 'context', 'logs'],
    sizes: [25, 40, 20, 15], // 퍼센트
  },
  focus: {
    panels: ['work'],
    sizes: [100],
  },
  compact: {
    panels: ['tasks', 'work'],
    sizes: [30, 70],
  },
} as const;

// 에러 코드
export const ERROR_CODES = {
  // MCP 관련
  MCP_CONNECTION_FAILED: 'MCP_001',
  MCP_TIMEOUT: 'MCP_002',
  MCP_INVALID_RESPONSE: 'MCP_003',
  
  // Claude Code 관련
  CLAUDE_NOT_FOUND: 'CLAUDE_001',
  CLAUDE_EXECUTION_FAILED: 'CLAUDE_002',
  CLAUDE_TIMEOUT: 'CLAUDE_003',
  
  // Terminal 관련
  TERMINAL_CREATION_FAILED: 'TERM_001',
  TERMINAL_NOT_FOUND: 'TERM_002',
  
  // 일반 에러
  UNKNOWN_ERROR: 'ERR_001',
  INVALID_INPUT: 'ERR_002',
  PERMISSION_DENIED: 'ERR_003',
} as const;

// 로그 레벨
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

// 파일 확장자 매핑 (아이콘용)
export const FILE_EXTENSIONS = {
  typescript: ['ts', 'tsx'],
  javascript: ['js', 'jsx'],
  python: ['py'],
  java: ['java'],
  cpp: ['cpp', 'cc', 'cxx', 'c++'],
  c: ['c', 'h'],
  csharp: ['cs'],
  go: ['go'],
  rust: ['rs'],
  ruby: ['rb'],
  php: ['php'],
  swift: ['swift'],
  kotlin: ['kt', 'kts'],
  markdown: ['md', 'markdown'],
  json: ['json'],
  xml: ['xml'],
  yaml: ['yaml', 'yml'],
  html: ['html', 'htm'],
  css: ['css', 'scss', 'sass', 'less'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'],
  video: ['mp4', 'avi', 'mov', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'flac'],
  archive: ['zip', 'tar', 'gz', 'rar', '7z'],
} as const;