// 공통 타입 정의

// Task 관련 타입
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  progress?: number; // 진행률 (0-100)
  startedAt?: string; // 시작 시간
  error?: string; // 에러 메시지
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  contextIds?: string[]; // 관련 컨텍스트 ID들
  metadata?: Record<string, any>; // 추가 메타데이터
}

export interface Request {
  id: string;
  originalRequest: string;
  tasks: Task[];
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

// Context 관련 타입
export interface ContextEntry {
  id: string;
  title: string;
  content: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Claude Code 관련 타입
export interface ClaudeCommand {
  id: string;
  command: string;
  context?: string[];
  workingDirectory?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// Terminal 관련 타입
export interface TerminalInfo {
  id: string;
  title: string;
  rows: number;
  cols: number;
  cwd: string;
  shell: string;
  active: boolean;
}

// UI 상태 타입
export interface UIState {
  activePanel: 'tasks' | 'work' | 'context' | 'logs';
  theme: 'dark' | 'light' | 'high-contrast';
  layout: 'default' | 'focus' | 'compact';
  showSidebar: boolean;
  showStatusBar: boolean;
}

// 워크플로우 타입
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  type: 'claude' | 'terminal' | 'mcp' | 'conditional';
  name: string;
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: any;
}

// 설정 타입
export interface AppSettings {
  general: {
    autoStart: boolean;
    minimizeToTray: boolean;
    checkForUpdates: boolean;
    language: 'en' | 'ko';
  };
  claude: {
    apiKey?: string;
    timeout: number;
    maxConcurrent: number;
  };
  mcp: {
    taskManagerPath?: string;
    context7Path?: string;
    autoReconnect: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    fontSize: number;
    fontFamily: string;
  };
  shortcuts: Record<string, string>;
}

// 로그 타입
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: any;
}

// 메트릭 타입
export interface Metrics {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    averageTime: number;
  };
  claude: {
    totalCommands: number;
    successRate: number;
    averageResponseTime: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
}

// MCP 관련 타입
export interface MCPManager {
  taskManager: any;
  context7: any;
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  isInitialized(): boolean;
  getStatus(): {
    initialized: boolean;
    services: {
      taskManager: boolean;
      context7: boolean;
    };
  };
}