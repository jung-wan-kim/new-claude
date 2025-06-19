# Claude Code Controller API Documentation

## Overview

Claude Code Controller provides a programmatic API for integrating with other tools and automating workflows.

## Installation

```bash
npm install claude-code-controller
```

## Quick Start

```typescript
import { ClaudeCodeController, Task } from 'claude-code-controller';

// Initialize controller
const controller = new ClaudeCodeController({
  configPath: './config.json',
  enableMCP: true
});

// Start the controller
await controller.start();

// Create a task
const task: Task = {
  title: 'Analyze codebase',
  description: 'Perform static analysis on the project',
  priority: 'high'
};

await controller.createTask(task);
```

## Core API

### ClaudeCodeController

The main controller class that manages the entire application.

#### Constructor

```typescript
constructor(options?: ControllerOptions)
```

**Parameters:**
- `options`: Optional configuration object
  - `configPath`: Path to configuration file
  - `enableMCP`: Enable MCP server connections (default: true)

#### Methods

##### start()
```typescript
async start(): Promise<void>
```
Initializes and starts the controller.

##### stop()
```typescript
async stop(): Promise<void>
```
Gracefully shuts down the controller.

##### createTask()
```typescript
async createTask(task: Partial<Task>): Promise<Task>
```
Creates a new task.

**Parameters:**
- `task`: Task object with at least `title` field

**Returns:** Created task with generated ID

##### executeTask()
```typescript
async executeTask(taskId: string): Promise<TaskResult>
```
Executes a specific task.

**Parameters:**
- `taskId`: ID of the task to execute

**Returns:** Task execution result

### TaskStore

Manages task storage and retrieval.

#### Methods

##### getTasks()
```typescript
getTasks(): Task[]
```
Returns all tasks.

##### getTask()
```typescript
getTask(id: string): Task | undefined
```
Gets a specific task by ID.

##### addTask()
```typescript
addTask(task: Task): void
```
Adds a new task.

##### updateTask()
```typescript
updateTask(id: string, updates: Partial<Task>): boolean
```
Updates an existing task.

##### removeTask()
```typescript
removeTask(id: string): boolean
```
Removes a task.

##### searchTasks()
```typescript
searchTasks(query: string): Task[]
```
Searches tasks by title or description.

### Events

The controller emits various events that can be listened to:

```typescript
controller.on('task:created', (task: Task) => {
  console.log('New task created:', task);
});

controller.on('task:started', (task: Task) => {
  console.log('Task started:', task);
});

controller.on('task:completed', (result: TaskResult) => {
  console.log('Task completed:', result);
});

controller.on('task:failed', (error: TaskError) => {
  console.error('Task failed:', error);
});
```

#### Available Events

- `ready`: Controller initialized and ready
- `task:created`: New task created
- `task:started`: Task execution started
- `task:completed`: Task completed successfully
- `task:failed`: Task execution failed
- `task:updated`: Task updated
- `task:removed`: Task removed
- `mcp:connected`: MCP server connected
- `mcp:disconnected`: MCP server disconnected
- `error`: General error occurred

## Types

### Task

```typescript
interface Task {
  id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
}
```

### TaskStatus

```typescript
type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'paused';
```

### TaskResult

```typescript
interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed';
  output?: string;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}
```

### Context

```typescript
interface Context {
  id: string;
  taskId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
```

## MCP Integration

### TaskManager Client

```typescript
import { TaskManagerClient } from 'claude-code-controller/mcp';

const taskManager = new TaskManagerClient();
await taskManager.initialize();

// Create a planning request
const result = await taskManager.requestPlanning({
  originalRequest: 'Build a REST API',
  tasks: [
    { title: 'Setup Express server', description: '...' },
    { title: 'Create routes', description: '...' }
  ]
});

// Get next task
const nextTask = await taskManager.getNextTask(result.requestId);
```

### Context7 Client

```typescript
import { Context7Client } from 'claude-code-controller/mcp';

const context7 = new Context7Client();
await context7.initialize();

// Save context
await context7.saveContext({
  id: 'ctx-123',
  content: 'Task execution result...',
  metadata: { taskId: 'task-456' }
});

// Search context
const results = await context7.searchContext({
  text: 'REST API',
  limit: 10
});
```

## Advanced Usage

### Custom Task Executor

```typescript
import { TaskExecutor } from 'claude-code-controller';

class CustomExecutor extends TaskExecutor {
  async execute(task: Task): Promise<TaskResult> {
    // Custom execution logic
    console.log(`Executing: ${task.title}`);
    
    // Simulate work
    await this.simulateWork(task);
    
    return {
      taskId: task.id!,
      status: 'completed',
      output: 'Custom execution completed',
      duration: 1000
    };
  }
  
  private async simulateWork(task: Task) {
    for (let i = 0; i < 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.updateProgress(task.id!, i);
    }
  }
}

// Register custom executor
controller.registerExecutor('custom', new CustomExecutor());
```

### Plugin Development

```typescript
import { Plugin, PluginContext } from 'claude-code-controller';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async initialize(context: PluginContext): Promise<void> {
    // Register commands
    context.registerCommand('my-command', this.handleCommand);
    
    // Listen to events
    context.on('task:completed', this.onTaskCompleted);
  }
  
  private handleCommand = async (args: string[]) => {
    console.log('Command executed with args:', args);
  };
  
  private onTaskCompleted = (result: TaskResult) => {
    console.log('Task completed:', result);
  };
  
  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}
```

### Batch Operations

```typescript
// Create multiple tasks
const tasks = [
  { title: 'Task 1', priority: 'high' },
  { title: 'Task 2', priority: 'medium' },
  { title: 'Task 3', priority: 'low' }
];

const createdTasks = await controller.createBatch(tasks);

// Execute tasks in parallel
const results = await controller.executeBatch(
  createdTasks.map(t => t.id!),
  { parallel: true, maxConcurrency: 2 }
);
```

## Error Handling

```typescript
try {
  await controller.executeTask('task-123');
} catch (error) {
  if (error instanceof TaskNotFoundError) {
    console.error('Task not found');
  } else if (error instanceof TaskExecutionError) {
    console.error('Execution failed:', error.message);
  } else if (error instanceof MCPConnectionError) {
    console.error('MCP connection failed:', error.message);
  }
}
```

### Error Types

- `TaskNotFoundError`: Task with given ID not found
- `TaskExecutionError`: Task execution failed
- `MCPConnectionError`: MCP server connection failed
- `ValidationError`: Input validation failed
- `ConfigurationError`: Configuration error

## Best Practices

### 1. Resource Management

Always properly cleanup resources:

```typescript
const controller = new ClaudeCodeController();

try {
  await controller.start();
  // Use controller
} finally {
  await controller.stop();
}
```

### 2. Event Handling

Remove event listeners when done:

```typescript
const handler = (task: Task) => console.log(task);
controller.on('task:created', handler);

// Later...
controller.off('task:created', handler);
```

### 3. Error Recovery

Implement retry logic for transient failures:

```typescript
async function executeWithRetry(
  taskId: string, 
  maxRetries: number = 3
): Promise<TaskResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await controller.executeTask(taskId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Rate Limiting

The API implements rate limiting for MCP server calls:

- Default: 100 requests per minute
- Burst: 10 requests
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Versioning

The API follows semantic versioning:

- Major version: Breaking changes
- Minor version: New features (backward compatible)
- Patch version: Bug fixes

Current version: 0.1.0