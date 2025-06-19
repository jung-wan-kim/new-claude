import { EventEmitter } from 'events';
import { ContextEntry } from '../shared/types';
import { generateId } from '../shared/utils';

export class ContextStore extends EventEmitter {
  private contexts: ContextEntry[] = [];
  private activeContextId: string | null = null;
  private searchQuery: string = '';

  getContexts(): ContextEntry[] {
    return this.contexts;
  }

  getActiveContext(): ContextEntry | null {
    if (!this.activeContextId) return null;
    return this.contexts.find(c => c.id === this.activeContextId) || null;
  }

  setActiveContext(contextId: string) {
    this.activeContextId = contextId;
    this.emit('active-changed', contextId);
  }

  createContext(data: {
    title: string;
    content: string;
    type?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): ContextEntry {
    const context: ContextEntry = {
      id: generateId(),
      title: data.title,
      content: data.content,
      type: data.type,
      tags: data.tags,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.contexts.push(context);
    this.emit('context-created', context);
    return context;
  }

  updateContext(contextId: string, updates: Partial<ContextEntry>) {
    const context = this.contexts.find(c => c.id === contextId);
    if (context) {
      Object.assign(context, updates, {
        updatedAt: new Date().toISOString(),
      });
      this.emit('context-updated', context);
    }
  }

  deleteContext(contextId: string) {
    const index = this.contexts.findIndex(c => c.id === contextId);
    if (index !== -1) {
      const context = this.contexts[index];
      this.contexts.splice(index, 1);
      if (this.activeContextId === contextId) {
        this.activeContextId = null;
      }
      this.emit('context-deleted', context);
    }
  }

  async searchContexts(query: string) {
    this.searchQuery = query;
    // 간단한 로컬 검색
    const filtered = this.contexts.filter(ctx => 
      ctx.title.toLowerCase().includes(query.toLowerCase()) ||
      ctx.content.toLowerCase().includes(query.toLowerCase()) ||
      ctx.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    this.emit('search-completed', filtered);
    return filtered;
  }

  getSearchQuery(): string {
    return this.searchQuery;
  }
}