import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../ThemeProvider';

interface PanelProps {
  title: string;
  isActive: boolean;
  width?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, isActive, width, children }) => {
  const theme = useTheme();
  
  return (
    <Box
      flexDirection="column"
      width={width}
      height="100%"
      borderStyle="single"
      borderColor={isActive ? theme.colors.primary : theme.colors.border}
    >
      <Box
        paddingX={1}
        borderStyle={{ bottom: 'single' }}
        borderColor={theme.colors.border}
      >
        <Text color={isActive ? theme.colors.primary : theme.colors.foreground} bold>
          {title}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
};