import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel';
import { LogEntry } from '../LogEntry';
import { useLogStore } from '../../stores/logStore';
import { useTheme } from '../ThemeProvider';

interface LogPanelProps {
  isActive: boolean;
  width?: string;
}

export const LogPanel: React.FC<LogPanelProps> = ({ isActive, width }) => {
  const theme = useTheme();
  const { logs, filter } = useLogStore();
  
  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.source && !log.source.includes(filter.source)) return false;
    return true;
  });
  
  return (
    <Panel title="Logs" isActive={isActive} width={width}>
      {filteredLogs.length === 0 ? (
        <Box padding={1}>
          <Text color={theme.colors.gray}>No logs</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {filteredLogs.slice(-20).map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </Box>
      )}
    </Panel>
  );
};