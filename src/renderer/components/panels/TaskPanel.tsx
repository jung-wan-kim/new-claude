import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Panel } from '../common/Panel';
import { TaskItem } from '../TaskItem';
import { useTaskStore } from '../../stores/taskStore';
import { useTheme } from '../ThemeProvider';

interface TaskPanelProps {
  isActive: boolean;
  width?: string;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ isActive, width }) => {
  const theme = useTheme();
  const { requests, activeRequestId, setActiveRequest } = useTaskStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const activeRequest = requests.find(r => r.id === activeRequestId);
  const tasks = activeRequest?.tasks || [];
  
  useInput((input, key) => {
    if (!isActive) return;
    
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(tasks.length - 1, selectedIndex + 1));
    } else if (key.return) {
      // 태스크 실행
      const task = tasks[selectedIndex];
      if (task && task.status === 'pending') {
        useTaskStore.getState().startTask(task.id);
      }
    }
  }, { isActive });
  
  return (
    <Panel title="Tasks" isActive={isActive} width={width}>
      {tasks.length === 0 ? (
        <Box padding={1}>
          <Text color={theme.colors.gray}>No tasks available</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={isActive && index === selectedIndex}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </Box>
      )}
      
      {isActive && (
        <Box marginTop={1} paddingX={1}>
          <Text color={theme.colors.gray} dimColor>
            ↑↓ Navigate • Enter Run • ⌘N New
          </Text>
        </Box>
      )}
    </Panel>
  );
};