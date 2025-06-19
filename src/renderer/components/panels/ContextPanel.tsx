import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel';
import { ContextItem } from '../ContextItem';
import { useContextStore } from '../../stores/contextStore';
import { useTheme } from '../ThemeProvider';

interface ContextPanelProps {
  isActive: boolean;
  width?: string;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ isActive, width }) => {
  const theme = useTheme();
  const { contexts, searchContexts } = useContextStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  
  useInput((input, key) => {
    if (!isActive) return;
    
    if (!searchMode) {
      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow) {
        setSelectedIndex(Math.min(contexts.length - 1, selectedIndex + 1));
      } else if (input === '/') {
        setSearchMode(true);
      } else if (key.return) {
        const context = contexts[selectedIndex];
        if (context) {
          useContextStore.getState().setActiveContext(context.id);
        }
      }
    } else {
      if (key.escape) {
        setSearchMode(false);
      }
    }
  }, { isActive });
  
  return (
    <Panel title="Context" isActive={isActive} width={width}>
      {contexts.length === 0 ? (
        <Box padding={1}>
          <Text color={theme.colors.gray}>No context entries</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {contexts.map((context, index) => (
            <ContextItem
              key={context.id}
              context={context}
              isSelected={isActive && index === selectedIndex}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </Box>
      )}
      
      {isActive && (
        <Box marginTop={1} paddingX={1}>
          <Text color={theme.colors.gray} dimColor>
            ↑↓ Navigate • / Search • Enter View
          </Text>
        </Box>
      )}
    </Panel>
  );
};