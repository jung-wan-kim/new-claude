import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Panel } from '../common/Panel';
import { Terminal } from '../Terminal';
import { useClaudeStore } from '../../stores/claudeStore';
import { useTheme } from '../ThemeProvider';

interface WorkPanelProps {
  isActive: boolean;
  width?: string;
}

export const WorkPanel: React.FC<WorkPanelProps> = ({ isActive, width }) => {
  const theme = useTheme();
  const { isExecuting, currentCommand, output, executeCommand } = useClaudeStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'normal' | 'input'>('normal');
  
  useInput((input, key) => {
    if (!isActive) return;
    
    if (mode === 'normal') {
      if (input === 'i') {
        setMode('input');
      } else if (key.meta && input === 'k') {
        // Clear terminal
        useClaudeStore.getState().clearOutput();
      }
    } else if (mode === 'input') {
      if (key.escape) {
        setMode('normal');
        setInput('');
      }
    }
  }, { isActive });
  
  const handleSubmit = (value: string) => {
    if (value.trim() && !isExecuting) {
      executeCommand(value);
      setInput('');
      setMode('normal');
    }
  };
  
  return (
    <Panel title="Work Area" isActive={isActive} width={width}>
      <Box flexDirection="column" height="100%">
        <Box flexGrow={1} flexDirection="column">
          <Terminal content={output} />
        </Box>
        
        <Box
          borderStyle="single"
          borderColor={isActive ? theme.colors.primary : theme.colors.border}
          paddingX={1}
          marginTop={1}
        >
          {mode === 'input' ? (
            <Box>
              <Text color={theme.colors.primary}>❯ </Text>
              <TextInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                placeholder="Enter Claude command..."
              />
            </Box>
          ) : (
            <Box justifyContent="space-between">
              <Text color={theme.colors.gray}>
                {isExecuting ? '⏳ Executing...' : '💤 Ready'}
              </Text>
              <Text color={theme.colors.gray} dimColor>
                Press 'i' to input
              </Text>
            </Box>
          )}
        </Box>
        
        {currentCommand && (
          <Box marginTop={1} paddingX={1}>
            <Text color={theme.colors.gray}>Last: </Text>
            <Text color={theme.colors.cyan}>{currentCommand}</Text>
          </Box>
        )}
      </Box>
    </Panel>
  );
};