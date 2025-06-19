// Context7 MCP 클라이언트
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ContextEntry {
  id: string;
  title: string;
  content: string;
  type?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  date_from?: string;
  date_to?: string;
  tags?: string[];
  type?: string;
}

export class Context7Client {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async initialize(): Promise<void> {
    try {
      // Context7 MCP 서버 실행
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@context7/mcp-server'],
        env: {
          ...process.env,
          CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || '',
        },
      });
      
      this.client = new Client({
        name: 'claude-code-controller',
        version: '0.1.0',
      }, {
        capabilities: {}
      });
      
      await this.client.connect(this.transport);
      console.log('Context7 MCP client connected');
      
      // 사용 가능한 도구 확인
      const tools = this.client.getServerCapabilities()?.tools;
      console.log('Available Context7 tools:', tools);
    } catch (error) {
      console.error('Failed to connect to Context7 MCP server:', error);
      throw error;
    }
  }

  async search(query: string, filters?: SearchFilters): Promise<ContextEntry[]> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      const result = await this.client.callTool('context7_search', {
        query,
        filters,
      });

      return result.results as ContextEntry[];
    } catch (error) {
      console.error('Failed to search contexts:', error);
      throw error;
    }
  }

  async createContext(data: {
    title: string;
    content: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<ContextEntry> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      const result = await this.client.callTool('context7_create', data);
      return result.context as ContextEntry;
    } catch (error) {
      console.error('Failed to create context:', error);
      throw error;
    }
  }

  async updateContext(id: string, updates: Partial<ContextEntry>): Promise<ContextEntry> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      const result = await this.client.callTool('context7_update', {
        id,
        updates,
      });
      return result.context as ContextEntry;
    } catch (error) {
      console.error('Failed to update context:', error);
      throw error;
    }
  }

  async getContext(id: string): Promise<ContextEntry> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      const result = await this.client.callTool('context7_get', { id });
      return result.context as ContextEntry;
    } catch (error) {
      console.error('Failed to get context:', error);
      throw error;
    }
  }

  async deleteContext(id: string): Promise<void> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      await this.client.callTool('context7_delete', { id });
    } catch (error) {
      console.error('Failed to delete context:', error);
      throw error;
    }
  }

  async linkContexts(sourceId: string, targetId: string, relationship: string): Promise<void> {
    if (!this.client) {
      throw new Error('Context7 client not initialized');
    }

    try {
      await this.client.callTool('context7_link', {
        source_id: sourceId,
        target_id: targetId,
        relationship,
      });
    } catch (error) {
      console.error('Failed to link contexts:', error);
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