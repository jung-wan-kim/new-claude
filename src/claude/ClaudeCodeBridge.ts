import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface ClaudeCodeOptions {
  workingDirectory?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ClaudeCodeResult {
  output?: string;
  error?: string;
  exitCode?: number;
}

export class ClaudeCodeBridge extends EventEmitter {
  private currentProcess: ChildProcess | null = null;

  async execute(command: string, options: ClaudeCodeOptions = {}): Promise<ClaudeCodeResult> {
    return new Promise((resolve) => {
      const args = command.split(' ');
      const claudeCommand = args[0];
      const claudeArgs = args.slice(1);

      this.currentProcess = spawn('claude', [claudeCommand, ...claudeArgs], {
        cwd: options.workingDirectory || process.cwd(),
        env: { ...process.env, ...options.env },
        shell: true,
      });

      let output = '';
      let error = '';

      this.currentProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        this.emit('data', chunk);
      });

      this.currentProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        this.emit('error', chunk);
      });

      this.currentProcess.on('close', (code) => {
        this.currentProcess = null;
        resolve({
          output,
          error,
          exitCode: code || 0,
        });
      });

      // Timeout 처리
      if (options.timeout) {
        setTimeout(() => {
          if (this.currentProcess) {
            this.kill();
            resolve({
              error: 'Command timeout',
              exitCode: -1,
            });
          }
        }, options.timeout);
      }
    });
  }

  executeStream(command: string, onData: (data: string) => void, options: ClaudeCodeOptions = {}): ChildProcess {
    const args = command.split(' ');
    const claudeCommand = args[0];
    const claudeArgs = args.slice(1);

    this.currentProcess = spawn('claude', [claudeCommand, ...claudeArgs], {
      cwd: options.workingDirectory || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: true,
    });

    this.currentProcess.stdout?.on('data', (data) => {
      onData(data.toString());
    });

    this.currentProcess.stderr?.on('data', (data) => {
      onData(`Error: ${data.toString()}`);
    });

    return this.currentProcess;
  }

  kill(): boolean {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      return true;
    }
    return false;
  }

  isRunning(): boolean {
    return this.currentProcess !== null;
  }

  async executeCommand(command: string, options: ClaudeCodeOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const result = this.execute(command, options);
      
      result.then((res) => {
        if (res.exitCode === 0) {
          this.emit('command:completed', res);
          resolve();
        } else {
          const error = new Error(res.error || 'Command failed');
          this.emit('command:failed', error);
          reject(error);
        }
      }).catch((err) => {
        this.emit('command:failed', err);
        reject(err);
      });
    });
  }

  async cancelCurrentCommand(): Promise<void> {
    if (this.isRunning()) {
      this.kill();
      this.emit('command:cancelled');
    }
  }
}