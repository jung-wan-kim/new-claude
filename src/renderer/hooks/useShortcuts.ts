import { useInput } from 'ink';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useClaudeStore } from '../stores/claudeStore';
import { useLogStore } from '../stores/logStore';

export const useShortcuts = () => {
  const uiStore = useUIStore();
  const taskStore = useTaskStore();
  const claudeStore = useClaudeStore();
  const logStore = useLogStore();
  
  useInput((input, key) => {
    // Command/Control 키 조합
    if (key.meta || key.ctrl) {
      switch (input) {
        // 새 작업
        case 'n':
          // 새 작업 생성 다이얼로그 열기
          logStore.addLog({
            level: 'info',
            source: 'shortcuts',
            message: 'New task shortcut pressed',
          });
          break;
          
        // 작업 실행
        case '\r': // Enter
          const nextTask = taskStore.getNextTask();
          if (nextTask) {
            taskStore.startTask(nextTask.id);
          }
          break;
          
        // 작업 중지
        case '.':
          if (claudeStore.isExecuting) {
            claudeStore.stopExecution();
          }
          break;
          
        // 터미널 클리어
        case 'k':
          if (uiStore.activePanel === 'work') {
            claudeStore.clearOutput();
          } else if (uiStore.activePanel === 'logs') {
            logStore.clearLogs();
          }
          break;
          
        // 사이드바 토글
        case 'b':
          uiStore.toggleSidebar();
          break;
          
        // 컨텍스트 검색
        case 'f':
          uiStore.setActivePanel('context');
          // 검색 모드 활성화는 ContextPanel에서 처리
          break;
          
        // 빠른 명령
        case 'p':
          if (key.shift) {
            // Command palette 열기
            logStore.addLog({
              level: 'info',
              source: 'shortcuts',
              message: 'Command palette opened',
            });
          }
          break;
      }
    }
    
    // 레이아웃 전환 (L 키)
    if (input === 'l' && !key.meta && !key.ctrl) {
      const layouts = ['default', 'focus', 'compact'] as const;
      const currentIndex = layouts.indexOf(uiStore.layout);
      const nextIndex = (currentIndex + 1) % layouts.length;
      uiStore.setLayout(layouts[nextIndex]);
      
      logStore.addLog({
        level: 'info',
        source: 'ui',
        message: `Layout changed to ${layouts[nextIndex]}`,
      });
    }
    
    // 테마 전환 (T 키)
    if (input === 't' && !key.meta && !key.ctrl) {
      const themes = ['dark', 'light', 'high-contrast'] as const;
      const currentIndex = themes.indexOf(uiStore.theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      uiStore.setTheme(themes[nextIndex]);
      
      logStore.addLog({
        level: 'info',
        source: 'ui',
        message: `Theme changed to ${themes[nextIndex]}`,
      });
    }
  });
};