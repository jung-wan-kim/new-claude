import React from 'react';
import { Box, Text } from 'ink';
import { LogEntry as LogEntryType } from '../../shared/types';
import { useTheme } from './ThemeProvider';
import { formatTime } from '../../shared/utils';

interface LogEntryProps {
  log: LogEntryType;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const theme = useTheme();
  
  const getLevelColor = () => {
    switch (log.level) {
      case 'error':
        return theme.colors.error;
      case 'warn':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.gray;
    }
  };
  
  const getLevelIcon = () => {
    switch (log.level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '🔍';
    }
  };
  
  return (
    <Box paddingX={1}>
      <Box width="10">
        <Text color={theme.colors.gray} dimColor>
          {formatTime(log.timestamp)}
        </Text>
      </Box>
      <Box width="3">
        <Text>{getLevelIcon()}</Text>
      </Box>
      <Box width="10">
        <Text color={theme.colors.cyan}>
          {log.source}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={getLevelColor()} wrap="truncate">
          {log.message}
        </Text>
      </Box>
    </Box>
  );
};