import { EventEmitter } from 'events';
import { Task } from '../shared/types';
import { TaskStore } from '../stores/TaskStore';
import { EnhancedMCPManager } from '../mcp/EnhancedMCPManager';
import { ClaudeCodeBridge } from '../claude/ClaudeCodeBridge';
import { LogStore } from '../stores/LogStore';

export interface TaskExecutionOptions {
  autoApprove?: boolean;
  maxConcurrent?: number;
  timeout?: number;
}

export class TaskExecutor extends EventEmitter {
  private runningTasks: Map<string, TaskExecution> = new Map();
  private taskQueue: Task[] = [];

  constructor(
    private taskStore: TaskStore,
    private mcpManager: EnhancedMCPManager,
    private claudeBridge: ClaudeCodeBridge,
    private logStore: LogStore,
    private options: TaskExecutionOptions = {}
  ) {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Claude 실행 결과 리스너
    this.claudeBridge.on('command:completed', (result) => {
      this.handleCommandCompleted(result);
    });

    this.claudeBridge.on('command:failed', (error) => {
      this.handleCommandFailed(error);
    });

    this.claudeBridge.on('output', (data) => {
      this.emit('task:output', data);
    });
  }

  async createAndExecuteTask(data: {
    title: string;
    description: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<Task> {
    // 1. MCP를 통해 Task 생성
    const task = await this.createTaskViaMCP(data);

    // 2. Task를 로컬 스토어에 추가
    this.taskStore.addTask(task);

    // 3. Task 실행
    await this.executeTask(task);

    return task;
  }

  private async createTaskViaMCP(data: {
    title: string;
    description: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<Task> {
    try {
      // TaskManager MCP를 사용하여 Task 생성
      const result = await this.mcpManager.taskManager.request_planning({
        originalRequest: data.title,
        tasks: [
          {
            title: data.title,
            description: data.description,
          },
        ],
      });

      // 생성된 Task 정보를 가져옴
      const nextTask = await this.mcpManager.taskManager.get_next_task({
        requestId: result.requestId,
      });

      if (!nextTask || !nextTask.task) {
        throw new Error('Failed to create task via MCP');
      }

      return {
        id: nextTask.task.id,
        title: nextTask.task.title,
        description: nextTask.task.description,
        status: 'pending',
        priority: data.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logStore.error(`Failed to create task via MCP: ${error}`, 'TaskExecutor');

      // Fallback: 로컬에서 Task 생성
      return {
        id: `local-${Date.now()}`,
        title: data.title,
        description: data.description,
        status: 'pending',
        priority: data.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async executeTask(task: Task): Promise<void> {
    // 이미 실행 중인지 확인
    if (this.runningTasks.has(task.id)) {
      this.logStore.warn(`Task ${task.id} is already running`, 'TaskExecutor');
      return;
    }

    // 동시 실행 제한 확인
    const maxConcurrent = this.options.maxConcurrent || 3;
    if (this.runningTasks.size >= maxConcurrent) {
      this.taskQueue.push(task);
      this.logStore.info(
        `Task ${task.id} queued (${this.taskQueue.length} in queue)`,
        'TaskExecutor'
      );
      return;
    }

    // Task 실행 시작
    const execution: TaskExecution = {
      task,
      startTime: Date.now(),
      status: 'running',
    };

    this.runningTasks.set(task.id, execution);
    this.emit('task:started', task);

    // Task 상태 업데이트
    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    this.taskStore.updateTaskStatus(task.id, 'in_progress');

    try {
      // Claude에 명령 전송
      const command = this.buildClaudeCommand(task);
      await this.claudeBridge.executeCommand(command);

      // 타임아웃 설정
      if (this.options.timeout) {
        setTimeout(() => {
          if (this.runningTasks.has(task.id)) {
            this.handleTaskTimeout(task);
          }
        }, this.options.timeout);
      }
    } catch (error: any) {
      this.handleTaskError(task, error);
    }
  }

  private buildClaudeCommand(task: Task): string {
    // Task를 Claude 명령으로 변환
    let command = task.description;

    // Context 정보 추가 (있다면)
    if (task.contextIds && task.contextIds.length > 0) {
      command = `With context: ${task.contextIds.join(', ')}\n\n${command}`;
    }

    return command;
  }

  private async handleCommandCompleted(result: any) {
    // 실행 중인 Task 찾기
    const execution = Array.from(this.runningTasks.values()).find((e) => e.status === 'running');

    if (!execution) return;

    const task = execution.task;

    // Task 완료 처리
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.progress = 100;

    this.taskStore.updateTaskStatus(task.id, 'completed');
    this.runningTasks.delete(task.id);

    // MCP에 완료 알림
    if (task.id.startsWith('task-')) {
      try {
        await this.mcpManager.taskManager.mark_task_done({
          requestId: execution.requestId,
          taskId: task.id,
          completedDetails: result.output || 'Task completed successfully',
        });

        // 자동 승인 모드인 경우
        if (this.options.autoApprove) {
          await this.mcpManager.taskManager.approve_task_completion({
            requestId: execution.requestId,
            taskId: task.id,
          });
        }
      } catch (error) {
        this.logStore.error(`Failed to update MCP task status: ${error}`, 'TaskExecutor');
      }
    }

    this.emit('task:completed', task);
    this.logStore.info(`Task ${task.id} completed successfully`, 'TaskExecutor');

    // 대기 중인 Task 실행
    this.processQueue();
  }

  private async handleCommandFailed(error: any) {
    // 실행 중인 Task 찾기
    const execution = Array.from(this.runningTasks.values()).find((e) => e.status === 'running');

    if (!execution) return;

    this.handleTaskError(execution.task, error);
  }

  private handleTaskError(task: Task, error: Error) {
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = new Date().toISOString();

    this.taskStore.updateTaskStatus(task.id, 'failed');
    this.runningTasks.delete(task.id);

    this.emit('task:failed', { task, error });
    this.logStore.error(`Task ${task.id} failed: ${error.message}`, 'TaskExecutor');

    // 대기 중인 Task 실행
    this.processQueue();
  }

  private handleTaskTimeout(task: Task) {
    const execution = this.runningTasks.get(task.id);
    if (!execution || execution.status !== 'running') return;

    this.handleTaskError(task, new Error('Task execution timeout'));
  }

  private processQueue() {
    if (this.taskQueue.length === 0) return;

    const maxConcurrent = this.options.maxConcurrent || 3;
    while (this.runningTasks.size < maxConcurrent && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      this.executeTask(task);
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const execution = this.runningTasks.get(taskId);
    if (!execution) {
      // 큐에서 제거
      this.taskQueue = this.taskQueue.filter((t) => t.id !== taskId);
      return;
    }

    // Claude 실행 취소
    await this.claudeBridge.cancelCurrentCommand();

    // Task 상태 업데이트
    const task = execution.task;
    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();

    this.taskStore.updateTaskStatus(taskId, 'cancelled');
    this.runningTasks.delete(taskId);

    this.emit('task:cancelled', task);
    this.logStore.info(`Task ${taskId} cancelled`, 'TaskExecutor');

    // 대기 중인 Task 실행
    this.processQueue();
  }

  getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values()).map((e) => e.task);
  }

  getQueuedTasks(): Task[] {
    return [...this.taskQueue];
  }

  getStats() {
    return {
      running: this.runningTasks.size,
      queued: this.taskQueue.length,
      maxConcurrent: this.options.maxConcurrent || 3,
    };
  }
}

interface TaskExecution {
  task: Task;
  startTime: number;
  status: 'running' | 'completed' | 'failed';
  requestId?: string;
}
