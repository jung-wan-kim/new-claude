import { EnhancedMCPManager } from '../EnhancedMCPManager';
import { EventEmitter } from 'events';

// Mock MCP client
class MockMCPClient extends EventEmitter {
  connected = false;

  async initialize() {
    this.connected = true;
    return Promise.resolve();
  }

  async disconnect() {
    this.connected = false;
    return Promise.resolve();
  }

  async getStatus() {
    return { healthy: true };
  }
}

describe('EnhancedMCPManager', () => {
  let mcpManager: EnhancedMCPManager;

  beforeEach(() => {
    mcpManager = new EnhancedMCPManager({ initTimeout: 1000 });
  });

  afterEach(async () => {
    await mcpManager.disconnect();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await mcpManager.initialize();

      expect(mcpManager.isInitialized()).toBe(true);
      expect(mcpManager.getStatus().initialized).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      // Override taskManager to fail
      (mcpManager as any).servers.get('taskManager').client.initialize = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      await expect(mcpManager.initialize()).resolves.not.toThrow();

      const status = mcpManager.getStatus();
      expect(status.initialized).toBe(true); // Still initialized as servers are not required
    });

    it('should emit initialization event', async () => {
      const initListener = jest.fn();
      mcpManager.on('initialized', initListener);

      await mcpManager.initialize();

      expect(initListener).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          servers: expect.objectContaining({
            taskManager: { success: true },
            context7: { success: true },
          }),
        })
      );
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      await mcpManager.initialize();
    });

    it('should disconnect all servers', async () => {
      await mcpManager.disconnect();

      expect(mcpManager.isInitialized()).toBe(false);
      const status = mcpManager.getStatus();
      expect(status.services.taskManager).toBe(false);
      expect(status.services.context7).toBe(false);
    });

    it('should reconnect after disconnect', async () => {
      await mcpManager.disconnect();
      await mcpManager.reconnect();

      expect(mcpManager.isInitialized()).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should handle health check failures', (done) => {
      // Mock a server with health check
      const mockClient = new MockMCPClient();
      const serverState = {
        config: {
          name: 'test',
          client: mockClient,
          required: false,
          healthCheckInterval: 100,
        },
        client: mockClient,
        status: 'connected' as const,
        errorCount: 0,
      };

      (mcpManager as any).servers.set('test', serverState);

      // Make health check fail
      mockClient.getStatus = jest.fn().mockRejectedValue(new Error('Health check failed'));

      mcpManager.on('serverDisconnected', (name, error) => {
        expect(name).toBe('test');
        expect(error).toBeDefined();
        done();
      });

      // Start health check
      (mcpManager as any).startHealthCheck('test', serverState);
    });
  });

  describe('Detailed Status', () => {
    it('should provide detailed server status', async () => {
      await mcpManager.initialize();

      const detailedStatus = mcpManager.getDetailedStatus();

      expect(detailedStatus.initialized).toBe(true);
      expect(detailedStatus.servers).toHaveProperty('taskManager');
      expect(detailedStatus.servers).toHaveProperty('context7');
      expect(detailedStatus.servers.taskManager.status).toBe('connected');
      expect(detailedStatus.servers.context7.status).toBe('connected');
    });
  });

  describe('Error Handling', () => {
    it('should handle server not found', () => {
      expect(() => mcpManager.getServer('nonexistent')).toThrow('Unknown server: nonexistent');
    });

    it('should warn when accessing disconnected server', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await mcpManager.initialize();
      const serverState = (mcpManager as any).servers.get('taskManager');
      serverState.status = 'disconnected';

      mcpManager.getServer('taskManager');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server taskManager is not connected')
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
