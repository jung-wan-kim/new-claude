// MCP 서버 연결 테스트
import { EnhancedMCPManager } from '../mcp/EnhancedMCPManager';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

async function testMCPConnection() {
  console.log('=== MCP Connection Test ===\n');

  const mcpManager = new EnhancedMCPManager();

  try {
    // MCP 매니저 초기화
    console.log('1. Initializing MCP Manager...');
    await mcpManager.initialize();

    // 상태 확인
    const status = mcpManager.getStatus();
    console.log('\n2. MCP Manager Status:');
    console.log('   - Initialized:', status.initialized);
    console.log('   - TaskManager available:', status.services.taskManager);
    console.log('   - Context7 available:', status.services.context7);

    // TaskManager 테스트
    console.log('\n3. Testing TaskManager...');
    try {
      const { requestId } = mcpManager.taskManager.createRequest({
        originalRequest: 'Test task creation',
        tasks: [
          {
            title: 'Test Task 1',
            description: 'This is a test task',
          },
          {
            title: 'Test Task 2',
            description: 'Another test task',
          },
        ],
      });
      console.log('   ✓ Created request with ID:', requestId);

      // 요청 목록 확인
      const requests = mcpManager.taskManager.listRequests();
      console.log('   ✓ Total requests:', requests.length);
    } catch (error) {
      console.log('   ✗ TaskManager test failed:', error);
    }

    // Context7 테스트
    console.log('\n4. Testing Context7...');
    try {
      // 컨텍스트 생성
      const context = mcpManager.context7.create({
        title: 'Test Context',
        content: 'This is a test context entry',
        type: 'test',
        tags: ['test', 'mcp'],
      });
      console.log('   ✓ Created context with ID:', context.id);

      // 검색 테스트
      const searchResults = mcpManager.context7.search('test');
      console.log('   ✓ Search results:', searchResults.length);

      // 삭제
      mcpManager.context7.delete(context.id);
      console.log('   ✓ Deleted test context');
    } catch (error) {
      console.log('   ✗ Context7 test failed:', error);
    }

    console.log('\n5. Disconnecting...');
    await mcpManager.disconnect();
    console.log('   ✓ Disconnected successfully');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

// 테스트 실행
testMCPConnection().catch(console.error);
