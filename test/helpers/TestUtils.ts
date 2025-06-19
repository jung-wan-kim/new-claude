import { Task, Context } from '../../src/shared/types';

export class TestUtils {
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  static createMockTask(overrides?: Partial<Task>): Task {
    return {
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Mock Task',
      description: 'Mock Description',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMockContext(overrides?: Partial<Context>): Context {
    return {
      id: `context-${Math.random().toString(36).substr(2, 9)}`,
      taskId: 'task-1',
      content: 'Mock Context Content',
      metadata: {},
      createdAt: new Date(),
      ...overrides
    };
  }

  static createMultipleTasks(count: number, overrides?: Partial<Task>): Task[] {
    return Array.from({ length: count }, (_, i) => 
      this.createMockTask({
        id: `task-${i}`,
        title: `Task ${i}`,
        ...overrides
      })
    );
  }

  static async measurePerformance<T>(
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static mockDateNow(timestamp: number) {
    const originalNow = Date.now;
    Date.now = jest.fn(() => timestamp);
    return () => {
      Date.now = originalNow;
    };
  }
}