import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export interface Request {
  id: string;
  originalRequest: string;
  tasks: Task[];
  status: 'active' | 'completed';
}

export class TaskManagerClient {
  private client: Client | null = null;

  async initialize(client: Client): Promise<void> {
    this.client = client;
  }

  async createRequest(data: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): Promise<{ requestId: string }> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    const result = await this.client.callTool(
      'request_planning',
      data
    );

    return result as { requestId: string };
  }

  async getNextTask(requestId: string): Promise<Task | null> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    const result = await this.client.callTool(
      'get_next_task',
      { requestId }
    );

    return result as Task | null;
  }

  async markTaskDone(requestId: string, taskId: string, completedDetails?: string): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'mark_task_done',
      { requestId, taskId, completedDetails }
    );
  }

  async approveTaskCompletion(requestId: string, taskId: string): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'approve_task_completion',
      { requestId, taskId }
    );
  }

  async approveRequestCompletion(requestId: string): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'approve_request_completion',
      { requestId }
    );
  }

  async getTaskDetails(taskId: string): Promise<Task> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    const result = await this.client.callTool(
      'open_task_details',
      { taskId }
    );

    return result as Task;
  }

  async listRequests(): Promise<Request[]> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    const result = await this.client.callTool(
      'list_requests',
      {}
    );

    return result as Request[];
  }

  async addTasksToRequest(requestId: string, tasks: Array<{ title: string; description: string }>): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'add_tasks_to_request',
      { requestId, tasks }
    );
  }

  async updateTask(requestId: string, taskId: string, updates: { title?: string; description?: string }): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'update_task',
      { requestId, taskId, ...updates }
    );
  }

  async deleteTask(requestId: string, taskId: string): Promise<void> {
    if (!this.client) throw new Error('TaskManager client not initialized');

    await this.client.callTool(
      'delete_task',
      { requestId, taskId }
    );
  }
}