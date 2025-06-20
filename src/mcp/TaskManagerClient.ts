// Dynamic imports will be done in the initialize method
type Client = any;
type StdioClientTransport = any;

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

export interface TaskManagerClientOptions {
  mode?: 'mock' | 'real';
  serverPath?: string;
  serverArgs?: string[];
}

export class TaskManagerClient {
  private connected = false;
  private client?: Client;
  private transport?: StdioClientTransport;
  private mode: 'mock' | 'real';
  private serverPath: string;
  private serverArgs: string[];

  constructor(options: TaskManagerClientOptions = {}) {
    this.mode = options.mode || 'mock';
    this.serverPath = options.serverPath || 'npx';
    this.serverArgs = options.serverArgs || [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@kazuph/mcp-taskmanager',
      '--key',
      '3e7735c8-b9d5-45ec-a2da-4d5ca70dfc17',
    ];
  }

  async initialize(): Promise<void> {
    if (this.mode === 'mock') {
      console.log('TaskManager client initialized (mock mode)');
      this.connected = true;
      return;
    }

    try {
      console.log('Connecting to TaskManager MCP server...');
      
      // Dynamic import of MCP SDK
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
      
      // Create transport
      this.transport = new StdioClientTransport({
        command: this.serverPath,
        args: this.serverArgs
      });

      // Create client
      this.client = new Client(
        { name: 'claude-code-controller', version: '0.1.0' },
        { capabilities: {} }
      );

      // Connect
      await this.client.connect(this.transport);
      
      this.connected = true;
      console.log('TaskManager client connected successfully');
    } catch (error) {
      console.error('Failed to connect to TaskManager server:', error);
      throw error;
    }
  }

  async createRequest(data: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): Promise<{ requestId: string }> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    if (this.mode === 'mock') {
      return { requestId: `req-${Date.now()}` };
    }

    try {
      const result = await this.client!.callTool({
        name: 'request_planning',
        arguments: data
      });
      return (result as any).content[0] as { requestId: string };
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  }

  async getNextTask(requestId: string): Promise<Task | null> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    if (this.mode === 'mock') {
      return null;
    }

    try {
      const result = await this.client!.callTool({
        name: 'get_next_task',
        arguments: { requestId }
      });
      const response = (result as any).content[0] as { status: string; task?: Task };
      return response.task || null;
    } catch (error) {
      console.error('Failed to get next task:', error);
      throw error;
    }
  }

  async markTaskDone(taskId: string, completedDetails?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    if (this.mode === 'mock') {
      return;
    }

    try {
      await this.client!.callTool({
        name: 'mark_task_done',
        arguments: { 
          taskId, 
          completedDetails 
        }
      });
    } catch (error) {
      console.error('Failed to mark task done:', error);
      throw error;
    }
  }

  async listRequests(): Promise<Request[]> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    if (this.mode === 'mock') {
      return [];
    }

    try {
      const result = await this.client!.callTool({
        name: 'list_requests',
        arguments: {}
      });
      return (result as any).content[0] as Request[];
    } catch (error) {
      console.error('Failed to list requests:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    
    if (this.mode === 'real' && this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error closing client connection:', error);
      }
    }
    
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.error('Error closing transport:', error);
      }
    }
  }

  // MCP 도구 이름과 매칭되는 메소드들
  async request_planning(params: {
    originalRequest: string;
    tasks: Array<{ title: string; description: string }>;
    splitDetails?: string;
  }): Promise<{ requestId: string }> {
    return this.createRequest(params);
  }

  async get_next_task(params: { requestId: string }): Promise<{ status: string; task?: Task }> {
    const task = await this.getNextTask(params.requestId);
    return task ? { status: 'next_task', task } : { status: 'all_tasks_done' };
  }

  async mark_task_done(params: { taskId: string; completedDetails?: string }): Promise<{ status: string }> {
    await this.markTaskDone(params.taskId, params.completedDetails);
    return { status: 'task_marked_done' };
  }

  async approve_task_completion(params: { requestId: string; taskId: string }): Promise<{ status: string }> {
    if (!this.connected) {
      throw new Error('TaskManager client not initialized');
    }

    if (this.mode === 'mock') {
      return { status: 'task_approved' };
    }

    try {
      const result = await this.client!.callTool({
        name: 'approve_task_completion',
        arguments: params
      });
      return (result as any).content[0] as { status: string };
    } catch (error) {
      console.error('Failed to approve task completion:', error);
      throw error;
    }
  }

  async list_requests(): Promise<Request[]> {
    return this.listRequests();
  }
}
