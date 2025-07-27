import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/index';
import { createApiHelper, ApiTestHelper } from '../helpers/api';
import { createAuthenticatedUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

describe('Agent Runtime Routes', () => {
  let app: FastifyInstance;
  let api: ApiTestHelper;

  beforeAll(async () => {
    app = await buildApp();
    api = createApiHelper(app);
    // Wait for the app to be ready so agent runtime is initialized
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('POST /api/agents/runtime/execute', () => {
    it('should execute an agent with valid input', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create a test agent first
      const agentManifest = {
        id: 'test-agent-1',
        name: 'Test Agent',
        version: '1.0.0',
        description: 'A test agent for unit testing',
        author: 'Test Author',
        permissions: [{ resource: 'contacts', scope: 'read' }],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "Hello World", data: input });',
        triggers: []
      };

      await app.agentRuntime.installAgent(user.id, agentManifest);

      const response = await api.post('/api/agents/runtime/execute', {
        agentId: 'test-agent-1',
        input: { message: 'test' },
        trigger: 'manual'
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json.success).toBe(true);
      expect(response.json.data.executionId).toBeDefined();
      expect(response.json.data.status).toBe('started');
    });

    it('should validate required fields', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/agents/runtime/execute', {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toBe('Invalid request data');
    });

    it('should require authentication', async () => {
      const response = await api.post('/api/agents/runtime/execute', {
        agentId: 'test-agent',
        input: {}
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail for non-existent agent', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/agents/runtime/execute', {
        agentId: 'non-existent-agent',
        input: {}
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json.success).toBe(false);
    });
  });

  describe('POST /api/agents/runtime/install', () => {
    it('should install a valid agent manifest', async () => {
      const user = await createAuthenticatedUser(app);
      
      const manifest = {
        id: 'test-install-agent',
        name: 'Installation Test Agent',
        version: '1.0.0',
        description: 'Test agent for installation',
        author: 'Test Author',
        permissions: [{ resource: 'contacts', scope: 'read' }],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "Installed successfully" });',
        triggers: [{
          type: 'manual',
          condition: 'true',
          description: 'Manual trigger'
        }]
      };

      const response = await api.post('/api/agents/runtime/install', {
        manifest
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json.success).toBe(true);
      expect(response.json.data.agentId).toBe(manifest.id);
      expect(response.json.data.version).toBe(manifest.version);
    });

    it('should validate manifest structure', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/agents/runtime/install', {
        manifest: {
          id: 'invalid-agent'
          // Missing required fields
        }
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toBe('Invalid manifest data');
    });

    it('should validate resource limits', async () => {
      const user = await createAuthenticatedUser(app);
      
      const manifest = {
        id: 'invalid-limits-agent',
        name: 'Invalid Limits Agent',
        version: '1.0.0',
        description: 'Test agent with invalid limits',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 500000, // Too high
          memory: 512, // Too high
          maxAPICalls: 200 // Too high
        },
        code: 'module.exports = (input) => ({ result: "test" });'
      };

      const response = await api.post('/api/agents/runtime/install', {
        manifest
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.success).toBe(false);
    });
  });

  describe('GET /api/agents/runtime/executions/:executionId', () => {
    it('should return execution details for valid execution', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create and install agent
      const agentManifest = {
        id: 'execution-test-agent',
        name: 'Execution Test Agent',
        version: '1.0.0',
        description: 'Agent for execution testing',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "execution test" });',
        triggers: []
      };

      await app.agentRuntime.installAgent(user.id, agentManifest);
      const executionId = await app.agentRuntime.executeAgent(user.id, 'execution-test-agent', { test: true });

      const response = await api.get(`/api/agents/runtime/executions/${executionId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.id).toBe(executionId);
      expect(response.json.data.agentId).toBe('execution-test-agent');
      expect(response.json.data.userId).toBe(user.id);
    });

    it('should return 404 for non-existent execution', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/executions/non-existent-id', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toBe('Execution not found');
    });

    it('should deny access to other users executions', async () => {
      const user1 = await createAuthenticatedUser(app);
      const user2 = await createAuthenticatedUser(app);
      
      // Create agent for user1
      const agentManifest = {
        id: 'access-test-agent',
        name: 'Access Test Agent',
        version: '1.0.0',
        description: 'Agent for access testing',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "access test" });',
        triggers: []
      };

      await app.agentRuntime.installAgent(user1.id, agentManifest);
      const executionId = await app.agentRuntime.executeAgent(user1.id, 'access-test-agent', {});

      // Try to access with user2
      const response = await api.get(`/api/agents/runtime/executions/${executionId}`, {
        headers: {
          Authorization: `Bearer ${user2.token}`,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toBe('Access denied');
    });
  });

  describe('GET /api/agents/runtime/executions', () => {
    it('should return user executions list', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/executions', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.executions).toBeInstanceOf(Array);
      expect(response.json.data.total).toBeDefined();
    });

    it('should filter executions by agentId', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/executions?agentId=test-agent-123', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.executions).toBeInstanceOf(Array);
    });

    it('should respect limit parameter', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/executions?limit=10', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
    });
  });

  describe('POST /api/agents/runtime/executions/:executionId/stop', () => {
    it('should stop a running execution', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create long-running agent
      const agentManifest = {
        id: 'stop-test-agent',
        name: 'Stop Test Agent',
        version: '1.0.0',
        description: 'Agent for stop testing',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 60000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = async (input) => { await new Promise(resolve => setTimeout(resolve, 5000)); return { result: "done" }; };',
        triggers: []
      };

      await app.agentRuntime.installAgent(user.id, agentManifest);
      const executionId = await app.agentRuntime.executeAgent(user.id, 'stop-test-agent', {});

      // Wait a bit then stop
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await api.post(`/api/agents/runtime/executions/${executionId}/stop`, {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.status).toBe('stopped');
    });

    it('should return 404 for non-existent execution', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/agents/runtime/executions/non-existent/stop', {}, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json.success).toBe(false);
    });
  });

  describe('GET /api/agents/runtime/stats', () => {
    it('should return runtime statistics', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/stats', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.executions).toBeDefined();
      expect(response.json.data.sandboxes).toBeDefined();
      expect(response.json.data.uptime).toBeDefined();
      expect(response.json.data.memoryUsage).toBeDefined();
    });
  });

  describe('GET /api/agents/runtime/sandbox/status', () => {
    it('should return sandbox status', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/sandbox/status', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.activeSandboxCount).toBeDefined();
      expect(typeof response.json.data.activeSandboxCount).toBe('number');
    });
  });

  describe('POST /api/agents/runtime/test', () => {
    it('should test agent code in sandbox', async () => {
      const user = await createAuthenticatedUser(app);

      const testCode = 'module.exports = (input) => ({ result: "Test successful", input });';

      const response = await api.post('/api/agents/runtime/test', {
        code: testCode,
        input: { testData: 'hello' },
        permissions: [],
        resourceLimits: {
          timeout: 10000,
          memory: 64,
          maxAPICalls: 5
        }
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.result).toBeDefined();
      expect(response.json.data.executionSuccessful).toBeDefined();
      expect(response.json.data.resourceUsage).toBeDefined();
    });

    it('should validate code parameter', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.post('/api/agents/runtime/test', {
        input: { test: true }
        // Missing code
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toBe('Code is required and must be a string');
    });

    it('should handle code execution errors', async () => {
      const user = await createAuthenticatedUser(app);

      const badCode = 'module.exports = (input) => { throw new Error("Test error"); };';

      const response = await api.post('/api/agents/runtime/test', {
        code: badCode,
        input: {}
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.executionSuccessful).toBe(false);
      expect(response.json.data.error).toBeDefined();
    });
  });

  describe('GET /api/agents/runtime/executions/:executionId/logs', () => {
    it('should return execution logs', async () => {
      const user = await createAuthenticatedUser(app);
      
      // Create agent and execution
      const agentManifest = {
        id: 'logs-test-agent',
        name: 'Logs Test Agent',
        version: '1.0.0',
        description: 'Agent for logs testing',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "logs test" });',
        triggers: []
      };

      await app.agentRuntime.installAgent(user.id, agentManifest);
      const executionId = await app.agentRuntime.executeAgent(user.id, 'logs-test-agent', {});

      const response = await api.get(`/api/agents/runtime/executions/${executionId}/logs`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.logs).toBeInstanceOf(Array);
      expect(response.json.data.total).toBeDefined();
    });

    it('should filter logs by severity', async () => {
      const user = await createAuthenticatedUser(app);
      
      const agentManifest = {
        id: 'severity-test-agent',
        name: 'Severity Test Agent',
        version: '1.0.0',
        description: 'Agent for severity testing',
        author: 'Test Author',
        permissions: [],
        resourceLimits: {
          timeout: 30000,
          memory: 128,
          maxAPICalls: 10
        },
        code: 'module.exports = (input) => ({ result: "severity test" });',
        triggers: []
      };

      await app.agentRuntime.installAgent(user.id, agentManifest);
      const executionId = await app.agentRuntime.executeAgent(user.id, 'severity-test-agent', {});

      const response = await api.get(`/api/agents/runtime/executions/${executionId}/logs?severity=error`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
    });

    it('should deny access to other users execution logs', async () => {
      const user1 = await createAuthenticatedUser(app);
      const user2 = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/executions/fake-execution-id/logs', {
        headers: {
          Authorization: `Bearer ${user2.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json.success).toBe(false);
    });
  });

  describe('GET /api/agents/runtime/agents/:agentId/metrics', () => {
    it('should return agent performance metrics', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/agents/test-agent/metrics', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.metrics).toBeInstanceOf(Array);
      expect(response.json.data.period).toBeDefined();
      expect(response.json.data.agentId).toBe('test-agent');
    });

    it('should respect days parameter for metrics period', async () => {
      const user = await createAuthenticatedUser(app);

      const response = await api.get('/api/agents/runtime/agents/test-agent/metrics?days=30', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.success).toBe(true);
      expect(response.json.data.period).toBe('30 days');
    });
  });
});