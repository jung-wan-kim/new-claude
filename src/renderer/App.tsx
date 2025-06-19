import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { MainLayout } from './components/MainLayout';
import { useUIStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useClaudeStore } from './stores/claudeStore';
import { useShortcuts } from './hooks/useShortcuts';
import { ThemeProvider } from './components/ThemeProvider';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [isReady, setIsReady] = useState(false);
  
  // 스토어 초기화
  const uiStore = useUIStore();
  const taskStore = useTaskStore();
  const claudeStore = useClaudeStore();
  
  // 단축키 설정
  useShortcuts();
  
  // 종료 단축키
  useInput((input, key) => {
    if (key.ctrl && input === 'q') {
      exit();
    }
  });
  
  React.useEffect(() => {
    // 초기화 로직
    Promise.all([
      taskStore.initialize(),
      claudeStore.initialize(),
    ]).then(() => {
      setIsReady(true);
    }).catch((error) => {
      console.error('Failed to initialize:', error);
      exit();
    });
  }, []);
  
  if (!isReady) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">⚡ Claude Code Controller</Text>
        <Text color="gray">Initializing...</Text>
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={uiStore.theme}>
      <MainLayout />
    </ThemeProvider>
  );
};