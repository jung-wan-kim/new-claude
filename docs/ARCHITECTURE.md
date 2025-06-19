# Claude Code Controller (CCC) 백엔드 아키텍처

## 1. 시스템 아키텍처 다이어그램

### 1.1 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           macOS Native App Shell                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         Terminal UI (Blessed/Ink)                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                         CCC Core Engine (TypeScript)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   UI Controller  │  │  Event Manager  │  │  State Manager  │           │
│  │  - View Router   │  │ - Event Bus     │  │ - Redux Store   │           │
│  │  - Input Handler │  │ - Event Queue   │  │ - Persistence   │           │
│  │  - Renderer      │  │ - Subscribers   │  │ - Snapshots     │           │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                      │                     │                     │
│  ┌────────┴──────────────────────┴─────────────────────┴────────┐          │
│  │                      Application Layer                        │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │          │
│  │  │Task Manager │  │Context Mgr  │  │Session Mgr  │          │          │
│  │  │- Planning   │  │- Storage    │  │- Pool Mgmt  │          │          │
│  │  │- Execution  │  │- Retrieval  │  │- Lifecycle  │          │          │
│  │  │- Tracking   │  │- Search     │  │- Recovery   │          │          │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │                      Integration Layer                       │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │          │
│  │  │Claude Code  │  │MCP Client   │  │Process Mgr  │        │          │
│  │  │  Adapter    │  │- TaskMgr    │  │- Spawn      │        │          │
│  │  │- Commands   │  │- Context7   │  │- Monitor    │        │          │
│  │  │- Parser     │  │- Protocol   │  │- IPC        │        │          │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │          │
│  └─────────────────────────────────────────────────────────────┘          │
├─────────────────────────────────────────────────────────────────────────────┤
│                         External Services                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Claude Code    │  │ TaskManager MCP │  │  Context7 MCP   │           │
│  │      CLI        │  │     Server      │  │     Server      │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 플로우 아키텍처

```
User Input → Command Parser → Command Queue → Executor
    ↓              ↓               ↓            ↓
UI Update ← State Manager ← Event System ← Result Handler
    ↑              ↑               ↑            ↑
Terminal ← Renderer ← View Model ← Business Logic
```

## 2. 핵심 모듈 구조 및 책임

### 2.1 모듈 구조

```typescript
// src/core/modules.ts
export interface ICoreModule {
  name: string;
  version: string;
  dependencies: string[];
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

// 핵심 모듈 정의
export const CoreModules = {
  // UI 계층
  UIController: {
    responsibilities: [
      'Terminal UI 렌더링 관리',
      '사용자 입력 처리',
      '화면 레이아웃 제어',
      '키보드 단축키 매핑'
    ],
    interfaces: ['IRenderer', 'IInputHandler', 'ILayoutManager']
  },

  // 비즈니스 로직 계층
  TaskManager: {
    responsibilities: [
      '작업 계획 수립 및 관리',
      '작업 실행 오케스트레이션',
      '진행률 추적 및 보고',
      '작업 승인 워크플로우'
    ],
    interfaces: ['ITaskPlanner', 'ITaskExecutor', 'IProgressTracker']
  },

  ContextManager: {
    responsibilities: [
      '프로젝트 컨텍스트 저장/검색',
      '작업별 컨텍스트 자동 주입',
      '컨텍스트 버전 관리',
      '템플릿 관리'
    ],
    interfaces: ['IContextStore', 'IContextProvider', 'ITemplateManager']
  },

  SessionManager: {
    responsibilities: [
      'Claude Code 세션 생명주기 관리',
      '세션 풀 관리 및 재사용',
      '세션 상태 모니터링',
      '자동 복구 메커니즘'
    ],
    interfaces: ['ISessionPool', 'ISessionMonitor', 'IRecoveryHandler']
  },

  // 통합 계층
  ClaudeCodeAdapter: {
    responsibilities: [
      'Claude Code CLI 통신',
      '명령어 변환 및 실행',
      '출력 파싱 및 해석',
      '에러 감지 및 처리'
    ],
    interfaces: ['ICommandExecutor', 'IOutputParser', 'IErrorHandler']
  },

  MCPClient: {
    responsibilities: [
      'MCP 프로토콜 구현',
      'TaskManager/Context7 서버 통신',
      '연결 관리 및 재연결',
      '메시지 큐잉 및 동기화'
    ],
    interfaces: ['IMCPConnection', 'IMessageQueue', 'ISyncManager']
  },

  // 인프라 계층
  EventManager: {
    responsibilities: [
      '시스템 전역 이벤트 버스',
      '이벤트 구독/발행 관리',
      '이벤트 필터링 및 라우팅',
      '이벤트 히스토리 관리'
    ],
    interfaces: ['IEventBus', 'IEventSubscriber', 'IEventHistory']
  },

  StateManager: {
    responsibilities: [
      '애플리케이션 상태 중앙 관리',
      '상태 변경 추적 및 동기화',
      '상태 영속성 관리',
      '상태 스냅샷 및 복원'
    ],
    interfaces: ['IStateStore', 'IStatePersistence', 'IStateSnapshot']
  }
};
```

### 2.2 모듈 의존성 그래프

```
UIController
    ├── StateManager (상태 읽기)
    ├── EventManager (이벤트 발행)
    └── TaskManager (작업 표시)

TaskManager
    ├── MCPClient (taskmanager 통신)
    ├── ClaudeCodeAdapter (명령 실행)
    ├── ContextManager (컨텍스트 로드)
    └── StateManager (상태 업데이트)

ContextManager
    ├── MCPClient (context7 통신)
    └── StateManager (캐시 관리)

SessionManager
    ├── ClaudeCodeAdapter (프로세스 관리)
    └── EventManager (상태 변경 알림)

ClaudeCodeAdapter
    ├── ProcessManager (프로세스 생성)
    └── EventManager (출력 스트림 이벤트)

MCPClient
    ├── EventManager (연결 상태 이벤트)
    └── StateManager (연결 정보 저장)
```

## 3. Claude Code CLI 통신 인터페이스 설계

### 3.1 명령 실행 인터페이스

```typescript
// src/adapters/claude-code/interfaces.ts
export interface IClaudeCodeCommand {
  id: string;
  command: string;
  args?: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  context?: ICommandContext;
}

export interface ICommandContext {
  taskId: string;
  projectId: string;
  contextIds: string[];
  metadata: Record<string, any>;
}

export interface IClaudeCodeAdapter {
  // 명령 실행
  execute(command: IClaudeCodeCommand): Promise<ICommandResult>;
  
  // 스트리밍 실행 (실시간 출력)
  executeStream(
    command: IClaudeCodeCommand,
    onData: (chunk: IOutputChunk) => void,
    onError: (error: Error) => void
  ): ICommandExecution;
  
  // 세션 관리
  createSession(config: ISessionConfig): Promise<IClaudeSession>;
  terminateSession(sessionId: string): Promise<void>;
  
  // 상태 확인
  getStatus(): IClaudeCodeStatus;
  isAvailable(): Promise<boolean>;
}

export interface ICommandExecution {
  id: string;
  sessionId: string;
  startTime: Date;
  
  // 제어 메서드
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(): Promise<void>;
  
  // 상태 확인
  getProgress(): IExecutionProgress;
  isRunning(): boolean;
  
  // Promise 인터페이스
  then<TResult>(
    onfulfilled?: (value: ICommandResult) => TResult
  ): Promise<TResult>;
}
```

### 3.2 출력 파싱 및 해석

```typescript
// src/adapters/claude-code/parser.ts
export class ClaudeOutputParser {
  private patterns = {
    // 작업 시작/종료 패턴
    taskStart: /^Task started: (.+)$/,
    taskComplete: /^Task completed: (.+)$/,
    
    // 진행률 패턴
    progress: /^Progress: (\d+)%$/,
    
    // 파일 변경 패턴
    fileCreated: /^Created: (.+)$/,
    fileModified: /^Modified: (.+)$/,
    fileDeleted: /^Deleted: (.+)$/,
    
    // 에러 패턴
    error: /^Error: (.+)$/,
    warning: /^Warning: (.+)$/,
    
    // 승인 요청 패턴
    approvalRequest: /^Approval required: (.+)$/,
    
    // 컨텍스트 참조 패턴
    contextReference: /^Using context: (.+)$/
  };
  
  parse(output: string): IParseResult {
    const lines = output.split('\n');
    const events: IOutputEvent[] = [];
    const metadata: IOutputMetadata = {};
    
    for (const line of lines) {
      for (const [type, pattern] of Object.entries(this.patterns)) {
        const match = line.match(pattern);
        if (match) {
          events.push({
            type: type as OutputEventType,
            data: match[1],
            timestamp: new Date(),
            raw: line
          });
          break;
        }
      }
    }
    
    return { events, metadata, raw: output };
  }
  
  // 스트리밍 파서
  createStreamParser(): IStreamParser {
    return new StreamParser(this.patterns);
  }
}

// 스트리밍 출력 처리
export class StreamParser {
  private buffer = '';
  private incompleteLineBuffer = '';
  
  process(chunk: string): IOutputEvent[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    
    // 마지막 줄이 불완전할 수 있으므로 보관
    this.incompleteLineBuffer = lines.pop() || '';
    this.buffer = this.incompleteLineBuffer;
    
    const events: IOutputEvent[] = [];
    for (const line of lines) {
      const event = this.parseLine(line);
      if (event) events.push(event);
    }
    
    return events;
  }
  
  flush(): IOutputEvent[] {
    if (this.buffer) {
      const event = this.parseLine(this.buffer);
      this.buffer = '';
      return event ? [event] : [];
    }
    return [];
  }
}
```

### 3.3 프로세스 관리

```typescript
// src/adapters/claude-code/process-manager.ts
export class ClaudeProcessManager {
  private processes = new Map<string, IClaudeProcess>();
  private processPool: IProcessPool;
  
  constructor(private config: IProcessConfig) {
    this.processPool = new ProcessPool(config.maxConcurrent);
  }
  
  async spawn(command: IClaudeCodeCommand): Promise<IClaudeProcess> {
    const process = await this.processPool.acquire();
    
    const claudeProcess: IClaudeProcess = {
      id: generateId(),
      pid: process.pid,
      command,
      startTime: new Date(),
      
      // 스트림
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
      
      // 제어
      kill: (signal?: string) => process.kill(signal),
      pause: () => process.kill('SIGSTOP'),
      resume: () => process.kill('SIGCONT'),
      
      // 상태
      exitCode: null,
      status: 'running'
    };
    
    // 프로세스 모니터링
    this.monitorProcess(claudeProcess, process);
    
    this.processes.set(claudeProcess.id, claudeProcess);
    return claudeProcess;
  }
  
  private monitorProcess(
    claudeProcess: IClaudeProcess,
    process: ChildProcess
  ) {
    // 종료 처리
    process.on('exit', (code, signal) => {
      claudeProcess.exitCode = code;
      claudeProcess.status = 'terminated';
      claudeProcess.endTime = new Date();
      
      this.processPool.release(process);
      
      this.emit('process:exit', {
        processId: claudeProcess.id,
        exitCode: code,
        signal,
        duration: claudeProcess.endTime - claudeProcess.startTime
      });
    });
    
    // 에러 처리
    process.on('error', (error) => {
      claudeProcess.status = 'error';
      claudeProcess.error = error;
      
      this.emit('process:error', {
        processId: claudeProcess.id,
        error
      });
    });
    
    // CPU/메모리 모니터링
    const monitor = setInterval(() => {
      if (claudeProcess.status !== 'running') {
        clearInterval(monitor);
        return;
      }
      
      const usage = process.cpuUsage();
      const memory = process.memoryUsage();
      
      this.emit('process:metrics', {
        processId: claudeProcess.id,
        cpu: usage,
        memory
      });
    }, 1000);
  }
}
```

## 4. MCP 클라이언트 구현 전략

### 4.1 MCP 프로토콜 추상화

```typescript
// src/mcp/client/base.ts
export abstract class MCPClient<TRequest, TResponse> {
  protected connection: IMCPConnection;
  protected messageQueue: IMessageQueue<TRequest>;
  protected pendingRequests = new Map<string, IPendingRequest>();
  
  constructor(
    protected serverUrl: string,
    protected config: IMCPConfig
  ) {
    this.messageQueue = new MessageQueue(config.queueSize);
    this.setupConnection();
  }
  
  // 연결 관리
  private async setupConnection() {
    this.connection = await MCPConnection.create({
      url: this.serverUrl,
      reconnect: true,
      reconnectDelay: this.config.reconnectDelay,
      maxReconnectAttempts: this.config.maxReconnectAttempts
    });
    
    this.connection.on('message', this.handleMessage.bind(this));
    this.connection.on('error', this.handleError.bind(this));
    this.connection.on('disconnect', this.handleDisconnect.bind(this));
  }
  
  // 메시지 전송
  protected async send<T extends TRequest>(
    method: string,
    params: T
  ): Promise<TResponse> {
    const request: IMCPRequest = {
      id: generateRequestId(),
      method,
      params,
      timestamp: new Date()
    };
    
    // Promise 생성 및 저장
    const promise = new Promise<TResponse>((resolve, reject) => {
      this.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          reject(new Error('Request timeout'));
          this.pendingRequests.delete(request.id);
        }, this.config.requestTimeout)
      });
    });
    
    // 큐에 추가
    await this.messageQueue.enqueue(request);
    
    // 연결 상태 확인 후 전송
    if (this.connection.isConnected()) {
      await this.flushQueue();
    }
    
    return promise;
  }
  
  // 메시지 처리
  private handleMessage(message: IMCPMessage) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      clearTimeout(pending.timeout);
      
      if (message.error) {
        pending.reject(new MCPError(message.error));
      } else {
        pending.resolve(message.result as TResponse);
      }
      
      this.pendingRequests.delete(message.id);
    } else {
      // 서버 주도 메시지 처리
      this.handleServerMessage(message);
    }
  }
  
  // 추상 메서드 - 서브클래스에서 구현
  protected abstract handleServerMessage(message: IMCPMessage): void;
  protected abstract validateResponse(response: any): response is TResponse;
}
```

### 4.2 TaskManager MCP 클라이언트

```typescript
// src/mcp/client/taskmanager.ts
export class TaskManagerClient extends MCPClient<
  TaskManagerRequest,
  TaskManagerResponse
> {
  constructor(config: ITaskManagerConfig) {
    super(config.serverUrl || 'ws://localhost:3000', config);
  }
  
  // 작업 계획
  async planRequest(request: IPlanRequest): Promise<IRequestPlan> {
    const response = await this.send('request_planning', {
      originalRequest: request.description,
      tasks: request.tasks.map(t => ({
        title: t.title,
        description: t.description
      })),
      splitDetails: request.splitDetails
    });
    
    return this.transformResponse(response);
  }
  
  // 다음 작업 가져오기
  async getNextTask(requestId: string): Promise<ITask | null> {
    const response = await this.send('get_next_task', { requestId });
    
    if (response.all_tasks_done) {
      return null;
    }
    
    return response.task;
  }
  
  // 작업 완료 표시
  async markTaskDone(
    requestId: string,
    taskId: string,
    details?: string
  ): Promise<void> {
    await this.send('mark_task_done', {
      requestId,
      taskId,
      completedDetails: details
    });
  }
  
  // 작업 승인
  async approveTask(
    requestId: string,
    taskId: string
  ): Promise<void> {
    await this.send('approve_task_completion', {
      requestId,
      taskId
    });
  }
  
  // 서버 주도 메시지 처리
  protected handleServerMessage(message: IMCPMessage) {
    switch (message.method) {
      case 'task_status_update':
        this.emit('task:status', message.params);
        break;
      case 'progress_update':
        this.emit('progress:update', message.params);
        break;
      default:
        console.warn('Unknown server message:', message.method);
    }
  }
  
  // 실시간 업데이트 구독
  subscribeToUpdates(
    requestId: string,
    callback: (update: ITaskUpdate) => void
  ): ISubscription {
    const handler = (data: any) => {
      if (data.requestId === requestId) {
        callback(data);
      }
    };
    
    this.on('task:status', handler);
    this.on('progress:update', handler);
    
    return {
      unsubscribe: () => {
        this.off('task:status', handler);
        this.off('progress:update', handler);
      }
    };
  }
}
```

### 4.3 Context7 MCP 클라이언트

```typescript
// src/mcp/client/context7.ts
export class Context7Client extends MCPClient<
  Context7Request,
  Context7Response
> {
  private cache: IContextCache;
  
  constructor(config: IContext7Config) {
    super(config.serverUrl || 'ws://localhost:3001', config);
    this.cache = new ContextCache(config.cacheSize);
  }
  
  // 컨텍스트 검색
  async search(query: string, filters?: ISearchFilters): Promise<IContext[]> {
    // 캐시 확인
    const cacheKey = this.getCacheKey('search', query, filters);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await this.send('context7_search', {
      query,
      filters
    });
    
    // 캐시 저장
    this.cache.set(cacheKey, response.contexts, 300); // 5분 캐시
    
    return response.contexts;
  }
  
  // 컨텍스트 생성
  async create(context: IContextCreate): Promise<IContext> {
    const response = await this.send('context7_create', {
      title: context.title,
      content: context.content,
      type: context.type,
      tags: context.tags,
      metadata: context.metadata
    });
    
    // 캐시 무효화
    this.cache.invalidatePattern('search:*');
    
    return response.context;
  }
  
  // 컨텍스트 업데이트
  async update(
    id: string,
    updates: Partial<IContextCreate>
  ): Promise<IContext> {
    const response = await this.send('context7_update', {
      id,
      updates
    });
    
    // 캐시 업데이트
    this.cache.delete(`get:${id}`);
    this.cache.invalidatePattern('search:*');
    
    return response.context;
  }
  
  // 컨텍스트 연결
  async link(
    sourceId: string,
    targetId: string,
    relationship: string
  ): Promise<void> {
    await this.send('context7_link', {
      source_id: sourceId,
      target_id: targetId,
      relationship
    });
  }
  
  // 자동 컨텍스트 주입
  async getRelevantContexts(
    taskDescription: string,
    limit: number = 5
  ): Promise<IContext[]> {
    // 지능적 검색 - 작업 설명에서 키워드 추출
    const keywords = this.extractKeywords(taskDescription);
    
    const contexts = await this.search(keywords.join(' '), {
      type: 'code,reference,note',
      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 최근 30일
      tags: keywords
    });
    
    // 관련성 점수 계산 및 정렬
    return contexts
      .map(ctx => ({
        ...ctx,
        relevanceScore: this.calculateRelevance(ctx, taskDescription)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 (실제로는 더 정교한 NLP 사용)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but']);
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }
  
  private calculateRelevance(
    context: IContext,
    taskDescription: string
  ): number {
    let score = 0;
    const desc = taskDescription.toLowerCase();
    
    // 제목 매칭
    if (context.title.toLowerCase().includes(desc)) score += 10;
    
    // 내용 매칭
    const matches = (context.content.match(new RegExp(desc, 'gi')) || []).length;
    score += matches * 2;
    
    // 태그 매칭
    context.tags?.forEach(tag => {
      if (desc.includes(tag.toLowerCase())) score += 5;
    });
    
    // 최신성 가중치
    const age = Date.now() - new Date(context.created_at).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    score *= Math.max(0.5, 1 - ageDays / 30);
    
    return score;
  }
}
```

## 5. 상태 관리 및 이벤트 처리 아키텍처

### 5.1 Redux 기반 상태 관리

```typescript
// src/state/store.ts
export interface IRootState {
  app: IAppState;
  tasks: ITasksState;
  contexts: IContextsState;
  sessions: ISessionsState;
  ui: IUIState;
  logs: ILogsState;
}

// 앱 전역 상태
export interface IAppState {
  status: 'initializing' | 'ready' | 'busy' | 'error';
  version: string;
  config: IAppConfig;
  metrics: IAppMetrics;
}

// 작업 상태
export interface ITasksState {
  byId: Record<string, ITask>;
  byRequestId: Record<string, string[]>;
  activeTaskId: string | null;
  queue: string[];
  history: ITaskHistoryEntry[];
}

// Redux Toolkit 슬라이스
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: initialTasksState,
  reducers: {
    taskAdded(state, action: PayloadAction<ITask>) {
      state.byId[action.payload.id] = action.payload;
      state.queue.push(action.payload.id);
    },
    
    taskUpdated(state, action: PayloadAction<{
      id: string;
      updates: Partial<ITask>;
    }>) {
      const task = state.byId[action.payload.id];
      if (task) {
        Object.assign(task, action.payload.updates);
      }
    },
    
    taskCompleted(state, action: PayloadAction<string>) {
      const task = state.byId[action.payload];
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        state.queue = state.queue.filter(id => id !== action.payload);
        state.history.push({
          taskId: action.payload,
          timestamp: new Date().toISOString(),
          event: 'completed'
        });
      }
    }
  }
});

// 비동기 액션 (Redux Thunk)
export const executeTask = createAsyncThunk(
  'tasks/execute',
  async (taskId: string, { dispatch, getState, extra }) => {
    const { claudeAdapter, taskManager } = extra as IThunkExtra;
    const state = getState() as IRootState;
    const task = state.tasks.byId[taskId];
    
    dispatch(tasksSlice.actions.taskUpdated({
      id: taskId,
      updates: { status: 'running' }
    }));
    
    try {
      // 컨텍스트 로드
      const contexts = await extra.contextManager.getRelevantContexts(
        task.description
      );
      
      // Claude Code 실행
      const result = await claudeAdapter.execute({
        command: task.command,
        context: {
          taskId,
          contextIds: contexts.map(c => c.id)
        }
      });
      
      // 결과 처리
      dispatch(tasksSlice.actions.taskCompleted(taskId));
      return result;
      
    } catch (error) {
      dispatch(tasksSlice.actions.taskUpdated({
        id: taskId,
        updates: { status: 'failed', error: error.message }
      }));
      throw error;
    }
  }
);
```

### 5.2 이벤트 버스 시스템

```typescript
// src/events/event-bus.ts
export class EventBus extends EventEmitter {
  private eventQueue: IEventQueue;
  private subscribers = new Map<string, Set<IEventHandler>>();
  private middleware: IEventMiddleware[] = [];
  
  constructor(config: IEventBusConfig) {
    super();
    this.setMaxListeners(config.maxListeners || 100);
    this.eventQueue = new EventQueue(config.queueSize || 1000);
    
    // 이벤트 처리 워커
    this.startEventProcessor();
  }
  
  // 타입 안전 이벤트 발행
  emit<K extends keyof IEventMap>(
    event: K,
    payload: IEventMap[K]
  ): boolean {
    const eventData: IEvent = {
      id: generateEventId(),
      type: event,
      payload,
      timestamp: new Date(),
      source: this.getEventSource()
    };
    
    // 미들웨어 처리
    const processedEvent = this.processMiddleware(eventData);
    if (!processedEvent) return false;
    
    // 큐에 추가
    this.eventQueue.enqueue(processedEvent);
    
    return true;
  }
  
  // 타입 안전 구독
  on<K extends keyof IEventMap>(
    event: K,
    handler: (payload: IEventMap[K]) => void
  ): this {
    const wrappedHandler = this.wrapHandler(handler);
    
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event)!.add(wrappedHandler);
    super.on(event, wrappedHandler);
    
    return this;
  }
  
  // 미들웨어 추가
  use(middleware: IEventMiddleware): void {
    this.middleware.push(middleware);
  }
  
  // 이벤트 처리 워커
  private async startEventProcessor() {
    while (true) {
      const event = await this.eventQueue.dequeue();
      if (!event) {
        await sleep(10);
        continue;
      }
      
      try {
        // 동기 이벤트 처리
        super.emit(event.type, event.payload);
        
        // 비동기 핸들러 처리
        const asyncHandlers = this.getAsyncHandlers(event.type);
        if (asyncHandlers.length > 0) {
          await Promise.all(
            asyncHandlers.map(handler => 
              handler(event.payload).catch(this.handleError)
            )
          );
        }
        
      } catch (error) {
        this.handleError(error, event);
      }
    }
  }
  
  // 에러 처리
  private handleError(error: Error, event?: IEvent) {
    console.error('Event processing error:', error);
    this.emit('error', {
      error,
      event,
      timestamp: new Date()
    });
  }
}

// 이벤트 타입 정의
export interface IEventMap {
  // 작업 이벤트
  'task:created': ITaskCreatedEvent;
  'task:started': ITaskStartedEvent;
  'task:progress': ITaskProgressEvent;
  'task:completed': ITaskCompletedEvent;
  'task:failed': ITaskFailedEvent;
  'task:approved': ITaskApprovedEvent;
  
  // 세션 이벤트
  'session:created': ISessionCreatedEvent;
  'session:terminated': ISessionTerminatedEvent;
  'session:error': ISessionErrorEvent;
  
  // 시스템 이벤트
  'system:ready': ISystemReadyEvent;
  'system:error': ISystemErrorEvent;
  'system:shutdown': ISystemShutdownEvent;
}
```

### 5.3 상태와 이벤트 동기화

```typescript
// src/state/sync.ts
export class StateEventSync {
  constructor(
    private store: Store<IRootState>,
    private eventBus: EventBus
  ) {
    this.setupEventListeners();
    this.setupStoreSubscription();
  }
  
  private setupEventListeners() {
    // 이벤트 → 상태 동기화
    this.eventBus.on('task:created', (event) => {
      this.store.dispatch(tasksSlice.actions.taskAdded(event.task));
    });
    
    this.eventBus.on('task:progress', (event) => {
      this.store.dispatch(tasksSlice.actions.taskUpdated({
        id: event.taskId,
        updates: { progress: event.progress }
      }));
    });
    
    // ... 기타 이벤트 핸들러
  }
  
  private setupStoreSubscription() {
    // 상태 → 이벤트 동기화
    let previousState = this.store.getState();
    
    this.store.subscribe(() => {
      const currentState = this.store.getState();
      
      // 상태 변경 감지 및 이벤트 발행
      this.detectChanges(previousState, currentState);
      
      previousState = currentState;
    });
  }
  
  private detectChanges(prev: IRootState, curr: IRootState) {
    // 작업 상태 변경 감지
    Object.keys(curr.tasks.byId).forEach(taskId => {
      const prevTask = prev.tasks.byId[taskId];
      const currTask = curr.tasks.byId[taskId];
      
      if (!prevTask && currTask) {
        this.eventBus.emit('task:created', {
          task: currTask,
          timestamp: new Date()
        });
      } else if (prevTask && currTask) {
        if (prevTask.status !== currTask.status) {
          this.eventBus.emit(`task:${currTask.status}`, {
            taskId,
            task: currTask,
            timestamp: new Date()
          });
        }
      }
    });
  }
}
```

## 6. 에러 처리 및 복구 메커니즘

### 6.1 계층별 에러 처리

```typescript
// src/errors/error-handler.ts
export class ErrorHandler {
  private strategies = new Map<ErrorType, IErrorStrategy>();
  private circuitBreaker: ICircuitBreaker;
  
  constructor(private config: IErrorConfig) {
    this.setupStrategies();
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
  }
  
  private setupStrategies() {
    // Claude Code 에러
    this.strategies.set(ErrorType.ClaudeCode, {
      canRecover: (error) => {
        return error.code === 'ECONNRESET' || 
               error.code === 'ETIMEDOUT';
      },
      
      recover: async (error, context) => {
        // 재시도 로직
        const retryConfig = {
          maxAttempts: 3,
          delay: 1000,
          backoff: 2
        };
        
        return retry(
          () => context.retry(),
          retryConfig
        );
      },
      
      fallback: async (error, context) => {
        // 대체 동작
        return {
          success: false,
          error: error.message,
          suggestion: 'Claude Code가 응답하지 않습니다. 수동으로 실행해주세요.'
        };
      }
    });
    
    // MCP 연결 에러
    this.strategies.set(ErrorType.MCPConnection, {
      canRecover: (error) => true,
      
      recover: async (error, context) => {
        // 재연결 시도
        await context.mcpClient.reconnect();
        return context.retry();
      },
      
      fallback: async (error, context) => {
        // 오프라인 모드로 전환
        context.store.dispatch(setOfflineMode(true));
        return {
          success: false,
          offline: true,
          cached: await context.cache.get(context.key)
        };
      }
    });
  }
  
  async handle(
    error: Error,
    context: IErrorContext
  ): Promise<IErrorResult> {
    // 에러 분류
    const errorType = this.classifyError(error);
    const strategy = this.strategies.get(errorType);
    
    if (!strategy) {
      return this.defaultHandler(error, context);
    }
    
    // Circuit Breaker 확인
    if (this.circuitBreaker.isOpen(errorType)) {
      return strategy.fallback(error, context);
    }
    
    try {
      // 복구 가능한 경우
      if (strategy.canRecover(error)) {
        const result = await strategy.recover(error, context);
        this.circuitBreaker.recordSuccess(errorType);
        return result;
      }
    } catch (recoveryError) {
      this.circuitBreaker.recordFailure(errorType);
      // 복구 실패
    }
    
    // Fallback 실행
    return strategy.fallback(error, context);
  }
  
  private classifyError(error: Error): ErrorType {
    if (error.message.includes('Claude Code')) {
      return ErrorType.ClaudeCode;
    }
    if (error.message.includes('MCP') || error.message.includes('WebSocket')) {
      return ErrorType.MCPConnection;
    }
    if (error.message.includes('Task')) {
      return ErrorType.TaskExecution;
    }
    return ErrorType.Unknown;
  }
}
```

### 6.2 자동 복구 시스템

```typescript
// src/recovery/auto-recovery.ts
export class AutoRecoverySystem {
  private monitors = new Map<string, IHealthMonitor>();
  private recoveryQueue: IRecoveryQueue;
  
  constructor(
    private errorHandler: ErrorHandler,
    private config: IRecoveryConfig
  ) {
    this.recoveryQueue = new RecoveryQueue();
    this.setupMonitors();
  }
  
  private setupMonitors() {
    // Claude Code 프로세스 모니터
    this.monitors.set('claude-process', {
      check: async () => {
        const adapter = this.getClaudeAdapter();
        return adapter.isAvailable();
      },
      
      recover: async () => {
        const adapter = this.getClaudeAdapter();
        
        // 프로세스 재시작
        await adapter.restart();
        
        // 중단된 작업 복구
        const pendingTasks = await this.getPendingTasks();
        for (const task of pendingTasks) {
          this.recoveryQueue.enqueue({
            type: 'task',
            id: task.id,
            action: () => this.resumeTask(task)
          });
        }
      },
      
      interval: 5000 // 5초마다 체크
    });
    
    // MCP 연결 모니터
    this.monitors.set('mcp-connection', {
      check: async () => {
        const clients = [
          this.getTaskManagerClient(),
          this.getContext7Client()
        ];
        
        return Promise.all(
          clients.map(client => client.isConnected())
        ).then(results => results.every(r => r));
      },
      
      recover: async () => {
        // 재연결 시도
        await Promise.all([
          this.getTaskManagerClient().reconnect(),
          this.getContext7Client().reconnect()
        ]);
        
        // 동기화
        await this.syncState();
      },
      
      interval: 3000
    });
    
    // 모니터 시작
    this.startMonitoring();
  }
  
  private async startMonitoring() {
    for (const [name, monitor] of this.monitors) {
      setInterval(async () => {
        try {
          const isHealthy = await monitor.check();
          
          if (!isHealthy) {
            console.warn(`Monitor ${name} detected unhealthy state`);
            await monitor.recover();
          }
        } catch (error) {
          console.error(`Monitor ${name} error:`, error);
        }
      }, monitor.interval);
    }
    
    // 복구 큐 처리
    this.processRecoveryQueue();
  }
  
  private async processRecoveryQueue() {
    while (true) {
      const item = await this.recoveryQueue.dequeue();
      if (!item) {
        await sleep(100);
        continue;
      }
      
      try {
        await item.action();
        console.log(`Recovery completed: ${item.type} ${item.id}`);
      } catch (error) {
        console.error(`Recovery failed: ${item.type} ${item.id}`, error);
        
        // 재시도 또는 수동 개입 요청
        if (item.attempts < this.config.maxRecoveryAttempts) {
          item.attempts = (item.attempts || 0) + 1;
          this.recoveryQueue.enqueue(item);
        } else {
          this.requestManualIntervention(item, error);
        }
      }
    }
  }
}
```

### 6.3 체크포인트 및 롤백

```typescript
// src/recovery/checkpoint.ts
export class CheckpointManager {
  private storage: ICheckpointStorage;
  
  constructor(config: ICheckpointConfig) {
    this.storage = new CheckpointStorage(config.storagePath);
  }
  
  // 체크포인트 생성
  async createCheckpoint(
    taskId: string,
    state: ITaskState
  ): Promise<ICheckpoint> {
    const checkpoint: ICheckpoint = {
      id: generateCheckpointId(),
      taskId,
      timestamp: new Date(),
      state: {
        ...state,
        files: await this.captureFileState(state.affectedFiles)
      }
    };
    
    await this.storage.save(checkpoint);
    return checkpoint;
  }
  
  // 롤백
  async rollback(checkpointId: string): Promise<void> {
    const checkpoint = await this.storage.load(checkpointId);
    
    // 파일 상태 복원
    for (const file of checkpoint.state.files) {
      await this.restoreFile(file);
    }
    
    // 작업 상태 복원
    await this.restoreTaskState(
      checkpoint.taskId,
      checkpoint.state
    );
  }
  
  // 자동 체크포인트
  setupAutoCheckpoint(interval: number = 60000) {
    setInterval(async () => {
      const activeTasks = await this.getActiveTasks();
      
      for (const task of activeTasks) {
        if (this.shouldCheckpoint(task)) {
          await this.createCheckpoint(task.id, task.state);
        }
      }
    }, interval);
  }
  
  private shouldCheckpoint(task: ITask): boolean {
    // 체크포인트 생성 조건
    return (
      task.status === 'running' &&
      task.duration > 30000 && // 30초 이상 실행
      task.lastCheckpoint < Date.now() - 60000 // 마지막 체크포인트로부터 1분 경과
    );
  }
}
```

## 7. 데이터 모델 및 저장소

### 7.1 핵심 데이터 모델

```typescript
// src/models/core.ts

// 작업 모델
export interface ITask {
  id: string;
  requestId: string;
  title: string;
  description: string;
  command: string;
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;
  dependencies: string[];
  
  // 메타데이터
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  
  // 실행 정보
  sessionId?: string;
  executionId?: string;
  output?: ITaskOutput;
  error?: ITaskError;
  
  // 컨텍스트
  contextIds: string[];
  projectId: string;
  
  // 체크포인트
  checkpoints: ICheckpoint[];
  lastCheckpoint?: Date;
}

// 컨텍스트 모델
export interface IContext {
  id: string;
  title: string;
  content: string;
  type: ContextType;
  tags: string[];
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  accessCount: number;
  
  // 관계
  projectId?: string;
  taskIds: string[];
  linkedContexts: IContextLink[];
  
  // 버전 관리
  version: number;
  history: IContextVersion[];
}

// 세션 모델
export interface ISession {
  id: string;
  type: 'claude-code';
  status: SessionStatus;
  
  // 프로세스 정보
  pid?: number;
  startedAt: Date;
  lastActivity: Date;
  
  // 설정
  config: ISessionConfig;
  environment: Record<string, string>;
  
  // 메트릭
  metrics: ISessionMetrics;
  
  // 작업 연결
  activeTaskId?: string;
  executedTasks: string[];
}

// 프로젝트 모델
export interface IProject {
  id: string;
  name: string;
  path: string;
  description?: string;
  
  // 설정
  config: IProjectConfig;
  templates: IWorkflowTemplate[];
  
  // 통계
  stats: IProjectStats;
  
  // 타임스탬프
  createdAt: Date;
  lastAccessedAt: Date;
}
```

### 7.2 저장소 아키텍처

```typescript
// src/storage/repository.ts
export abstract class Repository<T extends { id: string }> {
  constructor(
    protected storage: IStorage,
    protected entityName: string
  ) {}
  
  async findById(id: string): Promise<T | null> {
    return this.storage.get<T>(`${this.entityName}:${id}`);
  }
  
  async findAll(): Promise<T[]> {
    const keys = await this.storage.keys(`${this.entityName}:*`);
    return Promise.all(
      keys.map(key => this.storage.get<T>(key))
    ).then(items => items.filter(Boolean) as T[]);
  }
  
  async save(entity: T): Promise<T> {
    await this.storage.set(
      `${this.entityName}:${entity.id}`,
      entity
    );
    await this.index(entity);
    return entity;
  }
  
  async delete(id: string): Promise<void> {
    await this.storage.delete(`${this.entityName}:${id}`);
    await this.removeFromIndex(id);
  }
  
  // 인덱싱
  protected abstract index(entity: T): Promise<void>;
  protected abstract removeFromIndex(id: string): Promise<void>;
}

// 작업 저장소
export class TaskRepository extends Repository<ITask> {
  constructor(storage: IStorage) {
    super(storage, 'task');
  }
  
  async findByStatus(status: TaskStatus): Promise<ITask[]> {
    const index = await this.storage.get<string[]>(
      `index:task:status:${status}`
    ) || [];
    
    return Promise.all(
      index.map(id => this.findById(id))
    ).then(tasks => tasks.filter(Boolean) as ITask[]);
  }
  
  async findByProject(projectId: string): Promise<ITask[]> {
    const index = await this.storage.get<string[]>(
      `index:task:project:${projectId}`
    ) || [];
    
    return Promise.all(
      index.map(id => this.findById(id))
    ).then(tasks => tasks.filter(Boolean) as ITask[]);
  }
  
  protected async index(task: ITask): Promise<void> {
    // 상태별 인덱스
    await this.addToIndex(
      `index:task:status:${task.status}`,
      task.id
    );
    
    // 프로젝트별 인덱스
    await this.addToIndex(
      `index:task:project:${task.projectId}`,
      task.id
    );
    
    // 날짜별 인덱스
    const date = task.createdAt.toISOString().split('T')[0];
    await this.addToIndex(
      `index:task:date:${date}`,
      task.id
    );
  }
  
  private async addToIndex(key: string, id: string): Promise<void> {
    const index = await this.storage.get<string[]>(key) || [];
    if (!index.includes(id)) {
      index.push(id);
      await this.storage.set(key, index);
    }
  }
}
```

### 7.3 영속성 계층

```typescript
// src/storage/persistence.ts
export class PersistenceLayer {
  private db: IDatabase;
  private cache: ICache;
  private fileStorage: IFileStorage;
  
  constructor(config: IPersistenceConfig) {
    // SQLite for structured data
    this.db = new SQLiteDatabase(config.dbPath);
    
    // Redis-like cache
    this.cache = new MemoryCache(config.cacheSize);
    
    // File system for large data
    this.fileStorage = new FileStorage(config.dataDir);
  }
  
  // 트랜잭션 지원
  async transaction<T>(
    fn: (tx: ITransaction) => Promise<T>
  ): Promise<T> {
    const tx = await this.db.beginTransaction();
    
    try {
      const result = await fn(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
  
  // 캐싱 전략
  async getWithCache<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // 캐시 확인
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;
    
    // 로드 및 캐시
    const value = await loader();
    await this.cache.set(key, value, ttl);
    
    return value;
  }
  
  // 백업 및 복원
  async backup(): Promise<string> {
    const backupId = generateBackupId();
    const backupPath = path.join(
      this.fileStorage.path,
      'backups',
      backupId
    );
    
    // DB 백업
    await this.db.backup(path.join(backupPath, 'db.sqlite'));
    
    // 파일 백업
    await this.fileStorage.backup(backupPath);
    
    // 메타데이터
    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify({
        id: backupId,
        timestamp: new Date(),
        version: APP_VERSION
      })
    );
    
    return backupId;
  }
  
  async restore(backupId: string): Promise<void> {
    const backupPath = path.join(
      this.fileStorage.path,
      'backups',
      backupId
    );
    
    // 메타데이터 확인
    const metadata = await fs.readFile(
      path.join(backupPath, 'metadata.json'),
      'utf-8'
    ).then(JSON.parse);
    
    // 버전 호환성 확인
    if (!this.isCompatibleVersion(metadata.version)) {
      throw new Error('Incompatible backup version');
    }
    
    // 복원
    await this.db.restore(path.join(backupPath, 'db.sqlite'));
    await this.fileStorage.restore(backupPath);
    
    // 캐시 초기화
    await this.cache.clear();
  }
}
```

## 8. 성능 최적화 전략

### 8.1 비동기 처리 최적화

```typescript
// src/optimization/async-processor.ts
export class AsyncProcessor {
  private workerPool: IWorkerPool;
  private taskQueue: IPriorityQueue<IProcessingTask>;
  private concurrencyLimit: number;
  
  constructor(config: IProcessorConfig) {
    this.concurrencyLimit = config.concurrency || os.cpus().length;
    this.workerPool = new WorkerPool({
      size: this.concurrencyLimit,
      workerScript: config.workerScript
    });
    this.taskQueue = new PriorityQueue(
      (a, b) => b.priority - a.priority
    );
  }
  
  // 배치 처리
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options?: IBatchOptions
  ): Promise<R[]> {
    const batchSize = options?.batchSize || 10;
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(item => 
          this.processWithRetry(
            () => processor(item),
            options?.retryOptions
          )
        )
      );
      
      results.push(...batchResults);
      
      // 백프레셔 처리
      if (this.taskQueue.size() > this.concurrencyLimit * 2) {
        await this.waitForCapacity();
      }
    }
    
    return results;
  }
  
  // 스트리밍 처리
  async *processStream<T, R>(
    stream: AsyncIterable<T>,
    processor: (item: T) => Promise<R>
  ): AsyncGenerator<R> {
    const buffer: Promise<R>[] = [];
    const maxBuffer = this.concurrencyLimit;
    
    for await (const item of stream) {
      // 버퍼에 추가
      const promise = processor(item);
      buffer.push(promise);
      
      // 버퍼가 가득 차면 일부 처리
      if (buffer.length >= maxBuffer) {
        const result = await buffer.shift()!;
        yield result;
      }
    }
    
    // 남은 항목 처리
    for (const promise of buffer) {
      yield await promise;
    }
  }
  
  // 우선순위 기반 처리
  async schedule<T>(
    task: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.enqueue({
        id: generateTaskId(),
        priority,
        execute: async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    while (this.taskQueue.size() > 0) {
      const activeTasks = this.workerPool.getActiveTasks();
      
      if (activeTasks < this.concurrencyLimit) {
        const task = this.taskQueue.dequeue();
        if (task) {
          this.workerPool.execute(task);
        }
      } else {
        await sleep(10);
      }
    }
  }
}
```

### 8.2 메모리 최적화

```typescript
// src/optimization/memory-manager.ts
export class MemoryManager {
  private memoryThreshold: number;
  private gcInterval: number;
  private weakRefs = new WeakMap();
  
  constructor(config: IMemoryConfig) {
    this.memoryThreshold = config.threshold || 0.8; // 80% 메모리 사용
    this.gcInterval = config.gcInterval || 60000; // 1분
    
    this.startMonitoring();
  }
  
  // 대용량 데이터 스트리밍
  createStreamingCache<T>(): IStreamingCache<T> {
    return {
      write: async (key: string, data: AsyncIterable<T>) => {
        const chunks: T[] = [];
        let chunkSize = 0;
        
        for await (const item of data) {
          chunks.push(item);
          chunkSize += this.estimateSize(item);
          
          // 청크 크기 제한
          if (chunkSize > 1024 * 1024) { // 1MB
            await this.flushChunk(key, chunks);
            chunks.length = 0;
            chunkSize = 0;
          }
        }
        
        // 남은 데이터 플러시
        if (chunks.length > 0) {
          await this.flushChunk(key, chunks);
        }
      },
      
      read: async function* (key: string): AsyncIterable<T> {
        const chunkCount = await this.getChunkCount(key);
        
        for (let i = 0; i < chunkCount; i++) {
          const chunk = await this.readChunk<T>(key, i);
          for (const item of chunk) {
            yield item;
          }
          
          // 메모리 압박 시 GC 트리거
          if (this.isMemoryPressure()) {
            global.gc?.();
          }
        }
      }
    };
  }
  
  // 약한 참조 캐시
  createWeakCache<K extends object, V>(): IWeakCache<K, V> {
    const refs = new WeakMap<K, WeakRef<V>>();
    const finalizationRegistry = new FinalizationRegistry((key: K) => {
      refs.delete(key);
    });
    
    return {
      get: (key: K): V | undefined => {
        const ref = refs.get(key);
        if (ref) {
          const value = ref.deref();
          if (value) return value;
          refs.delete(key);
        }
        return undefined;
      },
      
      set: (key: K, value: V) => {
        const ref = new WeakRef(value);
        refs.set(key, ref);
        finalizationRegistry.register(value, key);
      },
      
      has: (key: K): boolean => {
        const ref = refs.get(key);
        if (ref) {
          const value = ref.deref();
          if (value) return true;
          refs.delete(key);
        }
        return false;
      }
    };
  }
  
  // 메모리 모니터링
  private startMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed / usage.heapTotal;
      
      if (heapUsed > this.memoryThreshold) {
        this.triggerMemoryOptimization();
      }
      
      // 메트릭 수집
      this.collectMetrics({
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      });
    }, this.gcInterval);
  }
  
  private triggerMemoryOptimization() {
    // 캐시 정리
    this.clearExpiredCaches();
    
    // 대용량 객체 해제
    this.releaseLargeObjects();
    
    // 강제 GC (가능한 경우)
    if (global.gc) {
      global.gc();
    }
  }
}
```

### 8.3 네트워크 최적화

```typescript
// src/optimization/network-optimizer.ts
export class NetworkOptimizer {
  private connectionPool: IConnectionPool;
  private requestBatcher: IRequestBatcher;
  private compressionEnabled: boolean;
  
  constructor(config: INetworkConfig) {
    this.connectionPool = new ConnectionPool({
      maxConnections: config.maxConnections || 10,
      keepAlive: true,
      keepAliveTimeout: 60000
    });
    
    this.requestBatcher = new RequestBatcher({
      maxBatchSize: config.batchSize || 50,
      maxWaitTime: config.batchWait || 100
    });
    
    this.compressionEnabled = config.compression ?? true;
  }
  
  // 요청 배칭
  async batchRequest<T, R>(
    endpoint: string,
    request: T
  ): Promise<R> {
    return this.requestBatcher.add(endpoint, request);
  }
  
  // 연결 재사용
  async request<T>(
    options: IRequestOptions
  ): Promise<T> {
    const connection = await this.connectionPool.acquire();
    
    try {
      // 압축 적용
      if (this.compressionEnabled && options.body) {
        options.headers = {
          ...options.headers,
          'Content-Encoding': 'gzip'
        };
        options.body = await this.compress(options.body);
      }
      
      // 요청 실행
      const response = await connection.request(options);
      
      // 응답 압축 해제
      if (response.headers['content-encoding'] === 'gzip') {
        response.body = await this.decompress(response.body);
      }
      
      return response.body;
      
    } finally {
      this.connectionPool.release(connection);
    }
  }
  
  // WebSocket 멀티플렉싱
  createMultiplexedSocket(url: string): IMultiplexedSocket {
    const socket = new WebSocket(url);
    const channels = new Map<string, ISocketChannel>();
    
    return {
      createChannel: (channelId: string): ISocketChannel => {
        const channel: ISocketChannel = {
          id: channelId,
          
          send: (data: any) => {
            socket.send(JSON.stringify({
              channel: channelId,
              data
            }));
          },
          
          on: (event: string, handler: Function) => {
            // 채널별 이벤트 핸들러 등록
          },
          
          close: () => {
            channels.delete(channelId);
          }
        };
        
        channels.set(channelId, channel);
        return channel;
      },
      
      close: () => {
        socket.close();
        channels.clear();
      }
    };
  }
}
```

## 9. 보안 고려사항

### 9.1 인증 및 권한 관리

```typescript
// src/security/auth-manager.ts
export class AuthManager {
  private keychain: IKeychain;
  private tokenManager: ITokenManager;
  
  constructor(config: IAuthConfig) {
    this.keychain = new MacOSKeychain(config.serviceName);
    this.tokenManager = new TokenManager(config.tokenConfig);
  }
  
  // API 키 안전한 저장
  async storeApiKey(
    service: string,
    apiKey: string
  ): Promise<void> {
    const encrypted = await this.encrypt(apiKey);
    await this.keychain.setPassword(
      service,
      'api-key',
      encrypted
    );
  }
  
  // API 키 검색
  async getApiKey(service: string): Promise<string | null> {
    const encrypted = await this.keychain.getPassword(
      service,
      'api-key'
    );
    
    if (!encrypted) return null;
    
    return this.decrypt(encrypted);
  }
  
  // 토큰 관리
  async generateToken(
    payload: ITokenPayload
  ): Promise<string> {
    return this.tokenManager.generate(payload);
  }
  
  async verifyToken(token: string): Promise<ITokenPayload> {
    return this.tokenManager.verify(token);
  }
  
  // 암호화
  private async encrypt(data: string): Promise<string> {
    const key = await this.getDerivedKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }
  
  private async decrypt(encryptedData: string): Promise<string> {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const key = await this.getDerivedKey();
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 9.2 안전한 프로세스 실행

```typescript
// src/security/secure-executor.ts
export class SecureExecutor {
  private sandbox: ISandbox;
  private validator: ICommandValidator;
  
  constructor(config: ISecurityConfig) {
    this.sandbox = new ProcessSandbox(config.sandbox);
    this.validator = new CommandValidator(config.validation);
  }
  
  // 명령어 검증 및 실행
  async execute(command: ICommand): Promise<IExecutionResult> {
    // 명령어 검증
    const validation = await this.validator.validate(command);
    if (!validation.isValid) {
      throw new SecurityError(
        `Invalid command: ${validation.reason}`
      );
    }
    
    // 샌드박스 환경 준비
    const sandboxEnv = await this.sandbox.prepare({
      allowedPaths: command.allowedPaths || [],
      env: this.sanitizeEnvironment(command.env),
      timeout: command.timeout || 300000, // 5분
      memoryLimit: command.memoryLimit || 512 * 1024 * 1024 // 512MB
    });
    
    try {
      // 샌드박스에서 실행
      const result = await sandboxEnv.execute(command);
      
      // 결과 검증
      this.validateOutput(result);
      
      return result;
    } finally {
      // 샌드박스 정리
      await sandboxEnv.cleanup();
    }
  }
  
  // 환경 변수 정제
  private sanitizeEnvironment(
    env?: Record<string, string>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedKeys = new Set([
      'PATH',
      'HOME',
      'USER',
      'LANG',
      'LC_ALL'
    ]);
    
    for (const [key, value] of Object.entries(env || {})) {
      if (allowedKeys.has(key) || key.startsWith('CCC_')) {
        sanitized[key] = this.sanitizeValue(value);
      }
    }
    
    return sanitized;
  }
  
  // 출력 검증
  private validateOutput(result: IExecutionResult): void {
    // 민감한 정보 검출
    const sensitivePatterns = [
      /api[_-]?key/i,
      /password/i,
      /secret/i,
      /token/i
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(result.stdout) || pattern.test(result.stderr)) {
        console.warn('Sensitive information detected in output');
        // 필터링 또는 경고
      }
    }
  }
}
```

### 9.3 감사 로깅

```typescript
// src/security/audit-logger.ts
export class AuditLogger {
  private storage: IAuditStorage;
  private encryptor: IEncryptor;
  
  constructor(config: IAuditConfig) {
    this.storage = new SecureAuditStorage(config.storagePath);
    this.encryptor = new AuditEncryptor(config.encryptionKey);
  }
  
  // 감사 로그 기록
  async log(event: IAuditEvent): Promise<void> {
    const auditEntry: IAuditEntry = {
      id: generateAuditId(),
      timestamp: new Date(),
      type: event.type,
      severity: event.severity,
      actor: event.actor,
      action: event.action,
      resource: event.resource,
      result: event.result,
      metadata: event.metadata,
      
      // 체크섬
      checksum: this.calculateChecksum(event)
    };
    
    // 암호화
    const encrypted = await this.encryptor.encrypt(auditEntry);
    
    // 저장
    await this.storage.append(encrypted);
    
    // 중요 이벤트 실시간 알림
    if (event.severity === 'critical') {
      await this.notifySecurityTeam(auditEntry);
    }
  }
  
  // 감사 로그 검색
  async search(
    criteria: IAuditSearchCriteria
  ): Promise<IAuditEntry[]> {
    const entries = await this.storage.query(criteria);
    
    // 복호화 및 무결성 검증
    const decrypted = await Promise.all(
      entries.map(async entry => {
        const decrypted = await this.encryptor.decrypt(entry);
        
        // 무결성 검증
        const expectedChecksum = this.calculateChecksum(decrypted);
        if (decrypted.checksum !== expectedChecksum) {
          throw new Error('Audit log integrity check failed');
        }
        
        return decrypted;
      })
    );
    
    return decrypted;
  }
  
  // 보안 이벤트 타입
  async logSecurityEvent(
    type: SecurityEventType,
    details: any
  ): Promise<void> {
    await this.log({
      type: 'security',
      severity: this.getSeverity(type),
      actor: this.getCurrentUser(),
      action: type,
      resource: details.resource,
      result: details.result,
      metadata: {
        ...details,
        ip: this.getClientIP(),
        userAgent: this.getUserAgent()
      }
    });
  }
}
```

## 10. API 설계 (내부 모듈 간 인터페이스)

### 10.1 내부 API 아키텍처

```typescript
// src/api/internal/architecture.ts
export interface IInternalAPI {
  // 모듈 간 통신 계약
  version: string;
  modules: Map<string, IModuleAPI>;
  
  // 모듈 등록
  register(module: IModule): void;
  
  // 모듈 간 호출
  call<T>(
    targetModule: string,
    method: string,
    params?: any
  ): Promise<T>;
  
  // 이벤트 기반 통신
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
}

// 모듈 API 인터페이스
export interface IModuleAPI {
  // 메타데이터
  name: string;
  version: string;
  dependencies: string[];
  
  // 공개 메서드
  methods: Map<string, IMethodDefinition>;
  
  // 이벤트
  events: Map<string, IEventDefinition>;
  
  // 초기화
  initialize(context: IModuleContext): Promise<void>;
  
  // 정리
  shutdown(): Promise<void>;
}
```

### 10.2 핵심 모듈 API

```typescript
// src/api/internal/modules/task-manager-api.ts
export class TaskManagerAPI implements IModuleAPI {
  name = 'taskManager';
  version = '1.0.0';
  dependencies = ['mcpClient', 'contextManager'];
  
  methods = new Map([
    ['createTask', {
      description: '새 작업 생성',
      params: z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high']).optional()
      }),
      returns: z.object({
        id: z.string(),
        status: z.string()
      }),
      handler: this.createTask.bind(this)
    }],
    
    ['executeTask', {
      description: '작업 실행',
      params: z.object({
        taskId: z.string(),
        options: z.object({
          autoApprove: z.boolean().optional(),
          timeout: z.number().optional()
        }).optional()
      }),
      returns: z.object({
        result: z.any(),
        duration: z.number()
      }),
      handler: this.executeTask.bind(this)
    }],
    
    ['getTaskStatus', {
      description: '작업 상태 조회',
      params: z.object({
        taskId: z.string()
      }),
      returns: z.object({
        status: z.string(),
        progress: z.number(),
        output: z.any().optional()
      }),
      handler: this.getTaskStatus.bind(this)
    }]
  ]);
  
  events = new Map([
    ['task:created', {
      description: '작업 생성됨',
      schema: z.object({
        taskId: z.string(),
        task: z.any()
      })
    }],
    
    ['task:progress', {
      description: '작업 진행률 업데이트',
      schema: z.object({
        taskId: z.string(),
        progress: z.number()
      })
    }],
    
    ['task:completed', {
      description: '작업 완료됨',
      schema: z.object({
        taskId: z.string(),
        result: z.any()
      })
    }]
  ]);
  
  // API 구현
  private async createTask(params: any): Promise<any> {
    const task = await this.taskService.create(params);
    
    this.emit('task:created', {
      taskId: task.id,
      task
    });
    
    return {
      id: task.id,
      status: task.status
    };
  }
  
  private async executeTask(params: any): Promise<any> {
    const startTime = Date.now();
    
    // 컨텍스트 로드
    const contexts = await this.api.call(
      'contextManager',
      'getRelevantContexts',
      { taskId: params.taskId }
    );
    
    // 실행
    const result = await this.taskExecutor.execute(
      params.taskId,
      {
        ...params.options,
        contexts
      }
    );
    
    return {
      result,
      duration: Date.now() - startTime
    };
  }
}
```

### 10.3 API 게이트웨이

```typescript
// src/api/internal/gateway.ts
export class InternalAPIGateway implements IInternalAPI {
  version = '1.0.0';
  modules = new Map<string, IModuleAPI>();
  
  private validator: IAPIValidator;
  private rateLimiter: IRateLimiter;
  private circuitBreaker: ICircuitBreaker;
  
  constructor(config: IGatewayConfig) {
    this.validator = new APIValidator();
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
  }
  
  // 모듈 등록
  register(module: IModuleAPI): void {
    // 의존성 확인
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(
          `Missing dependency: ${dep} for module ${module.name}`
        );
      }
    }
    
    // 초기화
    module.initialize({
      api: this,
      config: this.getModuleConfig(module.name)
    });
    
    this.modules.set(module.name, module);
    
    console.log(`Module registered: ${module.name} v${module.version}`);
  }
  
  // API 호출
  async call<T>(
    targetModule: string,
    method: string,
    params?: any
  ): Promise<T> {
    // 모듈 확인
    const module = this.modules.get(targetModule);
    if (!module) {
      throw new Error(`Module not found: ${targetModule}`);
    }
    
    // 메서드 확인
    const methodDef = module.methods.get(method);
    if (!methodDef) {
      throw new Error(
        `Method not found: ${targetModule}.${method}`
      );
    }
    
    // 검증
    const validatedParams = await this.validator.validate(
      methodDef.params,
      params
    );
    
    // 속도 제한
    await this.rateLimiter.check(
      `${targetModule}.${method}`
    );
    
    // Circuit Breaker
    return this.circuitBreaker.execute(
      `${targetModule}.${method}`,
      async () => {
        // 실행
        const result = await methodDef.handler(validatedParams);
        
        // 결과 검증
        return this.validator.validate(
          methodDef.returns,
          result
        );
      }
    );
  }
  
  // 이벤트 시스템
  emit(event: string, data: any): void {
    // 이벤트 스키마 검증
    const [moduleName, eventName] = event.split(':');
    const module = this.modules.get(moduleName);
    
    if (module) {
      const eventDef = module.events.get(eventName);
      if (eventDef) {
        const validated = this.validator.validateSync(
          eventDef.schema,
          data
        );
        super.emit(event, validated);
      }
    }
  }
}
```

### 10.4 API 미들웨어

```typescript
// src/api/internal/middleware.ts
export interface IAPIMiddleware {
  name: string;
  
  // 요청 전처리
  preProcess?(
    context: ICallContext
  ): Promise<ICallContext | null>;
  
  // 응답 후처리
  postProcess?(
    context: ICallContext,
    result: any
  ): Promise<any>;
  
  // 에러 처리
  onError?(
    context: ICallContext,
    error: Error
  ): Promise<void>;
}

// 로깅 미들웨어
export class LoggingMiddleware implements IAPIMiddleware {
  name = 'logging';
  
  async preProcess(context: ICallContext): Promise<ICallContext> {
    console.log(`API Call: ${context.module}.${context.method}`, {
      params: context.params,
      caller: context.caller,
      timestamp: new Date()
    });
    
    context.startTime = Date.now();
    return context;
  }
  
  async postProcess(
    context: ICallContext,
    result: any
  ): Promise<any> {
    const duration = Date.now() - context.startTime!;
    
    console.log(`API Response: ${context.module}.${context.method}`, {
      duration,
      success: true
    });
    
    // 메트릭 수집
    this.metrics.record({
      module: context.module,
      method: context.method,
      duration,
      success: true
    });
    
    return result;
  }
  
  async onError(
    context: ICallContext,
    error: Error
  ): Promise<void> {
    console.error(`API Error: ${context.module}.${context.method}`, {
      error: error.message,
      stack: error.stack,
      params: context.params
    });
    
    // 에러 메트릭
    this.metrics.record({
      module: context.module,
      method: context.method,
      error: error.message,
      success: false
    });
  }
}

// 캐싱 미들웨어
export class CachingMiddleware implements IAPIMiddleware {
  name = 'caching';
  private cache: ICache;
  
  constructor(config: ICacheConfig) {
    this.cache = new MemoryCache(config);
  }
  
  async preProcess(context: ICallContext): Promise<ICallContext | null> {
    // 캐시 가능한 메서드인지 확인
    if (!this.isCacheable(context)) {
      return context;
    }
    
    const cacheKey = this.getCacheKey(context);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      // 캐시 히트 - null 반환하여 실제 호출 스킵
      context.result = cached;
      return null;
    }
    
    return context;
  }
  
  async postProcess(
    context: ICallContext,
    result: any
  ): Promise<any> {
    if (this.isCacheable(context)) {
      const cacheKey = this.getCacheKey(context);
      await this.cache.set(
        cacheKey,
        result,
        this.getTTL(context)
      );
    }
    
    return result;
  }
  
  private isCacheable(context: ICallContext): boolean {
    // GET 성격의 메서드만 캐시
    const cacheableMethods = [
      'getTaskStatus',
      'getContext',
      'getProjectInfo'
    ];
    
    return cacheableMethods.includes(context.method);
  }
}
```

## 마무리

이 아키텍처 문서는 Claude Code Controller의 백엔드 시스템을 위한 포괄적인 설계를 제공합니다. 주요 특징:

1. **모듈화된 구조**: 각 모듈이 명확한 책임과 인터페이스를 가짐
2. **확장 가능한 설계**: 플러그인 시스템과 이벤트 기반 아키텍처
3. **강력한 에러 처리**: 자동 복구와 체크포인트 시스템
4. **성능 최적화**: 비동기 처리, 메모리 관리, 네트워크 최적화
5. **보안 강화**: 암호화, 샌드박싱, 감사 로깅
6. **타입 안전성**: TypeScript를 통한 전체 시스템의 타입 안전성 보장

이 아키텍처를 기반으로 구현하면 안정적이고 확장 가능한 Claude Code Controller를 만들 수 있을 것입니다.