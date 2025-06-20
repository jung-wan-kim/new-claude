// Dynamic imports will be done in the initialize method
type Client = any;
type StdioClientTransport = any;

export interface ContextEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Context7ClientOptions {
  mode?: 'mock' | 'real';
  serverPath?: string;
  serverArgs?: string[];
}

export class Context7Client {
  private connected = false;
  private client?: Client;
  private transport?: StdioClientTransport;
  private mode: 'mock' | 'real';
  private serverPath: string;
  private serverArgs: string[];

  constructor(options: Context7ClientOptions = {}) {
    this.mode = options.mode || 'mock';
    this.serverPath = options.serverPath || 'npx';
    this.serverArgs = options.serverArgs || ['-y', '@modelcontextprotocol/server-context7'];
  }

  async initialize(): Promise<void> {
    if (this.mode === 'mock') {
      console.log('Context7 client initialized (mock mode)');
      this.connected = true;
      return;
    }

    try {
      console.log('Connecting to Context7 MCP server...');
      
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
      console.log('Context7 client connected successfully');
    } catch (error) {
      console.error('Failed to connect to Context7 server:', error);
      throw error;
    }
  }

  async search(
    query: string,
    filters?: {
      tags?: string[];
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ContextEntry[]> {
    if (!this.connected) {
      throw new Error('Context7 client not initialized');
    }

    if (this.mode === 'mock') {
      return [];
    }

    try {
      const result = await this.client!.callTool({
        name: 'context7_search',
        arguments: {
          query,
          filters: {
            tags: filters?.tags,
            type: filters?.type,
            date_from: filters?.dateFrom,
            date_to: filters?.dateTo
          }
        }
      });
      return (result as any).content[0] as ContextEntry[];
    } catch (error) {
      console.error('Failed to search context:', error);
      throw error;
    }
  }

  async create(data: {
    title: string;
    content: string;
    tags?: string[];
    type?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ContextEntry> {
    if (!this.connected) {
      throw new Error('Context7 client not initialized');
    }

    if (this.mode === 'mock') {
      return {
        id: `ctx-${Date.now()}`,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        type: data.type || 'note',
        metadata: data.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const result = await this.client!.callTool({
        name: 'context7_create',
        arguments: data
      });
      return (result as any).content[0] as ContextEntry;
    } catch (error) {
      console.error('Failed to create context:', error);
      throw error;
    }
  }

  async get(id: string): Promise<ContextEntry | null> {
    if (!this.connected) {
      throw new Error('Context7 client not initialized');
    }

    if (this.mode === 'mock') {
      return null;
    }

    try {
      const result = await this.client!.callTool({
        name: 'context7_get',
        arguments: { id }
      });
      return (result as any).content[0] as ContextEntry;
    } catch (error) {
      console.error('Failed to get context:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updates: {
      title?: string;
      content?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<ContextEntry> {
    if (!this.connected) {
      throw new Error('Context7 client not initialized');
    }

    if (this.mode === 'mock') {
      throw new Error('Not implemented in mock mode');
    }

    try {
      const result = await this.client!.callTool({
        name: 'context7_update',
        arguments: {
          id,
          updates
        }
      });
      return (result as any).content[0] as ContextEntry;
    } catch (error) {
      console.error('Failed to update context:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Context7 client not initialized');
    }

    if (this.mode === 'mock') {
      return;
    }

    try {
      await this.client!.callTool({
        name: 'context7_delete',
        arguments: { id }
      });
    } catch (error) {
      console.error('Failed to delete context:', error);
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
}
