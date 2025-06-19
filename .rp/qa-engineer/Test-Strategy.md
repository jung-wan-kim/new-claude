# QA Engineer - Test Strategy & Implementation

## 테스트 철학

### 핵심 원칙
1. **예방 중심**: 버그 발견보다 예방에 중점
2. **자동화 우선**: 반복 가능한 자동화된 테스트
3. **빠른 피드백**: 개발 중 즉각적인 테스트 결과
4. **실제 사용 시나리오**: 실제 사용자 워크플로우 반영

## 테스트 피라미드

```
        /\
       /  \  E2E Tests (10%)
      /----\
     /      \  Integration Tests (30%)
    /--------\
   /          \  Unit Tests (60%)
  /____________\
```

## 테스트 전략

### 1. 단위 테스트 (Unit Tests)

#### 범위
- 개별 함수 및 클래스
- Store 시스템
- 유틸리티 함수
- 비즈니스 로직

#### 도구
- Jest
- TypeScript
- Mock 라이브러리

#### 예시: TaskStore 테스트
```typescript
// src/stores/__tests__/TaskStore.test.ts
import { TaskStore } from '../TaskStore';
import { Task, TaskStatus } from '../../shared/types';

describe('TaskStore', () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    taskStore = new TaskStore();
  });

  describe('Task Management', () => {
    it('should add a new task', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date()
      };

      taskStore.addTask(task);
      const tasks = taskStore.getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(task);
    });

    it('should update task status', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending'
      };

      taskStore.addTask(task);
      taskStore.updateTask('task-1', { status: 'in_progress' });

      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask?.status).toBe('in_progress');
    });

    it('should emit events on task changes', () => {
      const addSpy = jest.fn();
      const updateSpy = jest.fn();

      taskStore.on('task:added', addSpy);
      taskStore.on('task:updated', updateSpy);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending'
      };

      taskStore.addTask(task);
      expect(addSpy).toHaveBeenCalledWith(task);

      taskStore.updateTask('task-1', { status: 'completed' });
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle concurrent updates safely', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        progress: 0
      };

      taskStore.addTask(task);

      // 동시에 여러 업데이트
      const updates = Array(100).fill(0).map((_, i) => 
        taskStore.updateTask('task-1', { progress: i })
      );

      await Promise.all(updates);

      const finalTask = taskStore.getTask('task-1');
      expect(finalTask?.progress).toBeDefined();
      expect(finalTask?.progress).toBeGreaterThanOrEqual(0);
      expect(finalTask?.progress).toBeLessThan(100);
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      const tasks: Task[] = [
        { id: '1', title: 'Pending Task', status: 'pending' },
        { id: '2', title: 'In Progress Task', status: 'in_progress' },
        { id: '3', title: 'Completed Task', status: 'completed' },
        { id: '4', title: 'Failed Task', status: 'failed' }
      ];

      tasks.forEach(task => taskStore.addTask(task));
    });

    it('should filter tasks by status', () => {
      const pendingTasks = taskStore.getTasksByStatus('pending');
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].title).toBe('Pending Task');
    });

    it('should get active tasks', () => {
      const activeTasks = taskStore.getActiveTasks();
      expect(activeTasks).toHaveLength(2);
      expect(activeTasks.map(t => t.status)).toContain('pending');
      expect(activeTasks.map(t => t.status)).toContain('in_progress');
    });
  });
});
```

### 2. 통합 테스트 (Integration Tests)

#### 범위
- MCP 서버 연결
- Claude Code Bridge 통합
- Store 간 상호작용
- UI 컴포넌트 통합

#### 예시: MCP Manager 통합 테스트
```typescript
// src/mcp/__tests__/MCPManager.integration.test.ts
import { EnhancedMCPManager } from '../EnhancedMCPManager';
import { MockMCPServer } from '../__mocks__/MockMCPServer';

describe('MCP Manager Integration', () => {
  let mcpManager: EnhancedMCPManager;
  let mockTaskManager: MockMCPServer;
  let mockContext7: MockMCPServer;

  beforeEach(() => {
    mockTaskManager = new MockMCPServer('taskManager');
    mockContext7 = new MockMCPServer('context7');
    
    mcpManager = new EnhancedMCPManager({ initTimeout: 5000 });
    
    // Mock 서버 주입
    (mcpManager as any).servers.set('taskManager', {
      config: { name: 'taskManager', required: false },
      client: mockTaskManager,
      status: 'disconnected',
      errorCount: 0
    });
  });

  afterEach(async () => {
    await mcpManager.disconnect();
  });

  it('should initialize all servers', async () => {
    const result = await mcpManager.initialize();
    
    expect(result.success).toBe(true);
    expect(result.servers.taskManager.success).toBe(true);
    expect(result.servers.context7.success).toBe(true);
  });

  it('should handle server failure gracefully', async () => {
    mockTaskManager.failNext();
    
    const result = await mcpManager.initialize();
    
    expect(result.success).toBe(true); // 선택적 서버
    expect(result.servers.taskManager.success).toBe(false);
    expect(result.servers.taskManager.error).toBeDefined();
  });

  it('should retry failed connections', async () => {
    mockTaskManager.failCount = 2; // 처음 2번 실패
    
    const result = await mcpManager.initialize();
    
    expect(mockTaskManager.connectAttempts).toBe(3);
    expect(result.servers.taskManager.success).toBe(true);
  });

  it('should emit events on connection changes', async () => {
    const events: any[] = [];
    
    mcpManager.on('initialized', (e) => events.push({ type: 'initialized', data: e }));
    mcpManager.on('serverDisconnected', (name, error) => 
      events.push({ type: 'disconnected', name, error })
    );
    mcpManager.on('serverReconnected', (name) => 
      events.push({ type: 'reconnected', name })
    );

    await mcpManager.initialize();
    
    // 연결 끊김 시뮬레이션
    mockTaskManager.simulateDisconnect();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(events).toContainEqual(
      expect.objectContaining({ type: 'initialized' })
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'disconnected', name: 'taskManager' })
    );
  });
});
```

### 3. E2E 테스트 (End-to-End Tests)

#### 범위
- 전체 사용자 워크플로우
- 실제 MCP 서버 연동
- UI 상호작용
- 시스템 통합

#### 예시: 작업 생성 및 실행 E2E 테스트
```typescript
// test/e2e/task-workflow.e2e.test.ts
import { Application } from '../helpers/Application';
import { TestMCPServer } from '../helpers/TestMCPServer';

describe('Task Workflow E2E', () => {
  let app: Application;
  let testMCPServer: TestMCPServer;

  beforeAll(async () => {
    // 테스트 MCP 서버 시작
    testMCPServer = new TestMCPServer();
    await testMCPServer.start();

    // 애플리케이션 시작
    app = new Application({
      env: {
        MCP_TEST_MODE: 'true',
        MCP_TEST_PORT: testMCPServer.port
      }
    });
    
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
    await testMCPServer.stop();
  });

  it('should create and execute a task', async () => {
    // 1. 새 작업 생성
    await app.keyboard.press('cmd+n');
    await app.waitForDialog('New Task');
    
    await app.type('Test Task Title');
    await app.keyboard.press('tab');
    await app.type('Test task description');
    
    await app.clickButton('Create');

    // 2. 작업이 목록에 표시되는지 확인
    const taskList = await app.getTaskList();
    expect(taskList).toContain('Test Task Title');

    // 3. 작업 실행
    await app.selectTask('Test Task Title');
    await app.keyboard.press('enter');

    // 4. 실행 상태 확인
    await app.waitForTaskStatus('Test Task Title', 'in_progress');
    
    // 5. MCP 서버 호출 확인
    const mcpCalls = testMCPServer.getCalls();
    expect(mcpCalls).toContainEqual(
      expect.objectContaining({
        method: 'request_planning',
        params: expect.objectContaining({
          originalRequest: expect.stringContaining('Test Task Title')
        })
      })
    );

    // 6. 작업 완료 대기
    await app.waitForTaskStatus('Test Task Title', 'completed', 30000);

    // 7. 결과 확인
    const workPanel = await app.getWorkPanelContent();
    expect(workPanel).toContain('Task completed successfully');
  });

  it('should handle task failure gracefully', async () => {
    // MCP 서버가 에러 반환하도록 설정
    testMCPServer.setNextResponse({ error: 'Task execution failed' });

    await app.createTask('Failing Task', 'This task will fail');
    await app.selectTask('Failing Task');
    await app.keyboard.press('enter');

    await app.waitForTaskStatus('Failing Task', 'failed');

    // 에러 메시지 확인
    const notification = await app.getLastNotification();
    expect(notification.type).toBe('error');
    expect(notification.message).toContain('Task execution failed');
  });

  it('should save and restore context', async () => {
    // 작업 실행
    await app.createAndExecuteTask('Context Test Task');
    
    // 컨텍스트 패널로 이동
    await app.keyboard.press('cmd+3');
    
    // 컨텍스트 검색
    await app.keyboard.press('/');
    await app.type('Context Test');
    await app.keyboard.press('enter');

    // 검색 결과 확인
    const contextResults = await app.getContextSearchResults();
    expect(contextResults).toHaveLength(1);
    expect(contextResults[0]).toContain('Context Test Task');
  });
});
```

## 테스트 자동화

### 1. Pre-commit Hooks
```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 린트 실행
npm run lint

# 타입 체크
npm run typecheck

# 변경된 파일에 대한 테스트 실행
npm test -- --findRelatedTests $(git diff --cached --name-only)
```

### 2. Jest 설정
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.spec.ts',
    '**/test/**/*.e2e.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 3. 테스트 헬퍼
```typescript
// test/helpers/TestUtils.ts
export class TestUtils {
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  static createMockTask(overrides?: Partial<Task>): Task {
    return {
      id: `task-${Math.random()}`,
      title: 'Mock Task',
      description: 'Mock Description',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMockContext(overrides?: Partial<Context>): Context {
    return {
      id: `context-${Math.random()}`,
      taskId: 'task-1',
      content: 'Mock Context Content',
      createdAt: new Date(),
      ...overrides
    };
  }
}
```

## 성능 테스트

### 1. 벤치마크 테스트
```typescript
// test/performance/benchmark.test.ts
import { performance } from 'perf_hooks';
import { TaskStore } from '../../src/stores/TaskStore';

describe('Performance Benchmarks', () => {
  it('should handle 1000 tasks efficiently', () => {
    const store = new TaskStore();
    const startTime = performance.now();

    // 1000개 작업 추가
    for (let i = 0; i < 1000; i++) {
      store.addTask({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'pending'
      });
    }

    const addTime = performance.now() - startTime;
    expect(addTime).toBeLessThan(100); // 100ms 이내

    // 검색 성능
    const searchStart = performance.now();
    const results = store.searchTasks('Task 500');
    const searchTime = performance.now() - searchStart;
    
    expect(searchTime).toBeLessThan(10); // 10ms 이내
    expect(results).toHaveLength(1);
  });

  it('should render UI updates quickly', async () => {
    // UI 렌더링 성능 테스트
    const renderTimes: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      // UI 업데이트 시뮬레이션
      await updateUI();
      renderTimes.push(performance.now() - start);
    }

    const avgRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);

    expect(avgRenderTime).toBeLessThan(16); // 60 FPS
    expect(maxRenderTime).toBeLessThan(33); // 30 FPS worst case
  });
});
```

## 테스트 보고서

### 1. Coverage Report
```bash
# 커버리지 리포트 생성
npm test -- --coverage

# HTML 리포트 열기
open coverage/lcov-report/index.html
```

### 2. 테스트 결과 시각화
```typescript
// test/reporter/CustomReporter.ts
export class CustomReporter {
  onRunComplete(contexts, results) {
    const { numFailedTests, numPassedTests, numTotalTests } = results;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${numPassedTests}`);
    console.log(`❌ Failed: ${numFailedTests}`);
    console.log(`📝 Total: ${numTotalTests}`);
    
    const passRate = (numPassedTests / numTotalTests * 100).toFixed(2);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    // Slack 알림 전송
    if (process.env.CI) {
      this.sendSlackNotification(results);
    }
  }
}
```

## 테스트 모범 사례

### 1. 테스트 명명 규칙
```typescript
// ✅ Good
it('should return user data when valid ID is provided')
it('should throw ValidationError when email format is invalid')

// ❌ Bad
it('test user')
it('error case')
```

### 2. 테스트 구조
```typescript
// Arrange - Act - Assert 패턴
it('should calculate total price with discount', () => {
  // Arrange
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const discount = 0.1;

  // Act
  const total = calculateTotal(items, discount);

  // Assert
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

### 3. 테스트 격리
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    // 각 테스트마다 새로운 인스턴스
    mockDatabase = createMockDatabase();
    userService = new UserService(mockDatabase);
  });

  afterEach(() => {
    // 정리 작업
    jest.clearAllMocks();
  });
});
```

## 지속적인 개선

### 1. 테스트 메트릭 추적
- 코드 커버리지
- 테스트 실행 시간
- 실패율
- 플레이키 테스트

### 2. 정기적인 리뷰
- 월간 테스트 리뷰 미팅
- 실패 테스트 분석
- 테스트 개선 제안

### 3. 테스트 문서화
- 테스트 시나리오 문서
- 테스트 데이터 관리
- 트러블슈팅 가이드