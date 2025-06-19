import React from 'react';
import { render } from 'ink';
import { App } from './App';

// Electron 렌더러 프로세스 진입점
if (typeof window !== 'undefined' && window.process?.type === 'renderer') {
  // Electron 환경에서는 DOM에 렌더링
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div id="terminal"></div>';
    // Ink는 터미널 환경이 필요하므로, Electron에서는 터미널 에뮬레이터 사용
    import('./ElectronApp').then(({ ElectronApp }) => {
      import('react-dom/client').then(({ createRoot }) => {
        const container = document.getElementById('terminal');
        if (container) {
          const root = createRoot(container);
          root.render(<ElectronApp />);
        }
      });
    });
  }
} else {
  // 개발 중 터미널에서 직접 실행할 때
  render(<App />);
}