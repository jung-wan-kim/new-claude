import React, { useState, useEffect } from 'react';
import { Terminal } from 'xterm';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useClaudeStore } from '../stores/claudeStore';
import { useContextStore } from '../stores/contextStore';
import { useLogStore } from '../stores/logStore';
import './ElectronLayout.css';

interface ElectronLayoutProps {
  terminal: Terminal | null;
}

export const ElectronLayout: React.FC<ElectronLayoutProps> = ({ terminal }) => {
  const uiStore = useUIStore();
  const taskStore = useTaskStore();
  const claudeStore = useClaudeStore();
  const contextStore = useContextStore();
  const logStore = useLogStore();
  
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            uiStore.setActivePanel('tasks');
            break;
          case '2':
            e.preventDefault();
            uiStore.setActivePanel('work');
            break;
          case '3':
            e.preventDefault();
            uiStore.setActivePanel('context');
            break;
          case '4':
            e.preventDefault();
            uiStore.setActivePanel('logs');
            break;
          case 'n':
            e.preventDefault();
            // 새 작업 생성
            break;
          case 'k':
            e.preventDefault();
            if (terminal) terminal.clear();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [terminal]);
  
  const activeRequest = taskStore.requests.find(r => r.id === taskStore.activeRequestId);
  const tasks = activeRequest?.tasks || [];
  
  return (
    <div className={`electron-layout theme-${uiStore.theme} layout-${uiStore.layout}`}>
      <div className="header">
        <h1>Claude Code Controller</h1>
        <div className="status">
          {claudeStore.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
      
      <div className="main-content">
        {/* Tasks Panel */}
        <div className={`panel tasks-panel ${uiStore.activePanel === 'tasks' ? 'active' : ''}`}>
          <div className="panel-header">
            <h2>Tasks</h2>
            <button onClick={() => {/* 새 작업 */}}>+</button>
          </div>
          <div className="panel-content">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`task-item ${index === selectedTaskIndex ? 'selected' : ''} ${task.status}`}
                onClick={() => setSelectedTaskIndex(index)}
              >
                <span className="status-icon">
                  {task.status === 'completed' ? '✅' : 
                   task.status === 'in_progress' ? '🔄' : '⚪'}
                </span>
                <span className="task-title">{task.title}</span>
                <span className={`priority ${task.priority}`}>
                  {task.priority.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Work Area */}
        <div className={`panel work-panel ${uiStore.activePanel === 'work' ? 'active' : ''}`}>
          <div className="panel-header">
            <h2>Work Area</h2>
            <div className="work-controls">
              {claudeStore.isExecuting && (
                <button onClick={() => claudeStore.stopExecution()}>Stop</button>
              )}
            </div>
          </div>
          <div className="panel-content">
            <div ref={(el) => el && terminal && !el.hasChildNodes() && terminal.open(el)} />
          </div>
          <div className="command-input">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commandInput.trim()) {
                  claudeStore.executeCommand(commandInput);
                  setCommandInput('');
                }
              }}
              placeholder="Enter Claude command..."
              disabled={claudeStore.isExecuting}
            />
          </div>
        </div>
        
        {/* Context Panel */}
        <div className={`panel context-panel ${uiStore.activePanel === 'context' ? 'active' : ''}`}>
          <div className="panel-header">
            <h2>Context</h2>
            <button onClick={() => {/* 새 컨텍스트 */}}>+</button>
          </div>
          <div className="panel-content">
            {contextStore.contexts.map((context) => (
              <div
                key={context.id}
                className={`context-item ${context.id === contextStore.activeContextId ? 'active' : ''}`}
                onClick={() => contextStore.setActiveContext(context.id)}
              >
                <span className="type-icon">
                  {context.type === 'code' ? '📄' :
                   context.type === 'note' ? '📝' : '📋'}
                </span>
                <span className="context-title">{context.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Logs Panel */}
        <div className={`panel logs-panel ${uiStore.activePanel === 'logs' ? 'active' : ''}`}>
          <div className="panel-header">
            <h2>Logs</h2>
            <button onClick={() => logStore.clearLogs()}>Clear</button>
          </div>
          <div className="panel-content">
            {logStore.logs.map((log) => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                <span className="timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="level-icon">
                  {log.level === 'error' ? '❌' :
                   log.level === 'warn' ? '⚠️' :
                   log.level === 'info' ? 'ℹ️' : '🔍'}
                </span>
                <span className="source">{log.source}</span>
                <span className="message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="status-bar">
        <div className="left">
          <span>{uiStore.activePanel.toUpperCase()}</span>
          <span>•</span>
          <span>Layout: {uiStore.layout}</span>
        </div>
        <div className="center">
          <span>Tasks: {tasks.filter(t => t.status === 'completed').length}/{tasks.length}</span>
          <span>•</span>
          <span>{claudeStore.isExecuting ? '⚡ Running' : '💤 Idle'}</span>
        </div>
        <div className="right">
          <span>⌘Q Quit</span>
        </div>
      </div>
    </div>
  );
};