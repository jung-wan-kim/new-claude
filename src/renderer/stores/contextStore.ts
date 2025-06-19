import { create } from 'zustand';
import { ContextEntry } from '../../shared/types';

interface ContextStore {
  contexts: ContextEntry[];
  activeContextId: string | null;
  searchQuery: string;
  
  initialize: () => Promise<void>;
  searchContexts: (query: string) => Promise<void>;
  createContext: (entry: Omit<ContextEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContext: (id: string, updates: Partial<ContextEntry>) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  setActiveContext: (id: string | null) => void;
}

export const useContextStore = create<ContextStore>((set, get) => ({
  contexts: [],
  activeContextId: null,
  searchQuery: '',
  
  initialize: async () => {
    // Context7 MCP와 동기화
    if (window.electronAPI) {
      try {
        const contexts = await window.electronAPI.getContexts();
        set({ contexts });
      } catch (error) {
        console.error('Failed to initialize context store:', error);
      }
    }
  },
  
  searchContexts: async (query) => {
    set({ searchQuery: query });
    
    if (window.electronAPI) {
      try {
        const results = await window.electronAPI.searchContexts(query);
        set({ contexts: results });
      } catch (error) {
        console.error('Failed to search contexts:', error);
      }
    }
  },
  
  createContext: async (entry) => {
    if (window.electronAPI) {
      try {
        const newContext = await window.electronAPI.createContext(entry);
        set((state) => ({
          contexts: [...state.contexts, newContext],
        }));
      } catch (error) {
        console.error('Failed to create context:', error);
      }
    }
  },
  
  updateContext: async (id, updates) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.updateContext(id, updates);
        set((state) => ({
          contexts: state.contexts.map(ctx =>
            ctx.id === id ? { ...ctx, ...updates } : ctx
          ),
        }));
      } catch (error) {
        console.error('Failed to update context:', error);
      }
    }
  },
  
  deleteContext: async (id) => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.deleteContext(id);
        set((state) => ({
          contexts: state.contexts.filter(ctx => ctx.id !== id),
          activeContextId: state.activeContextId === id ? null : state.activeContextId,
        }));
      } catch (error) {
        console.error('Failed to delete context:', error);
      }
    }
  },
  
  setActiveContext: (id) => {
    set({ activeContextId: id });
  },
}));