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
  .action(async (options: { config?: string; mcp?: boolean }) => {
    const app = new ClaudeCodeController({
      configPath: options.config,
      enableMCP: options.mcp,
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
  .action(async () => {
    await import('./test/test-mcp-connection');
  });

program.parse(process.argv);
