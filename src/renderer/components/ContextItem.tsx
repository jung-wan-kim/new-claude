import React from 'react';
import { Box, Text } from 'ink';
import { ContextEntry } from '../../shared/types';
import { useTheme } from './ThemeProvider';
import { formatDate } from '../../shared/utils';

interface ContextItemProps {
  context: ContextEntry;
  isSelected: boolean;
  onSelect: () => void;
}

export const ContextItem: React.FC<ContextItemProps> = ({ context, isSelected, onSelect }) => {
  const theme = useTheme();
  
  const getTypeIcon = () => {
    switch (context.type) {
      case 'code':
        return '📄';
      case 'note':
        return '📝';
      case 'reference':
        return '📚';
      default:
        return '📋';
    }
  };
  
  return (
    <Box
      paddingX={1}
      backgroundColor={isSelected ? theme.colors.selection : undefined}
    >
      <Box width="3">
        <Text>{getTypeIcon()}</Text>
      </Box>
      <Box flexGrow={1} marginRight={1}>
        <Text color={theme.colors.foreground}>
          {context.title}
        </Text>
      </Box>
      <Box width="10">
        <Text color={theme.colors.gray} dimColor>
          {formatDate(context.updatedAt)}
        </Text>
      </Box>
    </Box>
  );
};