import { create } from 'zustand';
import { Request, Task } from '../../shared/types';
import { generateId } from '../../shared/utils';

interface TaskStore {
  requests: Request[];
  activeRequestId: string | null;
  
  initialize: () => Promise<void>;
  createRequest: (originalRequest: string, tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<Request>;
  setActiveRequest: (requestId: string) => void;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  getNextTask: () => Task | null;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  requests: [],
  activeRequestId: null,
  
  initialize: async () => {
    // IPC를 통해 TaskManager MCP와 동기화
    if (window.electronAPI) {
      try {
        const requests = await window.electronAPI.getRequests();
        set({ requests });
      } catch (error) {
        console.error('Failed to initialize task store:', error);
      }
    }
  },
  
  createRequest: async (originalRequest, tasks) => {
    const request: Request = {
      id: generateId(),
      originalRequest,
      tasks: tasks.map(t => ({
        ...t,
        id: generateId(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    if (window.electronAPI) {
      try {
        await window.electronAPI.createRequest(request);
      } catch (error) {
        console.error('Failed to create request:', error);
      }
    }
    
    set((state) => ({
      requests: [...state.requests, request],
      activeRequestId: request.id,
    }));
    
    return request;
  },
  
  setActiveRequest: (requestId) => {
    set({ activeRequestId: requestId });
  },
  
  startTask: async (taskId) => {
    const { requests } = get();
    
    set((state) => ({
      requests: state.requests.map(req => ({
        ...req,
        tasks: req.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'in_progress' as const, updatedAt: new Date().toISOString() }
            : task
        ),
      })),
    }));
    
    if (window.electronAPI) {
      try {
        await window.electronAPI.updateTaskStatus(taskId, 'in_progress');
      } catch (error) {
        console.error('Failed to start task:', error);
      }
    }
  },
  
  completeTask: async (taskId) => {
    set((state) => ({
      requests: state.requests.map(req => ({
        ...req,
        tasks: req.tasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                status: 'completed' as const, 
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : task
        ),
      })),
    }));
    
    if (window.electronAPI) {
      try {
        await window.electronAPI.updateTaskStatus(taskId, 'completed');
      } catch (error) {
        console.error('Failed to complete task:', error);
      }
    }
  },
  
  updateTask: (taskId, updates) => {
    set((state) => ({
      requests: state.requests.map(req => ({
        ...req,
        tasks: req.tasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        ),
      })),
    }));
  },
  
  getNextTask: () => {
    const { requests, activeRequestId } = get();
    const activeRequest = requests.find(r => r.id === activeRequestId);
    
    if (!activeRequest) return null;
    
    return activeRequest.tasks.find(t => t.status === 'pending') || null;
  },
}));