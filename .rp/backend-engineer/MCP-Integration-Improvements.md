# MCP Server Integration Improvements

## 현재 상태 분석

### 문제점
1. **에러 처리 부족**: 개별 서버 실패 시 전체 초기화 실패
2. **재시도 메커니즘 없음**: 일시적 네트워크 오류 대응 불가
3. **상태 관리 미흡**: 각 서버의 연결 상태 개별 추적 안됨
4. **타임아웃 미설정**: 무한 대기 가능성
5. **헬스체크 없음**: 연결 후 상태 확인 안함

## 개선 사항

### 1. Enhanced MCP Manager
```typescript
import { EventEmitter } from 'events';
import { TaskManagerClient } from './TaskManagerClient';
import { Context7Client } from './Context7Client';
import { RetryPolicy, CircuitBreaker } from '../utils/resilience';

interface MCPServerConfig {
  name: string;
  client: MCPClient;
  required: boolean;
  retryPolicy?: RetryPolicy;
  healthCheckInterval?: number;
}

export class EnhancedMCPManager extends EventEmitter {
  private servers: Map<string, MCPServerState> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timer> = new Map();

  constructor(private config: MCPManagerConfig) {
    super();
    this.setupServers();
  }

  private setupServers() {
    // TaskManager 설정
    this.registerServer({
      name: 'taskManager',
      client: new TaskManagerClient(),
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      healthCheckInterval: 30000
    });

    // Context7 설정
    this.registerServer({
      name: 'context7',
      client: new Context7Client(),
      required: false,
      retryPolicy: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      healthCheckInterval: 30000
    });
  }

  async initialize(): Promise<InitializationResult> {
    const results: InitializationResult = {
      success: true,
      servers: {}
    };

    for (const [name, state] of this.servers) {
      try {
        await this.initializeServer(name, state);
        results.servers[name] = { success: true };
      } catch (error) {
        results.servers[name] = { 
          success: false, 
          error: error.message 
        };
        
        if (state.config.required) {
          results.success = false;
        }
      }
    }

    this.emit('initialized', results);
    return results;
  }

  private async initializeServer(
    name: string, 
    state: MCPServerState
  ): Promise<void> {
    const breaker = this.circuitBreakers.get(name)!;
    
    await breaker.execute(async () => {
      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 
        this.config.initTimeout || 30000)
      );

      await Promise.race([
        this.retryWithPolicy(
          () => state.client.initialize(),
          state.config.retryPolicy
        ),
        timeout
      ]);

      state.status = 'connected';
      state.lastConnected = new Date();

      // 헬스체크 시작
      if (state.config.healthCheckInterval) {
        this.startHealthCheck(name, state);
      }
    });
  }

  private async retryWithPolicy(
    operation: () => Promise<any>,
    policy?: RetryPolicy
  ): Promise<any> {
    if (!policy) return operation();

    let lastError: Error;
    let delay = policy.initialDelay;

    for (let i = 0; i <= policy.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (i < policy.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelay);
        }
      }
    }

    throw lastError!;
  }

  private startHealthCheck(name: string, state: MCPServerState) {
    const timer = setInterval(async () => {
      try {
        await state.client.healthCheck();
        state.lastHealthCheck = new Date();
        
        if (state.status !== 'connected') {
          state.status = 'connected';
          this.emit('serverReconnected', name);
        }
      } catch (error) {
        if (state.status === 'connected') {
          state.status = 'disconnected';
          this.emit('serverDisconnected', name, error);
          
          // 자동 재연결 시도
          this.reconnectServer(name).catch(console.error);
        }
      }
    }, state.config.healthCheckInterval!);

    this.healthCheckTimers.set(name, timer);
  }

  async call<T>(
    serverName: string, 
    method: string, 
    params?: any
  ): Promise<T> {
    const state = this.servers.get(serverName);
    if (!state) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    if (state.status !== 'connected') {
      throw new Error(`Server ${serverName} is not connected`);
    }

    const breaker = this.circuitBreakers.get(serverName)!;
    
    return breaker.execute(async () => {
      try {
        return await state.client.call(method, params);
      } catch (error) {
        // 특정 에러의 경우 재연결 시도
        if (this.isConnectionError(error)) {
          state.status = 'disconnected';
          this.emit('serverDisconnected', serverName, error);
          this.reconnectServer(serverName).catch(console.error);
        }
        throw error;
      }
    });
  }

  private isConnectionError(error: any): boolean {
    // 연결 관련 에러 판단 로직
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('connection');
  }
}
```

### 2. Improved TaskManager Client
```typescript
export class ImprovedTaskManagerClient extends MCPClient {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  
  async requestPlanning(request: PlanningRequest): Promise<PlanningResult> {
    // 요청 검증
    this.validateRequest(request);
    
    // 중복 요청 방지
    const requestId = this.generateRequestId(request);
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId)!.promise;
    }

    const pendingRequest = this.createPendingRequest();
    this.pendingRequests.set(requestId, pendingRequest);

    try {
      const result = await this.call('request_planning', {
        originalRequest: request.originalRequest,
        tasks: request.tasks,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'claude-code-controller',
          version: this.getVersion()
        }
      });

      pendingRequest.resolve(result);
      return result;
    } catch (error) {
      pendingRequest.reject(error);
      throw this.enhanceError(error);
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  async getNextTask(requestId: string): Promise<Task | null> {
    try {
      const result = await this.call('get_next_task', { requestId });
      
      // 결과 정규화
      if (result.status === 'all_tasks_done') {
        return null;
      }
      
      return this.normalizeTask(result.task);
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  private normalizeTask(rawTask: any): Task {
    return {
      id: rawTask.id,
      title: rawTask.title || 'Untitled Task',
      description: rawTask.description || '',
      status: rawTask.status || 'pending',
      priority: rawTask.priority || 'medium',
      createdAt: new Date(rawTask.createdAt || Date.now()),
      metadata: rawTask.metadata || {}
    };
  }

  private enhanceError(error: any): Error {
    if (error.code === 'METHOD_NOT_FOUND') {
      return new Error('TaskManager MCP server does not support this method. Please update the server.');
    }
    
    if (error.code === 'INVALID_PARAMS') {
      return new Error(`Invalid parameters: ${error.message}`);
    }
    
    return error;
  }
}
```

### 3. Context7 Client Improvements
```typescript
export class ImprovedContext7Client extends MCPClient {
  private cache: LRUCache<string, any>;
  private syncQueue: SyncQueue;

  constructor(config: Context7Config) {
    super(config);
    this.cache = new LRUCache({ 
      max: config.cacheSize || 100,
      ttl: config.cacheTTL || 3600000 // 1 hour
    });
    this.syncQueue = new SyncQueue();
  }

  async saveContext(context: Context): Promise<void> {
    // 로컬 캐시에 즉시 저장
    this.cache.set(context.id, context);
    
    // 비동기로 서버에 동기화
    this.syncQueue.enqueue(async () => {
      try {
        await this.call('save_context', {
          id: context.id,
          content: context.content,
          metadata: {
            ...context.metadata,
            savedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        // 실패 시 재시도 큐에 추가
        this.handleSyncError(context, error);
      }
    });
  }

  async searchContext(query: SearchQuery): Promise<SearchResult[]> {
    // 캐시 우선 검색
    const cachedResults = this.searchCache(query);
    if (cachedResults.length > 0 && !query.forceRefresh) {
      return cachedResults;
    }

    try {
      const results = await this.call('search_context', {
        query: query.text,
        filters: query.filters,
        limit: query.limit || 10
      });

      // 결과 캐싱
      results.forEach(result => {
        this.cache.set(result.id, result);
      });

      return results;
    } catch (error) {
      // 오프라인 모드 - 캐시된 결과만 반환
      if (this.isOffline(error)) {
        return cachedResults;
      }
      throw error;
    }
  }

  private searchCache(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const [id, context] of this.cache.entries()) {
      if (this.matchesQuery(context, query)) {
        results.push(context);
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.limit || 10);
  }
}
```

### 4. Error Handling Strategy
```typescript
export class MCPErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private errorThreshold = 5;
  private errorWindow = 60000; // 1 minute

  handleError(serverName: string, error: Error): ErrorAction {
    this.recordError(serverName);
    
    const errorType = this.classifyError(error);
    const errorCount = this.errorCounts.get(serverName) || 0;

    switch (errorType) {
      case 'CONNECTION':
        if (errorCount < this.errorThreshold) {
          return { action: 'RETRY', delay: 1000 * errorCount };
        }
        return { action: 'CIRCUIT_BREAK', duration: 60000 };

      case 'AUTHENTICATION':
        return { action: 'NOTIFY_USER', message: 'Authentication failed. Please check your API keys.' };

      case 'RATE_LIMIT':
        return { action: 'BACKOFF', delay: this.calculateBackoff(error) };

      case 'SERVER_ERROR':
        return { action: 'RETRY', delay: 5000 };

      default:
        return { action: 'LOG_AND_CONTINUE' };
    }
  }

  private classifyError(error: Error): ErrorType {
    if (error.message.includes('ECONNREFUSED')) return 'CONNECTION';
    if (error.message.includes('401') || error.message.includes('403')) return 'AUTHENTICATION';
    if (error.message.includes('429')) return 'RATE_LIMIT';
    if (error.message.includes('500') || error.message.includes('502')) return 'SERVER_ERROR';
    return 'UNKNOWN';
  }
}
```

## 구현 계획

### Phase 1: 기본 개선
1. 타임아웃 추가
2. 재시도 로직 구현
3. 에러 메시지 개선

### Phase 2: 복원력 강화
1. Circuit Breaker 패턴 구현
2. 헬스체크 메커니즘
3. 자동 재연결

### Phase 3: 고급 기능
1. 오프라인 모드 지원
2. 캐싱 레이어
3. 동기화 큐

## 테스트 전략

### 단위 테스트
```typescript
describe('MCPManager', () => {
  it('should handle server initialization failure gracefully', async () => {
    const manager = new EnhancedMCPManager({ initTimeout: 1000 });
    const mockServer = createMockServer({ failInit: true });
    
    manager.registerServer({
      name: 'test',
      client: mockServer,
      required: false
    });

    const result = await manager.initialize();
    expect(result.success).toBe(true);
    expect(result.servers.test.success).toBe(false);
  });

  it('should retry failed operations', async () => {
    const manager = new EnhancedMCPManager({});
    const mockServer = createMockServer({ 
      failCount: 2,
      retryPolicy: { maxRetries: 3 }
    });

    const result = await manager.call('test', 'method');
    expect(mockServer.callCount).toBe(3);
    expect(result).toBeDefined();
  });
});
```

### 통합 테스트
- 실제 MCP 서버와의 연결 테스트
- 네트워크 장애 시뮬레이션
- 장기 실행 안정성 테스트

## 모니터링 및 로깅

### 메트릭 수집
- 연결 성공/실패율
- 평균 응답 시간
- 에러 발생률
- 재시도 횟수

### 로그 레벨
- DEBUG: 상세 연결 정보
- INFO: 주요 이벤트
- WARN: 재시도, 타임아웃
- ERROR: 연결 실패, 치명적 오류