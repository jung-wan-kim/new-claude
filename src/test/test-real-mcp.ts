// 실제 MCP 서버 연결 테스트
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testRealMCPConnection() {
  console.log('=== Real MCP Server Connection Test ===\n');

  // TaskManager 테스트
  console.log('1. Testing TaskManager Connection...');
  try {
    const taskManagerTransport = new StdioClientTransport({
      command: 'npx',
      args: [
        '-y',
        '@smithery/cli@latest',
        'run',
        '@kazuph/mcp-taskmanager',
        '--key',
        '3e7735c8-b9d5-45ec-a2da-4d5ca70dfc17',
      ],
    });

    const taskManagerClient = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await taskManagerClient.connect(taskManagerTransport);
    console.log('   ✓ TaskManager connected successfully');

    // 사용 가능한 도구 목록 확인
    const tools = await taskManagerClient.listTools();
    console.log('   ✓ Available tools:', tools.tools.map((t) => t.name).join(', '));

    // 연결 종료
    await taskManagerClient.close();
    console.log('   ✓ TaskManager disconnected');
  } catch (error) {
    console.error('   ✗ TaskManager connection failed:', error);
  }

  // Context7 테스트
  console.log('\n2. Testing Context7 Connection...');
  try {
    const context7Transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
    });

    const context7Client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await context7Client.connect(context7Transport);
    console.log('   ✓ Context7 connected successfully');

    // 사용 가능한 도구 목록 확인
    const tools = await context7Client.listTools();
    console.log('   ✓ Available tools:', tools.tools.map((t) => t.name).join(', '));

    // 연결 종료
    await context7Client.close();
    console.log('   ✓ Context7 disconnected');
  } catch (error) {
    console.error('   ✗ Context7 connection failed:', error);
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

// 테스트 실행
testRealMCPConnection().catch(console.error);
