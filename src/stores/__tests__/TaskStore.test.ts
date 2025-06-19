import { TaskStore } from '../TaskStore';
import { Task } from '../../shared/types';

describe('TaskStore', () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    taskStore = new TaskStore();
  });

  describe('Task Management', () => {
    it('should add a new task', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date()
      };

      taskStore.addTask(task);
      const tasks = taskStore.getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(task);
    });

    it('should update task status', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending'
      };

      taskStore.addTask(task);
      taskStore.updateTask('task-1', { status: 'in_progress' });

      const updatedTask = taskStore.getTask('task-1');
      expect(updatedTask?.status).toBe('in_progress');
    });

    it('should remove a task', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending'
      };

      taskStore.addTask(task);
      expect(taskStore.getTasks()).toHaveLength(1);

      taskStore.removeTask('task-1');
      expect(taskStore.getTasks()).toHaveLength(0);
    });

    it('should not update non-existent task', () => {
      const result = taskStore.updateTask('non-existent', { status: 'completed' });
      expect(result).toBe(false);
    });

    it('should emit events on task changes', () => {
      const addSpy = jest.fn();
      const updateSpy = jest.fn();
      const removeSpy = jest.fn();

      taskStore.on('task:added', addSpy);
      taskStore.on('task:updated', updateSpy);
      taskStore.on('task:removed', removeSpy);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending'
      };

      taskStore.addTask(task);
      expect(addSpy).toHaveBeenCalledWith(task);

      taskStore.updateTask('task-1', { status: 'completed' });
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'task-1', status: 'completed' })
      );

      taskStore.removeTask('task-1');
      expect(removeSpy).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      const tasks: Task[] = [
        { id: '1', title: 'Pending Task', status: 'pending', priority: 'high' },
        { id: '2', title: 'In Progress Task', status: 'in_progress', priority: 'medium' },
        { id: '3', title: 'Completed Task', status: 'completed', priority: 'low' },
        { id: '4', title: 'Failed Task', status: 'failed', priority: 'high' }
      ];

      tasks.forEach(task => taskStore.addTask(task));
    });

    it('should filter tasks by status', () => {
      const pendingTasks = taskStore.getTasksByStatus('pending');
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].title).toBe('Pending Task');

      const completedTasks = taskStore.getTasksByStatus('completed');
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Completed Task');
    });

    it('should get active tasks', () => {
      const activeTasks = taskStore.getActiveTasks();
      expect(activeTasks).toHaveLength(2);
      
      const statuses = activeTasks.map(t => t.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('in_progress');
      expect(statuses).not.toContain('completed');
      expect(statuses).not.toContain('failed');
    });

    it('should filter tasks by priority', () => {
      const highPriorityTasks = taskStore.getTasksByPriority('high');
      expect(highPriorityTasks).toHaveLength(2);
      expect(highPriorityTasks.every(t => t.priority === 'high')).toBe(true);
    });
  });

  describe('Task Search', () => {
    beforeEach(() => {
      const tasks: Task[] = [
        { id: '1', title: 'Setup project', description: 'Initialize Git repository' },
        { id: '2', title: 'Configure Git', description: 'Setup remote origin' },
        { id: '3', title: 'Install dependencies', description: 'Run npm install' },
        { id: '4', title: 'Create README', description: 'Add project documentation' }
      ];

      tasks.forEach(task => taskStore.addTask(task));
    });

    it('should search tasks by title', () => {
      const results = taskStore.searchTasks('Git');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Configure Git');
    });

    it('should search tasks by description', () => {
      const results = taskStore.searchTasks('npm');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Install dependencies');
    });

    it('should search case-insensitively', () => {
      const results = taskStore.searchTasks('git');
      expect(results).toHaveLength(2);
      
      const titles = results.map(t => t.title);
      expect(titles).toContain('Setup project');
      expect(titles).toContain('Configure Git');
    });

    it('should return empty array for no matches', () => {
      const results = taskStore.searchTasks('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('Task Statistics', () => {
    beforeEach(() => {
      const tasks: Task[] = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'in_progress' },
        { id: '4', status: 'completed' },
        { id: '5', status: 'completed' },
        { id: '6', status: 'failed' }
      ];

      tasks.forEach(task => taskStore.addTask(task));
    });

    it('should calculate task statistics', () => {
      const stats = taskStore.getStatistics();
      
      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.completionRate).toBeCloseTo(33.33, 2);
    });
  });
});