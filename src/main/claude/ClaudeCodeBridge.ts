import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';

export interface ClaudeCodeOptions {
  workingDirectory?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ClaudeCodeResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  duration: number;
}

export class ClaudeCodeBridge extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private claudeCodePath: string;

  constructor() {
    super();
    // Claude Code CLI 경로 설정
    this.claudeCodePath = process.env.CLAUDE_CODE_PATH || 'claude-code';
  }

  async execute(
    command: string,
    options: ClaudeCodeOptions = {}
  ): Promise<ClaudeCodeResult> {
    const startTime = Date.now();
    const processId = `${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
      const args = this.parseCommand(command);
      const spawnOptions = {
        cwd: options.workingDirectory || process.cwd(),
        env: { ...process.env, ...options.env },
        shell: true,
      };

      const claudeProcess = spawn(this.claudeCodePath, args, spawnOptions);
      this.processes.set(processId, claudeProcess);

      let output = '';
      let errorOutput = '';

      claudeProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        this.emit('output', { processId, data: chunk });
      });

      claudeProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        this.emit('error', { processId, data: chunk });
      });

      claudeProcess.on('close', (code) => {
        this.processes.delete(processId);
        const duration = Date.now() - startTime;

        const result: ClaudeCodeResult = {
          success: code === 0,
          output,
          error: errorOutput || undefined,
          exitCode: code || undefined,
          duration,
        };

        this.emit('complete', { processId, result });

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Claude Code exited with code ${code}: ${errorOutput}`));
        }
      });

      claudeProcess.on('error', (error) => {
        this.processes.delete(processId);
        const duration = Date.now() - startTime;

        const result: ClaudeCodeResult = {
          success: false,
          output,
          error: error.message,
          duration,
        };

        this.emit('error', { processId, error });
        reject(error);
      });

      // Timeout 처리
      if (options.timeout) {
        setTimeout(() => {
          if (this.processes.has(processId)) {
            claudeProcess.kill('SIGTERM');
            this.processes.delete(processId);
            reject(new Error(`Command timed out after ${options.timeout}ms`));
          }
        }, options.timeout);
      }
    });
  }

  executeStream(
    command: string,
    onData: (data: string) => void,
    options: ClaudeCodeOptions = {}
  ): string {
    const processId = `${Date.now()}-${Math.random()}`;
    const args = this.parseCommand(command);
    const spawnOptions = {
      cwd: options.workingDirectory || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: true,
    };

    const claudeProcess = spawn(this.claudeCodePath, args, spawnOptions);
    this.processes.set(processId, claudeProcess);

    claudeProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      onData(chunk);
      this.emit('stream', { processId, data: chunk });
    });

    claudeProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      onData(`[ERROR] ${chunk}`);
      this.emit('stream-error', { processId, data: chunk });
    });

    claudeProcess.on('close', (code) => {
      this.processes.delete(processId);
      this.emit('stream-complete', { processId, exitCode: code });
    });

    claudeProcess.on('error', (error) => {
      this.processes.delete(processId);
      onData(`[ERROR] ${error.message}`);
      this.emit('stream-error', { processId, error });
    });

    return processId;
  }

  async executeWithContext(
    command: string,
    context: string[],
    options: ClaudeCodeOptions = {}
  ): Promise<ClaudeCodeResult> {
    // 컨텍스트 파일들을 명령어에 포함
    const contextFiles = context.map((file) => `"${file}"`).join(' ');
    const fullCommand = `${contextFiles} ${command}`;
    
    return this.execute(fullCommand, options);
  }

  kill(processId: string): boolean {
    const process = this.processes.get(processId);
    if (process) {
      process.kill('SIGTERM');
      this.processes.delete(processId);
      return true;
    }
    return false;
  }

  killAll(): void {
    for (const [processId, process] of this.processes) {
      process.kill('SIGTERM');
      this.emit('killed', { processId });
    }
    this.processes.clear();
  }

  isRunning(processId: string): boolean {
    return this.processes.has(processId);
  }

  getActiveProcesses(): string[] {
    return Array.from(this.processes.keys());
  }

  private parseCommand(command: string): string[] {
    // 간단한 명령어 파싱 (더 복잡한 경우 shell-quote 라이브러리 사용 고려)
    return [command];
  }

  // 자주 사용하는 명령어 템플릿
  async runTask(task: string, files: string[] = []): Promise<ClaudeCodeResult> {
    const fileArgs = files.map(f => `"${f}"`).join(' ');
    const command = files.length > 0 ? `${fileArgs} "${task}"` : `"${task}"`;
    return this.execute(command);
  }

  async analyzeCode(files: string[]): Promise<ClaudeCodeResult> {
    return this.runTask("코드를 분석하고 개선사항을 제안해줘", files);
  }

  async generateTests(files: string[]): Promise<ClaudeCodeResult> {
    return this.runTask("이 코드에 대한 테스트를 작성해줘", files);
  }

  async refactorCode(files: string[], instructions: string): Promise<ClaudeCodeResult> {
    return this.runTask(`다음 지시사항에 따라 코드를 리팩토링해줘: ${instructions}`, files);
  }

  async fixErrors(errorLog: string): Promise<ClaudeCodeResult> {
    return this.execute(`"다음 에러를 수정해줘:\n${errorLog}"`);
  }
}