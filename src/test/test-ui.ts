// UI 테스트를 위한 간단한 실행 스크립트
import { ClaudeCodeController } from '../app/ClaudeCodeController';

async function testUI() {
  console.log('Starting UI test...');

  const controller = new ClaudeCodeController({
    enableMCP: true,
  });

  try {
    await controller.start();
  } catch (error) {
    console.error('Error starting controller:', error);
    process.exit(1);
  }
}

testUI().catch(console.error);
