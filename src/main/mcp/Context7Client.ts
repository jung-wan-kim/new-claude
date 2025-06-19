import { Client } from '@modelcontextprotocol/sdk/client/index.js';

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
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  type?: string;
}

export class Context7Client {
  private client: Client | null = null;

  async initialize(client: Client): Promise<void> {
    this.client = client;
  }

  async search(query: string, filters?: SearchFilters): Promise<ContextEntry[]> {
    if (!this.client) throw new Error('Context7 client not initialized');

    const result = await this.client.callTool(
      'context7_search',
      { query, filters }
    );

    return result as ContextEntry[];
  }

  async create(data: {
    title: string;
    content: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<{ id: string }> {
    if (!this.client) throw new Error('Context7 client not initialized');

    const result = await this.client.callTool(
      'context7_create',
      data
    );

    return result as { id: string };
  }

  async update(id: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.client) throw new Error('Context7 client not initialized');

    await this.client.callTool(
      'context7_update',
      { id, updates }
    );
  }

  async get(id: string): Promise<ContextEntry> {
    if (!this.client) throw new Error('Context7 client not initialized');

    const result = await this.client.callTool(
      'context7_get',
      { id }
    );

    return result as ContextEntry;
  }

  async delete(id: string): Promise<void> {
    if (!this.client) throw new Error('Context7 client not initialized');

    await this.client.callTool(
      'context7_delete',
      { id }
    );
  }

  async link(sourceId: string, targetId: string, relationship?: string): Promise<void> {
    if (!this.client) throw new Error('Context7 client not initialized');

    await this.client.callTool(
      'context7_link',
      { source_id: sourceId, target_id: targetId, relationship }
    );
  }

  // 프로젝트별 컨텍스트 저장
  async saveProjectContext(projectName: string, context: any): Promise<{ id: string }> {
    return await this.create({
      title: `Project: ${projectName}`,
      content: JSON.stringify(context, null, 2),
      type: 'project_context',
      tags: ['project', projectName],
      metadata: {
        projectName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 작업 결과 저장
  async saveTaskResult(taskId: string, result: any): Promise<{ id: string }> {
    return await this.create({
      title: `Task Result: ${taskId}`,
      content: JSON.stringify(result, null, 2),
      type: 'task_result',
      tags: ['task', 'result', taskId],
      metadata: {
        taskId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Claude Code 명령어 히스토리 저장
  async saveCommandHistory(command: string, output: string): Promise<{ id: string }> {
    return await this.create({
      title: `Command: ${command.substring(0, 50)}...`,
      content: JSON.stringify({ command, output }, null, 2),
      type: 'command_history',
      tags: ['command', 'history'],
      metadata: {
        command,
        timestamp: new Date().toISOString(),
      },
    });
  }
}