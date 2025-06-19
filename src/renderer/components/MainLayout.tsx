import React from 'react';
import { Box, useInput } from 'ink';
import { TaskPanel } from './panels/TaskPanel';
import { WorkPanel } from './panels/WorkPanel';
import { ContextPanel } from './panels/ContextPanel';
import { LogPanel } from './panels/LogPanel';
import { StatusBar } from './StatusBar';
import { useUIStore } from '../stores/uiStore';

export const MainLayout: React.FC = () => {
  const { activePanel, layout, showStatusBar, setActivePanel } = useUIStore();
  
  // 패널 전환 단축키
  useInput((input, key) => {
    if (key.meta || key.ctrl) {
      switch (input) {
        case '1':
          setActivePanel('tasks');
          break;
        case '2':
          setActivePanel('work');
          break;
        case '3':
          setActivePanel('context');
          break;
        case '4':
          setActivePanel('logs');
          break;
      }
    }
  });
  
  const renderPanels = () => {
    switch (layout) {
      case 'focus':
        return (
          <Box width="100%" height="100%">
            <WorkPanel isActive={true} width="100%" />
          </Box>
        );
        
      case 'compact':
        return (
          <>
            <Box width="30%">
              <TaskPanel isActive={activePanel === 'tasks'} />
            </Box>
            <Box width="70%">
              <WorkPanel isActive={activePanel === 'work'} />
            </Box>
          </>
        );
        
      default: // 'default'
        return (
          <>
            <Box width="25%">
              <TaskPanel isActive={activePanel === 'tasks'} />
            </Box>
            <Box width="40%">
              <WorkPanel isActive={activePanel === 'work'} />
            </Box>
            <Box width="20%">
              <ContextPanel isActive={activePanel === 'context'} />
            </Box>
            <Box width="15%">
              <LogPanel isActive={activePanel === 'logs'} />
            </Box>
          </>
        );
    }
  };
  
  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box flexDirection="row" flexGrow={1}>
        {renderPanels()}
      </Box>
      {showStatusBar && <StatusBar />}
    </Box>
  );
};