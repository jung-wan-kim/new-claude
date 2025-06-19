import React, { useRef, useEffect } from 'react';
import { Box, Text, measureElement } from 'ink';
import { useTheme } from './ThemeProvider';

interface TerminalProps {
  content: string;
}

export const Terminal: React.FC<TerminalProps> = ({ content }) => {
  const theme = useTheme();
  const scrollRef = useRef<any>();
  
  useEffect(() => {
    // 새로운 내용이 추가될 때 자동 스크롤
    if (scrollRef.current) {
      // Ink doesn't have built-in scroll, but we can simulate it
    }
  }, [content]);
  
  const lines = content.split('\n');
  const maxLines = 30; // 표시할 최대 줄 수
  const displayLines = lines.slice(-maxLines);
  
  return (
    <Box
      flexDirection="column"
      padding={1}
      ref={scrollRef}
    >
      {displayLines.map((line, index) => (
        <Text key={index} wrap="wrap">
          {formatLine(line, theme)}
        </Text>
      ))}
      {lines.length === 0 && (
        <Text color={theme.colors.gray}>
          Terminal output will appear here...
        </Text>
      )}
    </Box>
  );
};

// ANSI 색상 코드를 Ink 색상으로 변환
function formatLine(line: string, theme: any): React.ReactNode {
  // 간단한 ANSI 파싱 (실제로는 더 복잡한 파서가 필요)
  const parts = line.split(/(\x1b\[[0-9;]*m)/);
  const formatted: React.ReactNode[] = [];
  let currentColor = theme.colors.foreground;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('\x1b[')) {
      // ANSI 코드 파싱
      const code = part.match(/\x1b\[([0-9;]*)m/)?.[1];
      if (code === '0') {
        currentColor = theme.colors.foreground;
      } else if (code === '31') {
        currentColor = theme.colors.error;
      } else if (code === '32') {
        currentColor = theme.colors.success;
      } else if (code === '33') {
        currentColor = theme.colors.warning;
      } else if (code === '34') {
        currentColor = theme.colors.info;
      }
    } else if (part) {
      formatted.push(
        <Text key={i} color={currentColor}>
          {part}
        </Text>
      );
    }
  }
  
  return formatted.length > 0 ? formatted : line;
}