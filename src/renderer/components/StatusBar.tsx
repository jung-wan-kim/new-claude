import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from './ThemeProvider';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useClaudeStore } from '../stores/claudeStore';
import { formatShortcut } from '../../shared/utils';

export const StatusBar: React.FC = () => {
  const theme = useTheme();
  const { activePanel, layout } = useUIStore();
  const { requests } = useTaskStore();
  const { isExecuting, isConnected } = useClaudeStore();
  
  const activeTasks = requests.reduce((count, req) => 
    count + req.tasks.filter(t => t.status === 'in_progress').length, 0
  );
  
  const completedTasks = requests.reduce((count, req) => 
    count + req.tasks.filter(t => t.status === 'completed').length, 0
  );
  
  const totalTasks = requests.reduce((count, req) => 
    count + req.tasks.length, 0
  );
  
  return (
    <Box
      paddingX={1}
      borderStyle={{ top: 'single' }}
      borderColor={theme.colors.border}
      justifyContent="space-between"
    >
      <Box>
        <Text color={theme.colors.primary}>
          {activePanel.toUpperCase()}
        </Text>
        <Text color={theme.colors.gray}> • </Text>
        <Text color={theme.colors.foreground}>
          Layout: {layout}
        </Text>
      </Box>
      
      <Box>
        <Text color={theme.colors.gray}>Tasks: </Text>
        <Text color={theme.colors.success}>{completedTasks}</Text>
        <Text color={theme.colors.gray}>/</Text>
        <Text color={theme.colors.warning}>{activeTasks}</Text>
        <Text color={theme.colors.gray}>/</Text>
        <Text color={theme.colors.foreground}>{totalTasks}</Text>
        
        <Text color={theme.colors.gray}> • </Text>
        
        <Text color={isConnected ? theme.colors.success : theme.colors.error}>
          {isConnected ? '🟢' : '🔴'} MCP
        </Text>
        
        <Text color={theme.colors.gray}> • </Text>
        
        <Text color={isExecuting ? theme.colors.warning : theme.colors.gray}>
          {isExecuting ? '⚡ Running' : '💤 Idle'}
        </Text>
      </Box>
      
      <Box>
        <Text color={theme.colors.gray}>
          {formatShortcut('Cmd+Q')} Quit
        </Text>
      </Box>
    </Box>
  );
};