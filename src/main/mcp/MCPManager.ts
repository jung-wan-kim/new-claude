import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { TaskManagerClient } from './TaskManagerClient';
import { Context7Client } from './Context7Client';

export class MCPManager {
  public taskManager: TaskManagerClient;
  public context7: Context7Client;
  private clients: Map<string, Client> = new Map();

  constructor() {
    this.taskManager = new TaskManagerClient();
    this.context7 = new Context7Client();
  }

  async connect(): Promise<void> {
    console.log('Connecting to MCP servers...');
    
    try {
      // TaskManager MCP 서버 연결
      await this.connectTaskManager();
      
      // Context7 MCP 서버 연결
      await this.connectContext7();
      
      console.log('All MCP servers connected successfully');
    } catch (error) {
      console.error('Failed to connect MCP servers:', error);
      throw error;
    }
  }

  private async connectTaskManager(): Promise<void> {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [process.env.TASKMANAGER_MCP_PATH || 'taskmanager-mcp-server/server.js'],
    });

    const client = new Client({
      name: 'claude-code-controller',
      version: '0.1.0',
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    this.clients.set('taskmanager', client);
    await this.taskManager.initialize(client);
    
    console.log('TaskManager MCP connected');
  }

  private async connectContext7(): Promise<void> {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [process.env.CONTEXT7_MCP_PATH || 'context7-mcp-server/server.js'],
    });

    const client = new Client({
      name: 'claude-code-controller',
      version: '0.1.0',
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    this.clients.set('context7', client);
    await this.context7.initialize(client);
    
    console.log('Context7 MCP connected');
  }

  async disconnect(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`Disconnected from ${name}`);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
    this.clients.clear();
  }

  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  isConnected(serverName: string): boolean {
    const client = this.clients.get(serverName);
    return client ? client.isConnected : false;
  }

  getAllConnectionStatus(): Record<string, boolean> {
    return {
      taskmanager: this.isConnected('taskmanager'),
      context7: this.isConnected('context7'),
    };
  }
}