import React from 'react';
import { Box, Text } from 'ink';
import { Task } from '../../shared/types';
import { useTheme } from './ThemeProvider';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isSelected, onSelect }) => {
  const theme = useTheme();
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      default:
        return '⚪';
    }
  };
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      default:
        return theme.colors.gray;
    }
  };
  
  return (
    <Box
      paddingX={1}
      backgroundColor={isSelected ? theme.colors.selection : undefined}
    >
      <Box width="3">
        <Text>{getStatusIcon()}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text
          color={task.status === 'completed' ? theme.colors.gray : theme.colors.foreground}
          strikethrough={task.status === 'completed'}
        >
          {task.title}
        </Text>
      </Box>
      <Box width="5">
        <Text color={getPriorityColor()}>
          {task.priority.charAt(0).toUpperCase()}
        </Text>
      </Box>
    </Box>
  );
};