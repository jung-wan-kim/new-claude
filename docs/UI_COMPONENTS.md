# Claude Code Controller (CCC) 터미널 UI 컴포넌트 시스템

## 1. 컴포넌트 계층 구조

### 1.1 전체 컴포넌트 트리

```
App (루트 컴포넌트)
├── Layout (레이아웃 매니저)
│   ├── StatusBar (상태 표시줄)
│   ├── MainView (메인 뷰 컨테이너)
│   │   ├── TaskList (작업 목록)
│   │   │   ├── TaskGroup (작업 그룹)
│   │   │   └── TaskItem (개별 작업)
│   │   ├── WorkArea (작업 영역)
│   │   │   ├── TaskExecutor (작업 실행기)
│   │   │   └── OutputDisplay (출력 표시)
│   │   ├── ContextViewer (컨텍스트 뷰어)
│   │   │   ├── ContextTree (컨텍스트 트리)
│   │   │   └── ContextDetail (컨텍스트 상세)
│   │   └── LogStream (로그 스트림)
│   │       ├── LogFilter (로그 필터)
│   │       └── LogEntry (로그 항목)
│   └── CommandBar (명령 표시줄)
├── CommandPalette (명령 팔레트 - 오버레이)
├── Modal (모달 다이얼로그 - 오버레이)
└── Notification (알림 - 오버레이)
```

### 1.2 컴포넌트 분류

```typescript
// src/ui/components/types.ts
export enum ComponentType {
  // 레이아웃 컴포넌트
  LAYOUT = 'layout',
  CONTAINER = 'container',
  
  // 데이터 표시 컴포넌트
  LIST = 'list',
  TREE = 'tree',
  TABLE = 'table',
  
  // 입력 컴포넌트
  INPUT = 'input',
  SELECT = 'select',
  BUTTON = 'button',
  
  // 피드백 컴포넌트
  PROGRESS = 'progress',
  SPINNER = 'spinner',
  NOTIFICATION = 'notification',
  
  // 오버레이 컴포넌트
  MODAL = 'modal',
  DROPDOWN = 'dropdown',
  TOOLTIP = 'tooltip'
}
```

## 2. 핵심 컴포넌트 상세 설계

### 2.1 TaskList 컴포넌트

```typescript
// src/ui/components/TaskList/TaskList.tsx
import React, { useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTaskStore } from '@/stores/taskStore';
import { TaskItem } from './TaskItem';
import { TaskGroup } from './TaskGroup';
import { ScrollableList } from '../common/ScrollableList';

interface TaskListProps {
  width: number;
  height: number;
  isFocused?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  width, 
  height, 
  isFocused = false 
}) => {
  const {
    tasks,
    activeTaskId,
    filter,
    setActiveTask,
    updateTaskStatus
  } = useTaskStore();
  
  // 작업 그룹화
  const groupedTasks = useMemo(() => {
    const groups = {
      running: [] as Task[],
      pending: [] as Task[],
      completed: [] as Task[],
      failed: [] as Task[]
    };
    
    Object.values(tasks).forEach(task => {
      groups[task.status]?.push(task);
    });
    
    return groups;
  }, [tasks]);
  
  // 키보드 네비게이션
  useInput((input, key) => {
    if (!isFocused) return;
    
    if (key.upArrow || input === 'k') {
      navigateTasks(-1);
    } else if (key.downArrow || input === 'j') {
      navigateTasks(1);
    } else if (key.return) {
      executeActiveTask();
    } else if (input === ' ') {
      toggleTaskSelection();
    }
  });
  
  const navigateTasks = useCallback((direction: number) => {
    const taskList = Object.values(tasks);
    const currentIndex = taskList.findIndex(t => t.id === activeTaskId);
    const newIndex = Math.max(0, Math.min(taskList.length - 1, currentIndex + direction));
    setActiveTask(taskList[newIndex]?.id);
  }, [tasks, activeTaskId, setActiveTask]);
  
  return (
    <Box 
      width={width} 
      height={height}
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? 'blue' : 'gray'}
    >
      {/* 헤더 */}
      <Box paddingX={1} borderStyle="single" borderBottom>
        <Text bold color="cyan">
          📋 Tasks ({Object.keys(tasks).length})
        </Text>
      </Box>
      
      {/* 작업 목록 */}
      <ScrollableList height={height - 4}>
        {Object.entries(groupedTasks).map(([status, taskList]) => (
          taskList.length > 0 && (
            <TaskGroup 
              key={status}
              status={status}
              tasks={taskList}
              isExpanded={true}
              onTaskSelect={setActiveTask}
              activeTaskId={activeTaskId}
            />
          )
        ))}
      </ScrollableList>
      
      {/* 푸터 - 진행률 */}
      <Box paddingX={1} borderStyle="single" borderTop>
        <ProgressBar 
          completed={groupedTasks.completed.length}
          total={Object.keys(tasks).length}
          width={width - 4}
        />
      </Box>
    </Box>
  );
};

// TaskItem 컴포넌트
const TaskItem: React.FC<{
  task: Task;
  isActive: boolean;
  onSelect: (taskId: string) => void;
}> = ({ task, isActive, onSelect }) => {
  const statusIcon = {
    pending: '○',
    running: '◐',
    completed: '✓',
    failed: '✗'
  }[task.status];
  
  const statusColor = {
    pending: 'gray',
    running: 'yellow',
    completed: 'green',
    failed: 'red'
  }[task.status];
  
  return (
    <Box
      paddingX={1}
      backgroundColor={isActive ? 'blue' : undefined}
    >
      <Text color={statusColor}>{statusIcon}</Text>
      <Text> </Text>
      <Text 
        color={isActive ? 'white' : 'white'}
        dimColor={task.status === 'completed'}
      >
        {task.title}
      </Text>
      {task.status === 'running' && (
        <>
          <Text> </Text>
          <Text color="yellow">({task.progress}%)</Text>
        </>
      )}
    </Box>
  );
};
```

### 2.2 WorkArea 컴포넌트

```typescript
// src/ui/components/WorkArea/WorkArea.tsx
import React, { useEffect, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { useTaskStore } from '@/stores/taskStore';
import { useClaudeStore } from '@/stores/claudeStore';
import { TaskExecutor } from './TaskExecutor';
import { OutputDisplay } from './OutputDisplay';
import { ApprovalPrompt } from './ApprovalPrompt';

interface WorkAreaProps {
  width: number;
  height: number;
  isFocused?: boolean;
}

export const WorkArea: React.FC<WorkAreaProps> = ({ 
  width, 
  height, 
  isFocused 
}) => {
  const { activeTask } = useTaskStore();
  const { currentExecution, output } = useClaudeStore();
  const [showApproval, setShowApproval] = useState(false);
  
  useEffect(() => {
    if (activeTask?.status === 'awaiting_approval') {
      setShowApproval(true);
    }
  }, [activeTask]);
  
  return (
    <Box
      width={width}
      height={height}
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? 'blue' : 'gray'}
    >
      {/* 헤더 */}
      <Box paddingX={1} borderStyle="single" borderBottom>
        <Text bold color="cyan">
          🔧 Work Area
          {activeTask && (
            <>
              <Text> - </Text>
              <Text color="white">{activeTask.title}</Text>
            </>
          )}
        </Text>
      </Box>
      
      {/* 작업 실행 영역 */}
      {activeTask ? (
        <Box flexDirection="column" flexGrow={1}>
          {/* 실행 상태 */}
          <TaskExecutor
            task={activeTask}
            execution={currentExecution}
            height={Math.floor(height * 0.3)}
          />
          
          {/* 출력 표시 */}
          <OutputDisplay
            output={output}
            height={Math.floor(height * 0.6)}
            showLineNumbers={true}
          />
          
          {/* 승인 프롬프트 */}
          {showApproval && (
            <ApprovalPrompt
              task={activeTask}
              onApprove={() => {
                setShowApproval(false);
                // 승인 처리
              }}
              onReject={() => {
                setShowApproval(false);
                // 거부 처리
              }}
            />
          )}
        </Box>
      ) : (
        <Box 
          flexGrow={1} 
          alignItems="center" 
          justifyContent="center"
        >
          <Text dimColor>No active task selected</Text>
        </Box>
      )}
    </Box>
  );
};

// TaskExecutor 하위 컴포넌트
const TaskExecutor: React.FC<{
  task: Task;
  execution?: Execution;
  height: number;
}> = ({ task, execution, height }) => {
  return (
    <Box 
      height={height}
      flexDirection="column"
      paddingX={1}
      paddingY={1}
    >
      {/* 실행 명령 */}
      <Box marginBottom={1}>
        <Text dimColor>Command: </Text>
        <Text color="green">{task.command}</Text>
      </Box>
      
      {/* 진행 상태 */}
      {execution && (
        <Box flexDirection="column">
          <ProgressIndicator 
            progress={execution.progress}
            status={execution.status}
          />
          
          {execution.currentStep && (
            <Box marginTop={1}>
              <Text dimColor>Current: </Text>
              <Text>{execution.currentStep}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
```

### 2.3 ContextViewer 컴포넌트

```typescript
// src/ui/components/ContextViewer/ContextViewer.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useContextStore } from '@/stores/contextStore';
import { ContextTree } from './ContextTree';
import { ContextDetail } from './ContextDetail';
import { SearchBox } from '../common/SearchBox';

interface ContextViewerProps {
  width: number;
  height: number;
  isFocused?: boolean;
}

export const ContextViewer: React.FC<ContextViewerProps> = ({
  width,
  height,
  isFocused
}) => {
  const { contexts, activeContextId, searchContexts } = useContextStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'detail'>('tree');
  
  useInput((input, key) => {
    if (!isFocused) return;
    
    if (input === '/') {
      // 검색 모드 활성화
    } else if (key.tab) {
      // 뷰 모드 전환
      setViewMode(prev => prev === 'tree' ? 'detail' : 'tree');
    }
  });
  
  const activeContext = contexts[activeContextId];
  
  return (
    <Box
      width={width}
      height={height}
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? 'blue' : 'gray'}
    >
      {/* 헤더 */}
      <Box paddingX={1} borderStyle="single" borderBottom>
        <Text bold color="cyan">
          📚 Context
        </Text>
        <Text dimColor> ({Object.keys(contexts).length} items)</Text>
      </Box>
      
      {/* 검색 박스 */}
      <Box paddingX={1} paddingY={1}>
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={() => searchContexts(searchQuery)}
          placeholder="Search contexts..."
          width={width - 4}
        />
      </Box>
      
      {/* 컨텍스트 표시 */}
      <Box flexGrow={1} flexDirection="row">
        {viewMode === 'tree' ? (
          <ContextTree
            contexts={Object.values(contexts)}
            activeId={activeContextId}
            width={width}
            height={height - 6}
          />
        ) : (
          <ContextDetail
            context={activeContext}
            width={width}
            height={height - 6}
          />
        )}
      </Box>
    </Box>
  );
};

// ContextTree 하위 컴포넌트
const ContextTree: React.FC<{
  contexts: Context[];
  activeId?: string;
  width: number;
  height: number;
}> = ({ contexts, activeId, width, height }) => {
  // 컨텍스트를 타입별로 그룹화
  const grouped = contexts.reduce((acc, ctx) => {
    if (!acc[ctx.type]) acc[ctx.type] = [];
    acc[ctx.type].push(ctx);
    return acc;
  }, {} as Record<string, Context[]>);
  
  return (
    <ScrollableList height={height}>
      {Object.entries(grouped).map(([type, items]) => (
        <Box key={type} flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            {getContextTypeIcon(type)} {type}
          </Text>
          {items.map(ctx => (
            <Box
              key={ctx.id}
              paddingLeft={2}
              backgroundColor={ctx.id === activeId ? 'blue' : undefined}
            >
              <Text color={ctx.id === activeId ? 'white' : 'gray'}>
                • {ctx.title}
              </Text>
            </Box>
          ))}
        </Box>
      ))}
    </ScrollableList>
  );
};

const getContextTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    project: '📁',
    code: '💻',
    note: '📝',
    reference: '📚'
  };
  return icons[type] || '📄';
};
```

### 2.4 LogStream 컴포넌트

```typescript
// src/ui/components/LogStream/LogStream.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useLogStore } from '@/stores/logStore';
import { LogFilter } from './LogFilter';
import { LogEntry } from './LogEntry';
import { VirtualList } from '../common/VirtualList';

interface LogStreamProps {
  width: number;
  height: number;
  isFocused?: boolean;
}

export const LogStream: React.FC<LogStreamProps> = ({
  width,
  height,
  isFocused
}) => {
  const { logs, filter, setFilter, clearLogs } = useLogStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef<any>(null);
  
  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  }, [logs, autoScroll]);
  
  useInput((input, key) => {
    if (!isFocused) return;
    
    if (input === 'f') {
      setAutoScroll(prev => !prev);
    } else if (input === 'c') {
      clearLogs();
    } else if (input === '/') {
      setShowFilter(true);
    } else if (key.escape) {
      setShowFilter(false);
    }
  });
  
  // 필터링된 로그
  const filteredLogs = logs.filter(log => {
    if (!filter.level || log.level === filter.level) {
      if (!filter.text || log.message.includes(filter.text)) {
        return true;
      }
    }
    return false;
  });
  
  return (
    <Box
      width={width}
      height={height}
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? 'blue' : 'gray'}
    >
      {/* 헤더 */}
      <Box 
        paddingX={1} 
        borderStyle="single" 
        borderBottom
        justifyContent="space-between"
      >
        <Text bold color="cyan">
          📜 Logs ({filteredLogs.length})
        </Text>
        <Box>
          {autoScroll && <Text color="green">●</Text>}
          {!autoScroll && <Text color="gray">●</Text>}
          <Text dimColor> Auto</Text>
        </Box>
      </Box>
      
      {/* 필터 */}
      {showFilter && (
        <LogFilter
          filter={filter}
          onChange={setFilter}
          onClose={() => setShowFilter(false)}
        />
      )}
      
      {/* 로그 목록 */}
      <VirtualList
        ref={scrollRef}
        items={filteredLogs}
        height={height - 3}
        itemHeight={1}
        renderItem={(log) => (
          <LogEntry
            key={log.id}
            log={log}
            width={width - 2}
            showTimestamp={true}
          />
        )}
      />
    </Box>
  );
};

// LogEntry 하위 컴포넌트
const LogEntry: React.FC<{
  log: LogItem;
  width: number;
  showTimestamp?: boolean;
}> = ({ log, width, showTimestamp }) => {
  const levelColors = {
    debug: 'gray',
    info: 'white',
    warn: 'yellow',
    error: 'red'
  };
  
  const levelIcons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };
  
  return (
    <Box width={width}>
      {showTimestamp && (
        <Text dimColor>
          [{new Date(log.timestamp).toLocaleTimeString()}]
        </Text>
      )}
      <Text> </Text>
      <Text color={levelColors[log.level]}>
        {levelIcons[log.level]}
      </Text>
      <Text> </Text>
      <Text color={levelColors[log.level]}>
        {log.message}
      </Text>
    </Box>
  );
};
```

### 2.5 StatusBar 컴포넌트

```typescript
// src/ui/components/StatusBar/StatusBar.tsx
import React from 'react';
import { Box, Text } from 'ink';
import { useAppStore } from '@/stores/appStore';
import { useSessionStore } from '@/stores/sessionStore';
import { StatusIndicator } from '../common/StatusIndicator';

export const StatusBar: React.FC<{ width: number }> = ({ width }) => {
  const { status, version, projectName } = useAppStore();
  const { activeSession } = useSessionStore();
  
  return (
    <Box
      width={width}
      paddingX={1}
      borderStyle="single"
      justifyContent="space-between"
    >
      {/* 왼쪽: 앱 정보 */}
      <Box>
        <Text bold color="cyan">CCC v{version}</Text>
        <Text dimColor> │ </Text>
        <Text>Project: </Text>
        <Text color="green">{projectName || 'None'}</Text>
      </Box>
      
      {/* 중앙: 컨텍스트 상태 */}
      <Box>
        <Text dimColor>Context: </Text>
        <StatusIndicator status="loaded" />
        <Text color="green"> loaded</Text>
      </Box>
      
      {/* 오른쪽: 시스템 상태 */}
      <Box>
        <Text dimColor>Status: </Text>
        <StatusIndicator status={status} />
        <Text color={getStatusColor(status)}> {status}</Text>
        <Text dimColor> │ </Text>
        <Text>{new Date().toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'green',
    idle: 'yellow',
    error: 'red',
    offline: 'gray'
  };
  return colors[status] || 'white';
};
```

### 2.6 CommandPalette 컴포넌트

```typescript
// src/ui/components/CommandPalette/CommandPalette.tsx
import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import Fuse from 'fuse.js';
import { useCommandStore } from '@/stores/commandStore';
import { SearchInput } from '../common/SearchInput';
import { SelectableList } from '../common/SelectableList';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: Command) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onExecute
}) => {
  const { commands, recentCommands } = useCommandStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Fuzzy search 설정
  const fuse = useMemo(() => {
    return new Fuse(commands, {
      keys: ['name', 'description', 'aliases'],
      threshold: 0.3,
      includeScore: true
    });
  }, [commands]);
  
  // 검색 결과
  const searchResults = useMemo(() => {
    if (!query) {
      return recentCommands.length > 0 
        ? recentCommands 
        : commands.slice(0, 10);
    }
    
    return fuse.search(query).map(result => result.item);
  }, [query, fuse, commands, recentCommands]);
  
  useInput((input, key) => {
    if (!isOpen) return;
    
    if (key.escape) {
      onClose();
    } else if (key.return) {
      const selected = searchResults[selectedIndex];
      if (selected) {
        onExecute(selected);
        onClose();
      }
    } else if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(searchResults.length - 1, selectedIndex + 1));
    }
  });
  
  if (!isOpen) return null;
  
  return (
    <Box
      position="absolute"
      top="center"
      left="center"
      width="80%"
      height="60%"
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      paddingX={1}
      paddingY={1}
    >
      {/* 검색 입력 */}
      <Box marginBottom={1}>
        <Text bold color="cyan">⌘ Command Palette</Text>
      </Box>
      
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Type a command..."
        autoFocus
      />
      
      {/* 명령 목록 */}
      <Box flexGrow={1} marginTop={1}>
        <SelectableList
          items={searchResults}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          renderItem={(cmd, isSelected) => (
            <CommandItem
              command={cmd}
              isSelected={isSelected}
              showShortcut
            />
          )}
        />
      </Box>
      
      {/* 도움말 */}
      <Box marginTop={1} justifyContent="center">
        <Text dimColor>
          ↑↓ Navigate • Enter Execute • Esc Cancel
        </Text>
      </Box>
    </Box>
  );
};

// CommandItem 하위 컴포넌트
const CommandItem: React.FC<{
  command: Command;
  isSelected: boolean;
  showShortcut?: boolean;
}> = ({ command, isSelected, showShortcut }) => {
  return (
    <Box
      paddingX={1}
      backgroundColor={isSelected ? 'blue' : undefined}
    >
      <Box flexGrow={1}>
        <Text color={isSelected ? 'white' : 'cyan'}>
          {command.name}
        </Text>
        <Text dimColor> - </Text>
        <Text color={isSelected ? 'white' : 'gray'}>
          {command.description}
        </Text>
      </Box>
      
      {showShortcut && command.shortcut && (
        <Text dimColor>
          {command.shortcut}
        </Text>
      )}
    </Box>
  );
};
```

## 3. 컴포넌트 간 통신 패턴

### 3.1 이벤트 기반 통신

```typescript
// src/ui/events/EventBus.ts
import { EventEmitter } from 'events';

export interface UIEvent {
  type: string;
  payload?: any;
  source: string;
  timestamp: Date;
}

class UIEventBus extends EventEmitter {
  emit(event: string, data: Partial<UIEvent>): boolean {
    const fullEvent: UIEvent = {
      type: event,
      timestamp: new Date(),
      source: 'unknown',
      ...data
    };
    
    return super.emit(event, fullEvent);
  }
  
  // 타입 안전한 이벤트 메서드
  emitTaskSelected(taskId: string, source: string) {
    this.emit('task:selected', {
      payload: { taskId },
      source
    });
  }
  
  emitCommandExecuted(command: string, source: string) {
    this.emit('command:executed', {
      payload: { command },
      source
    });
  }
  
  emitFocusChanged(componentId: string, source: string) {
    this.emit('focus:changed', {
      payload: { componentId },
      source
    });
  }
}

export const uiEventBus = new UIEventBus();
```

### 3.2 Props Drilling 최소화

```typescript
// src/ui/contexts/UIContext.tsx
import React, { createContext, useContext } from 'react';

interface UIContextValue {
  theme: Theme;
  layout: LayoutConfig;
  shortcuts: ShortcutMap;
  eventBus: UIEventBus;
}

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider: React.FC<{
  children: React.ReactNode;
  config: UIConfig;
}> = ({ children, config }) => {
  const value: UIContextValue = {
    theme: config.theme,
    layout: config.layout,
    shortcuts: config.shortcuts,
    eventBus: uiEventBus
  };
  
  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
```

### 3.3 컴포넌트 통신 예제

```typescript
// TaskList에서 이벤트 발행
const TaskList: React.FC = () => {
  const { eventBus } = useUI();
  
  const handleTaskSelect = (taskId: string) => {
    eventBus.emitTaskSelected(taskId, 'TaskList');
  };
  
  // ...
};

// WorkArea에서 이벤트 구독
const WorkArea: React.FC = () => {
  const { eventBus } = useUI();
  const [activeTaskId, setActiveTaskId] = useState<string>();
  
  useEffect(() => {
    const handleTaskSelected = (event: UIEvent) => {
      setActiveTaskId(event.payload.taskId);
    };
    
    eventBus.on('task:selected', handleTaskSelected);
    
    return () => {
      eventBus.off('task:selected', handleTaskSelected);
    };
  }, [eventBus]);
  
  // ...
};
```

## 4. 상태 관리 전략 (Zustand 활용)

### 4.1 Store 구조

```typescript
// src/stores/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 타입 정의
interface AppState {
  // UI 상태
  ui: {
    focusedComponent: string | null;
    theme: 'dark' | 'light';
    layout: 'default' | 'compact' | 'focus';
    commandPaletteOpen: boolean;
  };
  
  // 작업 상태
  tasks: Record<string, Task>;
  activeTaskId: string | null;
  
  // 컨텍스트 상태  
  contexts: Record<string, Context>;
  activeContextId: string | null;
  
  // 로그 상태
  logs: LogEntry[];
  logFilters: LogFilter;
  
  // 액션
  actions: {
    // UI 액션
    setFocusedComponent: (componentId: string | null) => void;
    toggleCommandPalette: () => void;
    
    // 작업 액션
    addTask: (task: Task) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    setActiveTask: (taskId: string | null) => void;
    
    // 컨텍스트 액션
    addContext: (context: Context) => void;
    searchContexts: (query: string) => Promise<Context[]>;
    
    // 로그 액션
    addLog: (log: LogEntry) => void;
    clearLogs: () => void;
    setLogFilter: (filter: Partial<LogFilter>) => void;
  };
}

// Store 생성
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 초기 상태
        ui: {
          focusedComponent: null,
          theme: 'dark',
          layout: 'default',
          commandPaletteOpen: false
        },
        tasks: {},
        activeTaskId: null,
        contexts: {},
        activeContextId: null,
        logs: [],
        logFilters: {
          level: null,
          text: ''
        },
        
        // 액션 구현
        actions: {
          setFocusedComponent: (componentId) => set((state) => {
            state.ui.focusedComponent = componentId;
          }),
          
          toggleCommandPalette: () => set((state) => {
            state.ui.commandPaletteOpen = !state.ui.commandPaletteOpen;
          }),
          
          addTask: (task) => set((state) => {
            state.tasks[task.id] = task;
          }),
          
          updateTask: (taskId, updates) => set((state) => {
            if (state.tasks[taskId]) {
              Object.assign(state.tasks[taskId], updates);
            }
          }),
          
          setActiveTask: (taskId) => set((state) => {
            state.activeTaskId = taskId;
          }),
          
          addContext: (context) => set((state) => {
            state.contexts[context.id] = context;
          }),
          
          searchContexts: async (query) => {
            // Context7 MCP 호출
            const results = await contextClient.search(query);
            
            set((state) => {
              results.forEach(ctx => {
                state.contexts[ctx.id] = ctx;
              });
            });
            
            return results;
          },
          
          addLog: (log) => set((state) => {
            state.logs.push(log);
            
            // 로그 크기 제한
            if (state.logs.length > 10000) {
              state.logs.splice(0, 1000);
            }
          }),
          
          clearLogs: () => set((state) => {
            state.logs = [];
          }),
          
          setLogFilter: (filter) => set((state) => {
            Object.assign(state.logFilters, filter);
          })
        }
      })),
      {
        name: 'ccc-storage',
        partialize: (state) => ({
          ui: state.ui,
          logFilters: state.logFilters
        })
      }
    )
  )
);

// 선택자 (Selectors)
export const useActiveTask = () => {
  return useAppStore((state) => {
    return state.activeTaskId 
      ? state.tasks[state.activeTaskId] 
      : null;
  });
};

export const useFilteredLogs = () => {
  return useAppStore((state) => {
    const { logs, logFilters } = state;
    
    return logs.filter(log => {
      if (logFilters.level && log.level !== logFilters.level) {
        return false;
      }
      if (logFilters.text && !log.message.includes(logFilters.text)) {
        return false;
      }
      return true;
    });
  });
};
```

### 4.2 Store 분할

```typescript
// src/stores/taskStore.ts
interface TaskState {
  tasks: Record<string, Task>;
  activeTaskId: string | null;
  queue: string[];
  
  // 액션
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setActiveTask: (id: string | null) => void;
  executeTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: {},
  activeTaskId: null,
  queue: [],
  
  addTask: (task) => set((state) => ({
    tasks: { ...state.tasks, [task.id]: task },
    queue: [...state.queue, task.id]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: {
      ...state.tasks,
      [id]: { ...state.tasks[id], ...updates }
    }
  })),
  
  setActiveTask: (id) => set({ activeTaskId: id }),
  
  executeTask: async (id) => {
    const task = get().tasks[id];
    if (!task) return;
    
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...task, status: 'running' }
      }
    }));
    
    try {
      // Claude Code 실행
      const result = await claudeAdapter.execute(task.command);
      
      set((state) => ({
        tasks: {
          ...state.tasks,
          [id]: { ...state.tasks[id], status: 'completed', output: result }
        }
      }));
    } catch (error) {
      set((state) => ({
        tasks: {
          ...state.tasks,
          [id]: { ...state.tasks[id], status: 'failed', error }
        }
      }));
    }
  }
}));
```

## 5. 렌더링 최적화

### 5.1 가상화 (Virtualization)

```typescript
// src/ui/components/common/VirtualList.tsx
import React, { 
  forwardRef, 
  useImperativeHandle, 
  useState, 
  useCallback,
  useMemo 
} from 'react';
import { Box, measureElement } from 'ink';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualList = forwardRef(<T extends any>(
  props: VirtualListProps<T>,
  ref: React.Ref<any>
) => {
  const { items, height, itemHeight, renderItem, overscan = 3 } = props;
  const [scrollTop, setScrollTop] = useState(0);
  
  // 아이템 높이 계산
  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function'
      ? itemHeight(items[index], index)
      : itemHeight;
  }, [items, itemHeight]);
  
  // 가시 영역 계산
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;
    
    // 시작 인덱스 찾기
    for (let i = 0; i < items.length; i++) {
      const h = getItemHeight(i);
      if (accumulatedHeight + h > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += h;
    }
    
    // 끝 인덱스 찾기
    accumulatedHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > height) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }
    
    // 오프셋 계산
    let offsetY = 0;
    for (let i = 0; i < startIndex; i++) {
      offsetY += getItemHeight(i);
    }
    
    return { startIndex, endIndex, offsetY };
  }, [items, scrollTop, height, getItemHeight, overscan]);
  
  // 렌더링할 아이템
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // 스크롤 핸들러
  const handleScroll = useCallback((newScrollTop: number) => {
    const totalHeight = items.reduce(
      (acc, _, i) => acc + getItemHeight(i), 
      0
    );
    const maxScroll = Math.max(0, totalHeight - height);
    setScrollTop(Math.max(0, Math.min(maxScroll, newScrollTop)));
  }, [items, height, getItemHeight]);
  
  // ref 메서드 노출
  useImperativeHandle(ref, () => ({
    scrollTo: handleScroll,
    scrollToEnd: () => {
      const totalHeight = items.reduce(
        (acc, _, i) => acc + getItemHeight(i), 
        0
      );
      handleScroll(totalHeight - height);
    }
  }));
  
  return (
    <Box height={height} flexDirection="column" overflow="hidden">
      <Box 
        marginTop={Math.floor(offsetY)} 
        flexDirection="column"
      >
        {visibleItems.map((item, index) => (
          <Box key={startIndex + index} height={getItemHeight(startIndex + index)}>
            {renderItem(item, startIndex + index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
});
```

### 5.2 메모이제이션

```typescript
// src/ui/hooks/useOptimizedRender.ts
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { shallowEqual } from '../utils/shallowEqual';

export function useOptimizedRender<T>(
  data: T,
  dependencies: any[] = []
): [T, boolean] {
  const previousDataRef = useRef<T>(data);
  const [hasChanged, setHasChanged] = useState(false);
  
  useEffect(() => {
    const changed = !shallowEqual(previousDataRef.current, data);
    if (changed) {
      previousDataRef.current = data;
      setHasChanged(true);
    } else {
      setHasChanged(false);
    }
  }, [data, ...dependencies]);
  
  const memoizedData = useMemo(() => data, [hasChanged]);
  
  return [memoizedData, hasChanged];
}

// 사용 예시
const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const [optimizedTask, hasChanged] = useOptimizedRender(task, [task.id]);
  
  // hasChanged가 false면 리렌더링 스킵
  return useMemo(() => (
    <Box>
      <Text>{optimizedTask.title}</Text>
    </Box>
  ), [hasChanged, optimizedTask]);
};
```

### 5.3 디바운싱/쓰로틀링

```typescript
// src/ui/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// src/ui/hooks/useThrottle.ts
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;
    
    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);
      
      return () => clearTimeout(timer);
    }
  }, [value, interval]);
  
  return throttledValue;
}
```

## 6. 애니메이션 구현 방안

### 6.1 프레임 기반 애니메이션

```typescript
// src/ui/animations/FrameAnimator.ts
export class FrameAnimator {
  private animations = new Map<string, Animation>();
  private rafId: number | null = null;
  private lastTime = 0;
  
  start() {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      this.animations.forEach((animation) => {
        animation.update(deltaTime);
      });
      
      this.rafId = requestAnimationFrame(animate);
    };
    
    this.rafId = requestAnimationFrame(animate);
  }
  
  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  add(id: string, animation: Animation) {
    this.animations.set(id, animation);
  }
  
  remove(id: string) {
    this.animations.delete(id);
  }
}

// 애니메이션 정의
interface Animation {
  duration: number;
  elapsed: number;
  easing: (t: number) => number;
  update: (deltaTime: number) => void;
  onComplete?: () => void;
}

// React Hook
export function useAnimation(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number = (t) => t
): number {
  const [value, setValue] = useState(from);
  const animatorRef = useRef<FrameAnimator>();
  
  useEffect(() => {
    const animator = new FrameAnimator();
    animatorRef.current = animator;
    
    const animation: Animation = {
      duration,
      elapsed: 0,
      easing,
      update: (deltaTime) => {
        animation.elapsed += deltaTime;
        const progress = Math.min(animation.elapsed / duration, 1);
        const easedProgress = easing(progress);
        const currentValue = from + (to - from) * easedProgress;
        
        setValue(currentValue);
        
        if (progress >= 1) {
          animator.remove('value');
          animation.onComplete?.();
        }
      }
    };
    
    animator.add('value', animation);
    animator.start();
    
    return () => {
      animator.stop();
    };
  }, [from, to, duration, easing]);
  
  return value;
}
```

### 6.2 터미널 애니메이션 컴포넌트

```typescript
// src/ui/components/animations/Spinner.tsx
import React from 'react';
import { Text } from 'ink';
import { useAnimation } from '../../hooks/useAnimation';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const Spinner: React.FC<{ 
  color?: string;
  text?: string;
}> = ({ color = 'cyan', text }) => {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <Text color={color}>
      {spinnerFrames[frame]} {text}
    </Text>
  );
};

// Progress Bar 애니메이션
export const AnimatedProgressBar: React.FC<{
  progress: number;
  width: number;
  showPercentage?: boolean;
}> = ({ progress, width, showPercentage = true }) => {
  const animatedProgress = useAnimation(
    0, 
    progress, 
    500, 
    (t) => t * t // ease-in
  );
  
  const filled = Math.round((animatedProgress / 100) * width);
  const empty = width - filled;
  
  return (
    <Box>
      <Text color="green">{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
      {showPercentage && (
        <Text> {Math.round(animatedProgress)}%</Text>
      )}
    </Box>
  );
};

// 타이핑 애니메이션
export const TypeWriter: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
}> = ({ text, speed = 50, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);
  
  return <Text>{displayText}</Text>;
};
```

## 7. 테마 시스템 구현

### 7.1 테마 정의

```typescript
// src/ui/theme/types.ts
export interface Theme {
  name: string;
  colors: {
    // 기본 색상
    primary: string;
    secondary: string;
    tertiary: string;
    
    // 배경
    background: {
      primary: string;
      secondary: string;
      elevated: string;
    };
    
    // 텍스트
    text: {
      primary: string;
      secondary: string;
      muted: string;
      disabled: string;
    };
    
    // 시맨틱 색상
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // 테두리
    border: {
      default: string;
      focused: string;
      subtle: string;
    };
  };
  
  // 스타일
  styles: {
    borderStyle: 'single' | 'double' | 'round' | 'bold';
    focusedBorderStyle: 'single' | 'double' | 'round' | 'bold';
  };
  
  // 애니메이션
  animations: {
    spinnerSpeed: number;
    transitionDuration: number;
  };
}

// 기본 테마
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: 'cyan',
    secondary: 'blue',
    tertiary: 'magenta',
    
    background: {
      primary: 'black',
      secondary: '#0a0a0a',
      elevated: '#1a1a1a'
    },
    
    text: {
      primary: 'white',
      secondary: 'gray',
      muted: 'gray',
      disabled: '#525252'
    },
    
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    
    border: {
      default: 'gray',
      focused: 'cyan',
      subtle: '#272727'
    }
  },
  
  styles: {
    borderStyle: 'round',
    focusedBorderStyle: 'round'
  },
  
  animations: {
    spinnerSpeed: 80,
    transitionDuration: 200
  }
};

// 고대비 테마
export const highContrastTheme: Theme = {
  ...darkTheme,
  name: 'high-contrast',
  colors: {
    ...darkTheme.colors,
    text: {
      primary: 'white',
      secondary: 'white',
      muted: '#cccccc',
      disabled: '#666666'
    },
    border: {
      default: 'white',
      focused: 'yellow',
      subtle: 'white'
    }
  },
  styles: {
    borderStyle: 'bold',
    focusedBorderStyle: 'double'
  }
};
```

### 7.2 테마 컨텍스트

```typescript
// src/ui/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Theme, darkTheme, lightTheme, highContrastTheme } from './types';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Record<string, Theme>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: Theme;
}> = ({ children, initialTheme = darkTheme }) => {
  const [theme, setTheme] = useState(initialTheme);
  
  const availableThemes = {
    dark: darkTheme,
    light: lightTheme,
    'high-contrast': highContrastTheme
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// 테마 적용 컴포넌트
export const ThemedBox: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'elevated';
  borderColor?: keyof Theme['colors'];
  focused?: boolean;
}> = ({ children, variant = 'primary', borderColor, focused }) => {
  const { theme } = useTheme();
  
  return (
    <Box
      borderStyle={focused ? theme.styles.focusedBorderStyle : theme.styles.borderStyle}
      borderColor={
        focused 
          ? theme.colors.border.focused
          : borderColor 
            ? theme.colors[borderColor] 
            : theme.colors.border.default
      }
    >
      {children}
    </Box>
  );
};
```

## 8. 반응형 레이아웃 처리

### 8.1 레이아웃 매니저

```typescript
// src/ui/layout/LayoutManager.tsx
import React, { useState, useEffect } from 'react';
import { Box, useStdout } from 'ink';

export interface LayoutBreakpoint {
  name: string;
  minWidth: number;
  minHeight: number;
  layout: 'single' | 'split' | 'grid';
  columns?: number;
  rows?: number;
}

const breakpoints: LayoutBreakpoint[] = [
  {
    name: 'small',
    minWidth: 0,
    minHeight: 0,
    layout: 'single'
  },
  {
    name: 'medium',
    minWidth: 120,
    minHeight: 30,
    layout: 'split'
  },
  {
    name: 'large',
    minWidth: 160,
    minHeight: 40,
    layout: 'grid',
    columns: 2,
    rows: 2
  }
];

export const LayoutManager: React.FC<{
  children: (layout: LayoutInfo) => React.ReactNode;
}> = ({ children }) => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    width: stdout.columns,
    height: stdout.rows
  });
  
  // 터미널 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: stdout.columns,
        height: stdout.rows
      });
    };
    
    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);
  
  // 현재 브레이크포인트 계산
  const currentBreakpoint = breakpoints
    .filter(bp => 
      dimensions.width >= bp.minWidth && 
      dimensions.height >= bp.minHeight
    )
    .pop() || breakpoints[0];
  
  const layoutInfo: LayoutInfo = {
    ...dimensions,
    breakpoint: currentBreakpoint,
    isSmall: currentBreakpoint.name === 'small',
    isMedium: currentBreakpoint.name === 'medium',
    isLarge: currentBreakpoint.name === 'large'
  };
  
  return <>{children(layoutInfo)}</>;
};

// 반응형 그리드
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode[];
  columns?: number;
  gap?: number;
}> = ({ children, columns = 2, gap = 1 }) => {
  const { width } = useTerminalSize();
  
  // 동적 컬럼 수 계산
  const actualColumns = width < 120 ? 1 : columns;
  const columnWidth = Math.floor((width - gap * (actualColumns - 1)) / actualColumns);
  
  return (
    <Box flexWrap="wrap" width={width}>
      {React.Children.map(children, (child, index) => (
        <Box
          key={index}
          width={columnWidth}
          marginRight={
            (index + 1) % actualColumns === 0 ? 0 : gap
          }
          marginBottom={gap}
        >
          {child}
        </Box>
      ))}
    </Box>
  );
};
```

### 8.2 적응형 컴포넌트

```typescript
// src/ui/components/adaptive/AdaptiveLayout.tsx
export const AdaptiveLayout: React.FC = () => {
  return (
    <LayoutManager>
      {(layout) => {
        // 작은 화면
        if (layout.isSmall) {
          return (
            <Box flexDirection="column" height={layout.height}>
              <StatusBar width={layout.width} />
              <Tabs>
                <Tab label="Tasks">
                  <TaskList 
                    width={layout.width} 
                    height={layout.height - 3}
                  />
                </Tab>
                <Tab label="Output">
                  <WorkArea 
                    width={layout.width} 
                    height={layout.height - 3}
                  />
                </Tab>
                <Tab label="Logs">
                  <LogStream 
                    width={layout.width} 
                    height={layout.height - 3}
                  />
                </Tab>
              </Tabs>
            </Box>
          );
        }
        
        // 중간 화면
        if (layout.isMedium) {
          return (
            <Box flexDirection="column" height={layout.height}>
              <StatusBar width={layout.width} />
              <Box flexGrow={1}>
                <TaskList 
                  width={Math.floor(layout.width * 0.3)} 
                  height={layout.height - 2}
                />
                <Box flexDirection="column" flexGrow={1}>
                  <WorkArea 
                    width={Math.floor(layout.width * 0.7)}
                    height={Math.floor((layout.height - 2) * 0.6)}
                  />
                  <LogStream
                    width={Math.floor(layout.width * 0.7)}
                    height={Math.floor((layout.height - 2) * 0.4)}
                  />
                </Box>
              </Box>
            </Box>
          );
        }
        
        // 큰 화면 (그리드)
        return (
          <Box flexDirection="column" height={layout.height}>
            <StatusBar width={layout.width} />
            <ResponsiveGrid columns={2} gap={0}>
              <TaskList 
                width={Math.floor(layout.width / 2)}
                height={Math.floor((layout.height - 2) / 2)}
              />
              <WorkArea
                width={Math.floor(layout.width / 2)}
                height={Math.floor((layout.height - 2) / 2)}
              />
              <ContextViewer
                width={Math.floor(layout.width / 2)}
                height={Math.floor((layout.height - 2) / 2)}
              />
              <LogStream
                width={Math.floor(layout.width / 2)}
                height={Math.floor((layout.height - 2) / 2)}
              />
            </ResponsiveGrid>
          </Box>
        );
      }}
    </LayoutManager>
  );
};
```

## 9. 접근성 구현 방안

### 9.1 스크린 리더 지원

```typescript
// src/ui/accessibility/ScreenReaderSupport.tsx
import { useEffect } from 'react';

// 스크린 리더 알림 훅
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // 터미널 환경에서는 직접 출력
    if (process.env.SCREEN_READER_MODE === 'true') {
      console.log(`[${priority.toUpperCase()}] ${message}`);
    }
    
    // 이벤트 발행 (다른 시스템과 통합용)
    uiEventBus.emit('accessibility:announce', {
      message,
      priority,
      timestamp: new Date()
    });
  }, []);
  
  return announce;
}

// 접근성 컨텍스트
export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [screenReaderMode, setScreenReaderMode] = useState(
    process.env.SCREEN_READER_MODE === 'true'
  );
  
  const value = {
    screenReaderMode,
    setScreenReaderMode,
    announce: useAnnounce()
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// 접근성 강화 컴포넌트
export const AccessibleList: React.FC<{
  items: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  label: string;
}> = ({ items, selectedIndex, onSelect, renderItem, label }) => {
  const { announce } = useAccessibility();
  
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      const newIndex = Math.max(0, selectedIndex - 1);
      onSelect(newIndex);
      announce(`${label}: Selected item ${newIndex + 1} of ${items.length}`);
    } else if (key.downArrow || input === 'j') {
      const newIndex = Math.min(items.length - 1, selectedIndex + 1);
      onSelect(newIndex);
      announce(`${label}: Selected item ${newIndex + 1} of ${items.length}`);
    }
  });
  
  return (
    <Box flexDirection="column" aria-label={label}>
      {items.map((item, index) => (
        <Box
          key={index}
          aria-selected={index === selectedIndex}
          aria-posinset={index + 1}
          aria-setsize={items.length}
        >
          {renderItem(item, index)}
        </Box>
      ))}
    </Box>
  );
};
```

### 9.2 키보드 네비게이션 강화

```typescript
// src/ui/accessibility/KeyboardNavigation.ts
export class FocusManager {
  private focusableComponents: Map<string, FocusableComponent> = new Map();
  private focusOrder: string[] = [];
  private currentFocusIndex = 0;
  
  register(component: FocusableComponent) {
    this.focusableComponents.set(component.id, component);
    this.updateFocusOrder();
  }
  
  unregister(componentId: string) {
    this.focusableComponents.delete(componentId);
    this.updateFocusOrder();
  }
  
  private updateFocusOrder() {
    // 탭 순서에 따라 정렬
    this.focusOrder = Array.from(this.focusableComponents.values())
      .sort((a, b) => (a.tabIndex || 0) - (b.tabIndex || 0))
      .map(c => c.id);
  }
  
  focusNext() {
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusOrder.length;
    this.setFocus(this.focusOrder[this.currentFocusIndex]);
  }
  
  focusPrevious() {
    this.currentFocusIndex = 
      (this.currentFocusIndex - 1 + this.focusOrder.length) % this.focusOrder.length;
    this.setFocus(this.focusOrder[this.currentFocusIndex]);
  }
  
  setFocus(componentId: string) {
    const component = this.focusableComponents.get(componentId);
    if (component) {
      // 이전 포커스 해제
      this.focusableComponents.forEach(c => {
        if (c.id !== componentId) {
          c.onBlur?.();
        }
      });
      
      // 새 포커스 설정
      component.onFocus?.();
      this.currentFocusIndex = this.focusOrder.indexOf(componentId);
      
      // 스크린 리더 알림
      if (component.ariaLabel) {
        announce(`Focused on ${component.ariaLabel}`);
      }
    }
  }
}

// React Hook
export function useFocusable(
  id: string,
  options: FocusableOptions = {}
): FocusableResult {
  const [isFocused, setIsFocused] = useState(false);
  const focusManager = useFocusManager();
  
  useEffect(() => {
    const component: FocusableComponent = {
      id,
      tabIndex: options.tabIndex || 0,
      ariaLabel: options.ariaLabel,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false)
    };
    
    focusManager.register(component);
    
    return () => {
      focusManager.unregister(id);
    };
  }, [id, options.tabIndex, options.ariaLabel]);
  
  return {
    isFocused,
    focusProps: {
      'aria-label': options.ariaLabel,
      'aria-describedby': options.ariaDescribedBy,
      tabIndex: options.tabIndex || 0
    }
  };
}
```

### 9.3 색상 대비 및 시각적 표시

```typescript
// src/ui/accessibility/VisualIndicators.tsx
export const FocusIndicator: React.FC<{
  children: React.ReactNode;
  isFocused: boolean;
  style?: 'outline' | 'highlight' | 'both';
}> = ({ children, isFocused, style = 'both' }) => {
  const { theme } = useTheme();
  
  if (!isFocused) {
    return <>{children}</>;
  }
  
  const indicators = {
    outline: (
      <Box
        borderStyle="double"
        borderColor={theme.colors.border.focused}
      >
        {children}
      </Box>
    ),
    highlight: (
      <Box backgroundColor={theme.colors.primary}>
        {children}
      </Box>
    ),
    both: (
      <Box
        borderStyle="double"
        borderColor={theme.colors.border.focused}
        backgroundColor={theme.colors.background.elevated}
      >
        {children}
      </Box>
    )
  };
  
  return indicators[style];
};

// 상태 표시 (색상 외 추가 표시)
export const StatusIndicator: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  text?: string;
  showIcon?: boolean;
  showPattern?: boolean;
}> = ({ status, text, showIcon = true, showPattern = true }) => {
  const icons = {
    success: '✓',
    warning: '!',
    error: '✗',
    info: 'i'
  };
  
  const patterns = {
    success: '●',
    warning: '◐',
    error: '✗',
    info: '○'
  };
  
  const colors = {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue'
  };
  
  return (
    <Box>
      {showIcon && (
        <Text color={colors[status]}>{icons[status]}</Text>
      )}
      {showPattern && (
        <Text color={colors[status]}>{patterns[status]}</Text>
      )}
      {text && (
        <Text color={colors[status]}> {text}</Text>
      )}
    </Box>
  );
};
```

## 10. 예제 코드 (TypeScript)

### 10.1 메인 애플리케이션

```typescript
// src/ui/App.tsx
import React from 'react';
import { render } from 'ink';
import { ThemeProvider } from './theme/ThemeContext';
import { AccessibilityProvider } from './accessibility/AccessibilityContext';
import { UIProvider } from './contexts/UIContext';
import { AdaptiveLayout } from './components/adaptive/AdaptiveLayout';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { NotificationContainer } from './components/Notification/NotificationContainer';
import { useAppInitialization } from './hooks/useAppInitialization';

const App: React.FC = () => {
  const { isReady, error } = useAppInitialization();
  
  if (!isReady) {
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen error={error} />;
  }
  
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <UIProvider>
          <AdaptiveLayout />
          <CommandPalette />
          <NotificationContainer />
        </UIProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

// 앱 실행
export function startUI() {
  const { waitUntilExit } = render(<App />);
  
  waitUntilExit().then(() => {
    console.log('CCC UI terminated');
    process.exit(0);
  });
}

// src/index.ts
import { startUI } from './ui/App';
import { initializeBackend } from './backend';
import { setupMCPConnections } from './mcp';

async function main() {
  try {
    // 백엔드 초기화
    await initializeBackend();
    
    // MCP 연결
    await setupMCPConnections();
    
    // UI 시작
    startUI();
    
  } catch (error) {
    console.error('Failed to start CCC:', error);
    process.exit(1);
  }
}

main();
```

### 10.2 통합 예제

```typescript
// src/ui/examples/TaskExecutionFlow.tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTaskStore } from '../stores/taskStore';
import { useClaudeStore } from '../stores/claudeStore';
import { TaskList } from '../components/TaskList/TaskList';
import { WorkArea } from '../components/WorkArea/WorkArea';
import { ApprovalDialog } from '../components/ApprovalDialog/ApprovalDialog';

export const TaskExecutionFlow: React.FC = () => {
  const { activeTask, executeTask, updateTask } = useTaskStore();
  const { startExecution, stopExecution } = useClaudeStore();
  const [showApproval, setShowApproval] = useState(false);
  
  // 작업 실행 플로우
  const handleTaskExecution = async (taskId: string) => {
    try {
      // 1. 작업 시작
      updateTask(taskId, { status: 'running' });
      
      // 2. Claude Code 실행
      const execution = await startExecution(taskId);
      
      // 3. 실행 모니터링
      execution.on('progress', (progress) => {
        updateTask(taskId, { progress });
      });
      
      execution.on('output', (output) => {
        // 출력 처리
      });
      
      // 4. 승인 필요 시
      execution.on('approval_required', (data) => {
        updateTask(taskId, { 
          status: 'awaiting_approval',
          pendingChanges: data.changes
        });
        setShowApproval(true);
      });
      
      // 5. 완료
      const result = await execution.complete();
      updateTask(taskId, { 
        status: 'completed',
        result
      });
      
    } catch (error) {
      updateTask(taskId, { 
        status: 'failed',
        error: error.message
      });
    }
  };
  
  // 승인 처리
  const handleApproval = async (approved: boolean) => {
    if (approved) {
      await executeTask(activeTask.id);
    } else {
      updateTask(activeTask.id, { status: 'rejected' });
    }
    setShowApproval(false);
  };
  
  return (
    <Box height="100%">
      <Box width="30%">
        <TaskList onExecute={handleTaskExecution} />
      </Box>
      
      <Box flexGrow={1}>
        <WorkArea />
      </Box>
      
      {showApproval && activeTask && (
        <ApprovalDialog
          task={activeTask}
          onApprove={() => handleApproval(true)}
          onReject={() => handleApproval(false)}
        />
      )}
    </Box>
  );
};
```

## 마무리

이 문서는 Claude Code Controller의 터미널 UI 컴포넌트 시스템을 위한 포괄적인 설계를 제공합니다. 주요 특징:

1. **React 기반 터미널 UI**: Blessed/Ink 3를 사용한 모던한 터미널 UI
2. **컴포넌트 재사용성**: 모듈화된 컴포넌트 구조
3. **상태 관리**: Zustand를 활용한 효율적인 상태 관리
4. **성능 최적화**: 가상화, 메모이제이션, 디바운싱
5. **접근성**: 스크린 리더 지원, 키보드 네비게이션
6. **반응형 디자인**: 터미널 크기에 따른 적응형 레이아웃
7. **테마 시스템**: 다크/라이트/고대비 테마 지원
8. **애니메이션**: 부드러운 전환과 시각적 피드백

이 설계를 기반으로 구현하면 강력하고 사용하기 쉬운 터미널 UI를 만들 수 있을 것입니다.