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

  async initialize(): Promise<void> {
    // 실제 MCP 서버 연결은 나중에 구현
    console.log('TaskManager client initialized (mock mode)');
    this.connected = true;
  }

  async createRequest(_data: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): Promise<{ requestId: string }> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return { requestId: `req-${Date.now()}` };
  }

  async getNextTask(_requestId: string): Promise<Task | null> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return null;
  }

  async markTaskDone(_taskId: string, _completedDetails?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
  }

  async listRequests(): Promise<Request[]> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    // 모의 구현
    return [];
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  // MCP 도구 이름과 매칭되는 메소드들
  async request_planning(params: any): Promise<any> {
    return this.createRequest(params);
  }

  async get_next_task(params: { requestId: string }): Promise<any> {
    const task = await this.getNextTask(params.requestId);
    return task ? { status: 'next_task', task } : { status: 'all_tasks_done' };
  }

  async mark_task_done(params: any): Promise<any> {
    await this.markTaskDone(params.taskId, params.completedDetails);
    return { status: 'task_marked_done' };
  }

  async approve_task_completion(_params: any): Promise<any> {
    // 모의 구현
    return { status: 'task_approved' };
  }

  async list_requests(): Promise<any> {
    return this.listRequests();
  }
}
