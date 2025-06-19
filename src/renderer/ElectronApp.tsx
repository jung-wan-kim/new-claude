import React from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useUIStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useClaudeStore } from './stores/claudeStore';
import { ElectronLayout } from './components/ElectronLayout';

export const ElectronApp: React.FC = () => {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = React.useState<Terminal | null>(null);
  
  const uiStore = useUIStore();
  const taskStore = useTaskStore();
  const claudeStore = useClaudeStore();
  
  React.useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          black: '#000000',
          red: '#f44747',
          green: '#608b4e',
          yellow: '#dcdcaa',
          blue: '#569cd6',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#d4d4d4',
          brightBlack: '#666666',
          brightRed: '#f44747',
          brightGreen: '#608b4e',
          brightYellow: '#dcdcaa',
          brightBlue: '#569cd6',
          brightMagenta: '#c678dd',
          brightCyan: '#56b6c2',
          brightWhite: '#ffffff',
        },
        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
        fontSize: 14,
        cursorBlink: true,
      });
      
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      
      term.open(terminalRef.current);
      fitAddon.fit();
      
      // 창 크기 변경 감지
      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);
      
      // IPC 통신 설정
      if (window.electronAPI) {
        // 터미널 출력 수신
        window.electronAPI.onTerminalOutput((data: string) => {
          term.write(data);
        });
        
        // 터미널 입력 전송
        term.onData((data) => {
          window.electronAPI.sendTerminalInput(data);
        });
      }
      
      setTerminal(term);
      
      // 스토어 초기화
      Promise.all([
        taskStore.initialize(),
        claudeStore.initialize(),
      ]).catch(console.error);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    }
  }, []);
  
  return <ElectronLayout terminal={terminal} />;
};