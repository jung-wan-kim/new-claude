// TaskManager MCP 클라이언트
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

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
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async initialize(): Promise<void> {
    try {
      // TaskManager MCP 서버 실행
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@mcphq/mcp-server-task-manager'],
        env: {
          ...process.env,
        },
      });
      
      this.client = new Client({
        name: 'claude-code-controller',
        version: '0.1.0',
      }, {
        capabilities: {}
      });
      
      await this.client.connect(this.transport);
      console.log('TaskManager MCP client connected');
      
      // 사용 가능한 도구 확인
      const tools = this.client.getServerCapabilities()?.tools;
      console.log('Available TaskManager tools:', tools);
    } catch (error) {
      console.error('Failed to connect to TaskManager MCP server:', error);
      throw error;
    }
  }

  async createRequest(data: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): Promise<{ requestId: string }> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      const result = await this.client.callTool('request_planning', {
        originalRequest: data.originalRequest,
        tasks: data.tasks,
        splitDetails: data.splitDetails,
      });

      return { requestId: result.requestId as string };
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  }

  async getNextTask(requestId: string): Promise<Task | null> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      const result = await this.client.callTool('get_next_task', {
        requestId,
      });

      if (result.task) {
        return result.task as Task;
      }
      return null;
    } catch (error) {
      console.error('Failed to get next task:', error);
      throw error;
    }
  }

  async markTaskDone(taskId: string, completedDetails?: string): Promise<void> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      await this.client.callTool('mark_task_done', {
        taskId,
        completedDetails,
      });
    } catch (error) {
      console.error('Failed to mark task as done:', error);
      throw error;
    }
  }

  async approveTaskCompletion(requestId: string, taskId: string): Promise<void> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      await this.client.callTool('approve_task_completion', {
        requestId,
        taskId,
      });
    } catch (error) {
      console.error('Failed to approve task completion:', error);
      throw error;
    }
  }

  async approveRequestCompletion(requestId: string): Promise<void> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      await this.client.callTool('approve_request_completion', {
        requestId,
      });
    } catch (error) {
      console.error('Failed to approve request completion:', error);
      throw error;
    }
  }

  async listRequests(): Promise<Request[]> {
    if (!this.client) {
      throw new Error('TaskManager client not initialized');
    }

    try {
      const result = await this.client.callTool('list_requests', {});
      return result.requests as Request[];
    } catch (error) {
      console.error('Failed to list requests:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }
}