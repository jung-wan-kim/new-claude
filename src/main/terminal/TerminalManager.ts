import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import * as os from 'os';

export interface Terminal {
  id: string;
  title: string;
  rows: number;
  cols: number;
  cwd: string;
  shell: string;
}

export interface TerminalData {
  id: string;
  data: string;
}

export class TerminalManager extends EventEmitter {
  private terminals: Map<string, pty.IPty> = new Map();
  private terminalInfo: Map<string, Terminal> = new Map();

  constructor() {
    super();
  }

  async createTerminal(options: {
    title?: string;
    cwd?: string;
    rows?: number;
    cols?: number;
    env?: Record<string, string>;
  } = {}): Promise<Terminal> {
    const id = `term-${Date.now()}-${Math.random()}`;
    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');
    
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: options.cols || 80,
      rows: options.rows || 24,
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
    });

    const terminal: Terminal = {
      id,
      title: options.title || `Terminal ${this.terminals.size + 1}`,
      rows: options.rows || 24,
      cols: options.cols || 80,
      cwd: options.cwd || process.cwd(),
      shell,
    };

    this.terminals.set(id, ptyProcess);
    this.terminalInfo.set(id, terminal);

    // 데이터 이벤트 처리
    ptyProcess.onData((data) => {
      this.emit('data', { id, data } as TerminalData);
    });

    // 종료 이벤트 처리
    ptyProcess.onExit(({ exitCode, signal }) => {
      this.terminals.delete(id);
      this.terminalInfo.delete(id);
      this.emit('exit', { id, exitCode, signal });
    });

    this.emit('created', terminal);
    return terminal;
  }

  write(id: string, data: string): boolean {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.write(data);
      return true;
    }
    return false;
  }

  resize(id: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(id);
    const info = this.terminalInfo.get(id);
    
    if (terminal && info) {
      terminal.resize(cols, rows);
      info.cols = cols;
      info.rows = rows;
      this.emit('resized', { id, cols, rows });
      return true;
    }
    return false;
  }

  kill(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.kill();
      this.terminals.delete(id);
      this.terminalInfo.delete(id);
      this.emit('killed', { id });
      return true;
    }
    return false;
  }

  killAll(): void {
    for (const [id, terminal] of this.terminals) {
      terminal.kill();
      this.emit('killed', { id });
    }
    this.terminals.clear();
    this.terminalInfo.clear();
  }

  getTerminal(id: string): Terminal | undefined {
    return this.terminalInfo.get(id);
  }

  getAllTerminals(): Terminal[] {
    return Array.from(this.terminalInfo.values());
  }

  isActive(id: string): boolean {
    return this.terminals.has(id);
  }

  // 특수 명령어 실행
  async runCommand(id: string, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.write(id, command + '\n')) {
        reject(new Error(`Terminal ${id} not found`));
        return;
      }

      // 명령어 실행 완료를 감지하기 위한 마커
      const marker = `\necho "COMMAND_COMPLETE_${Date.now()}"\n`;
      let buffer = '';
      
      const dataHandler = (data: TerminalData) => {
        if (data.id === id) {
          buffer += data.data;
          if (buffer.includes(`COMMAND_COMPLETE_`)) {
            this.removeListener('data', dataHandler);
            resolve();
          }
        }
      };

      this.on('data', dataHandler);
      
      // 타임아웃 처리
      setTimeout(() => {
        this.removeListener('data', dataHandler);
        resolve(); // 타임아웃이 되어도 resolve로 처리
      }, 30000); // 30초 타임아웃

      this.write(id, marker);
    });
  }

  // 작업 디렉토리 변경
  async changeDirectory(id: string, directory: string): Promise<void> {
    await this.runCommand(id, `cd "${directory}"`);
    const info = this.terminalInfo.get(id);
    if (info) {
      info.cwd = directory;
    }
  }

  // 환경 변수 설정
  async setEnvironmentVariable(id: string, name: string, value: string): Promise<void> {
    await this.runCommand(id, `export ${name}="${value}"`);
  }

  // Claude Code 실행을 위한 특수 터미널
  async createClaudeTerminal(): Promise<Terminal> {
    const terminal = await this.createTerminal({
      title: 'Claude Code',
      env: {
        ...process.env,
        CLAUDE_TERMINAL: 'true',
      },
    });

    // Claude Code에 필요한 환경 설정
    await this.setEnvironmentVariable(terminal.id, 'CLAUDE_CODE_CONTROLLER', 'true');
    
    return terminal;
  }
}