// TaskManager MCP 클라이언트 (모의 구현)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Request {
  id: string;
  originalRequest: string;
  tasks: Task[];
  status: 'active' | 'completed';
}

export class TaskManagerClient {
  private connected = false;

  initialize(): void {
    // 실제 MCP 서버 연결은 나중에 구현
    console.log('TaskManager client initialized (mock mode)');
    this.connected = true;
  }

  createRequest(_data: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): { requestId: string } {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return { requestId: `req-${Date.now()}` };
  }

  getNextTask(_requestId: string): Task | null {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return null;
  }

  markTaskDone(_taskId: string, _completedDetails?: string): void {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
  }

  listRequests(): Request[] {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return [];
  }

  disconnect(): void {
    this.connected = false;
  }

  // MCP 도구 이름과 매칭되는 메소드들
  request_planning(params: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): { requestId: string } {
    return this.createRequest(params);
  }

  get_next_task(params: { requestId: string }): { status: string; task?: Task } {
    const task = this.getNextTask(params.requestId);
    return task ? { status: 'next_task', task } : { status: 'all_tasks_done' };
  }

  mark_task_done(params: { taskId: string; completedDetails?: string }): { status: string } {
    this.markTaskDone(params.taskId, params.completedDetails);
    return { status: 'task_marked_done' };
  }

  approve_task_completion(_params: { requestId: string; taskId: string }): { status: string } {
    // 모의 구현
    return { status: 'task_approved' };
  }

  list_requests(): Request[] {
    return this.listRequests();
  }
}
