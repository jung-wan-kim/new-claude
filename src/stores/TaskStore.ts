import { EventEmitter } from 'events';
import { Task } from '../shared/types';
import { generateId } from '../shared/utils';

export class TaskStore extends EventEmitter {
  private tasks: Task[] = [];
  private activeTaskId: string | null = null;

  getTasks(): Task[] {
    return this.tasks;
  }

  getActiveTask(): Task | null {
    if (!this.activeTaskId) return null;
    return this.tasks.find(t => t.id === this.activeTaskId) || null;
  }

  setActiveTask(taskId: string) {
    this.activeTaskId = taskId;
    this.emit('active-changed', taskId);
  }

  createTask(data: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }): Task {
    const task: Task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: data.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    this.emit('task-created', task);
    return task;
  }

  updateTaskStatus(taskId: string, status: Task['status']) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        task.completedAt = new Date().toISOString();
      }
      if (status === 'in_progress' && !task.startedAt) {
        task.startedAt = new Date().toISOString();
      }
      this.emit('task-updated', task);
      this.emit('task:updated', task);
    }
  }

  deleteTask(taskId: string) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks[index];
      this.tasks.splice(index, 1);
      if (this.activeTaskId === taskId) {
        this.activeTaskId = null;
      }
      this.emit('task-deleted', task);
    }
  }

  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const inProgress = this.tasks.filter(t => t.status === 'in_progress').length;
    const pending = this.tasks.filter(t => t.status === 'pending').length;

    return { total, completed, inProgress, pending };
  }

  // Alias methods for UIManager compatibility
  addTask(data: Omit<Task, 'id'>) {
    const task: Task = {
      ...data,
      id: generateId(),
    };
    this.tasks.push(task);
    this.emit('task:added', task);
    return task;
  }

  removeTask(taskId: string) {
    this.deleteTask(taskId);
    this.emit('task:removed', taskId);
  }
}