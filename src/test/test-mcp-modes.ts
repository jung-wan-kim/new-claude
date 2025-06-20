#!/usr/bin/env tsx

import { MCPManager } from '../mcp/MCPManager';

async function testMockMode() {
  console.log('\n=== Testing Mock Mode ===\n');

  const mcpManager = new MCPManager({ mode: 'mock' });

  try {
    // Initialize
    await mcpManager.initialize();
    console.log('Status:', mcpManager.getStatus());

    // Test TaskManager
    console.log('\n--- Testing TaskManager (Mock) ---');
    const request = await mcpManager.taskManager.createRequest({
      originalRequest: 'Test request',
      tasks: [
        { title: 'Task 1', description: 'Description 1' },
        { title: 'Task 2', description: 'Description 2' },
      ],
    });
    console.log('Created request:', request);

    const nextTask = await mcpManager.taskManager.getNextTask(request.requestId);
    console.log('Next task:', nextTask);

    const requests = await mcpManager.taskManager.listRequests();
    console.log('All requests:', requests);

    // Test Context7
    console.log('\n--- Testing Context7 (Mock) ---');
    const context = await mcpManager.context7.create({
      title: 'Test Context',
      content: 'This is a test context',
      tags: ['test', 'mock'],
    });
    console.log('Created context:', context);

    const searchResults = await mcpManager.context7.search('test');
    console.log('Search results:', searchResults);

    // Disconnect
    await mcpManager.disconnect();
    console.log('\nMock mode test completed successfully!');
  } catch (error) {
    console.error('Mock mode test failed:', error);
  }
}

async function testRealMode() {
  console.log('\n=== Testing Real Mode ===\n');
  console.log('NOTE: This test requires actual MCP servers to be available.');
  console.log('If the servers are not installed, the test will fail.\n');

  const mcpManager = new MCPManager({ mode: 'real' });

  try {
    // Initialize
    await mcpManager.initialize();
    console.log('Status:', mcpManager.getStatus());

    // Test TaskManager
    console.log('\n--- Testing TaskManager (Real) ---');
    const request = await mcpManager.taskManager.createRequest({
      originalRequest: 'Test request from real MCP',
      tasks: [
        { title: 'Real Task 1', description: 'Real Description 1' },
        { title: 'Real Task 2', description: 'Real Description 2' },
      ],
    });
    console.log('Created request:', request);

    const nextTask = await mcpManager.taskManager.getNextTask(request.requestId);
    console.log('Next task:', nextTask);

    const requests = await mcpManager.taskManager.listRequests();
    console.log('All requests:', requests);

    // Test Context7
    console.log('\n--- Testing Context7 (Real) ---');
    const context = await mcpManager.context7.create({
      title: 'Real Test Context',
      content: 'This is a real test context',
      tags: ['test', 'real', 'mcp'],
    });
    console.log('Created context:', context);

    const searchResults = await mcpManager.context7.search('test');
    console.log('Search results:', searchResults);

    // Disconnect
    await mcpManager.disconnect();
    console.log('\nReal mode test completed successfully!');
  } catch (error) {
    console.error('Real mode test failed:', error);
    console.error('\nMake sure the MCP servers are installed:');
    console.error('- npx @modelcontextprotocol/server-taskmanager');
    console.error('- npx @modelcontextprotocol/server-context7');
  }
}

async function main() {
  const mode = process.argv[2] || 'both';

  if (mode === 'mock' || mode === 'both') {
    await testMockMode();
  }

  if (mode === 'real' || mode === 'both') {
    await testRealMode();
  }

  console.log('\n=== All tests completed ===');
  process.exit(0);
}

// Run tests
main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
