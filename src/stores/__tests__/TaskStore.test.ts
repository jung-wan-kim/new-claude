import { TaskStore } from '../TaskStore';

describe('TaskStore', () => {
  let taskStore: TaskStore;

  beforeEach(() => {
    taskStore = new TaskStore();
  });

  describe('Task Management', () => {
    it('should add a new task', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
        priority: 'medium' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const task = taskStore.addTask(taskData);

      expect(task).toMatchObject(taskData);
      expect(task.id).toBeDefined();
      expect(taskStore.getTasks()).toHaveLength(1);
    });

    it('should update task status', () => {
      const task = taskStore.addTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.updateTaskStatus(task.id, 'in_progress');

      const updatedTask = taskStore.getTasks()[0];
      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.startedAt).toBeDefined();
    });

    it('should complete a task', () => {
      const task = taskStore.addTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.updateTaskStatus(task.id, 'completed');

      const completedTask = taskStore.getTasks()[0];
      expect(completedTask.status).toBe('completed');
      expect(completedTask.completedAt).toBeDefined();
    });

    it('should delete a task', () => {
      const task = taskStore.addTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.deleteTask(task.id);

      expect(taskStore.getTasks()).toHaveLength(0);
    });

    it('should get active task', () => {
      const task = taskStore.addTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.setActiveTask(task.id);

      const activeTask = taskStore.getActiveTask();
      expect(activeTask).toBeDefined();
      expect(activeTask?.id).toBe(task.id);
    });
  });

  describe('Task Statistics', () => {
    beforeEach(() => {
      // Add various tasks
      taskStore.addTask({
        title: 'Pending Task',
        description: 'Test',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.addTask({
        title: 'In Progress Task',
        description: 'Test',
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      taskStore.addTask({
        title: 'Completed Task',
        description: 'Test',
        status: 'completed',
        priority: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('should calculate statistics correctly', () => {
      const stats = taskStore.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
    });
  });

  describe('Event Emissions', () => {
    it('should emit events on task operations', () => {
      const addedListener = jest.fn();
      const updatedListener = jest.fn();
      const deletedListener = jest.fn();

      taskStore.on('task:added', addedListener);
      taskStore.on('task:updated', updatedListener);
      taskStore.on('task:removed', deletedListener);

      // Add task
      const task = taskStore.addTask({
        title: 'Test Task',
        description: 'Test',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(addedListener).toHaveBeenCalledWith(task);

      // Update task
      taskStore.updateTaskStatus(task.id, 'in_progress');
      expect(updatedListener).toHaveBeenCalled();

      // Delete task
      taskStore.removeTask(task.id);
      expect(deletedListener).toHaveBeenCalledWith(task.id);
    });
  });
});
