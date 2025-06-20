#!/usr/bin/env node
import { program } from 'commander';
import * as dotenv from 'dotenv';
import { ClaudeCodeController } from './app/ClaudeCodeController';
import { version } from '../package.json';

// 환경 변수 로드
dotenv.config();

// CLI 명령어 설정
program
  .name('ccc')
  .description('Claude Code Controller - Terminal UI for intelligent task management')
  .version(version);

program
  .command('start', { isDefault: true })
  .description('Start the Claude Code Controller TUI')
  .option('-c, --config <path>', 'Config file path', '.ccc.config.json')
  .option('--no-mcp', 'Start without MCP servers')
  .option('-m, --mcp-mode <mode>', 'MCP mode: mock or real', 'mock')
  .action(async (options: { config?: string; mcp?: boolean; mcpMode?: string }) => {
    const app = new ClaudeCodeController({
      configPath: options.config,
      enableMCP: options.mcp,
      mcpMode: (options.mcpMode as 'mock' | 'real') || 'mock',
    });

    try {
      await app.start();
    } catch (error) {
      console.error('Failed to start:', error);
      process.exit(1);
    }
  });

program
  .command('test-mcp')
  .description('Test MCP server connections')
  .option('-m, --mode <mode>', 'Test mode: mock, real, or both', 'both')
  .action(async (options: { mode?: string }) => {
    process.argv[2] = options.mode || 'both';
    await import('./test/test-mcp-modes');
  });

program.parse(process.argv);
