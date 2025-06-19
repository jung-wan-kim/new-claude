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

  async createRequest(data: {
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

  async getNextTask(requestId: string): Promise<Task | null> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }
    
    // 모의 구현
    return null;
  }

  async markTaskDone(taskId: string, completedDetails?: string): Promise<void> {
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
}