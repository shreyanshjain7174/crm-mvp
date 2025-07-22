/**
 * Agent Monitoring Service Tests
 */

import { testDb } from '../setup'

// Mock the database before importing the service
jest.mock('../../src/db/index', () => ({
  db: {
    query: jest.fn(),
    end: jest.fn()
  }
}))

import { agentMonitoringService } from '../../src/services/agent-monitoring-service'
import { db } from '../../src/db/index'

// Get the mocked db functions
const mockDb = db as jest.Mocked<typeof db>

describe('Agent Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('recordHealthCheck', () => {
    it('should record health check successfully', async () => {
      const healthCheck = {
        agentId: 'test-agent',
        connectivity: 'pass' as const,
        authentication: 'pass' as const,
        dependencies: 'warning' as const,
        performance: 'pass' as const,
        details: { latency: 100 }
      }

      await agentMonitoringService.recordHealthCheck(healthCheck)

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_health_checks'),
        expect.arrayContaining([
          'test-agent',
          'pass',
          'pass', 
          'warning',
          'pass',
          expect.any(String)
        ])
      )
    })

    it('should handle health check errors gracefully', async () => {
      const healthCheck = {
        agentId: 'test-agent',
        connectivity: 'fail' as const,
        authentication: 'pass' as const,
        dependencies: 'pass' as const,
        performance: 'pass' as const,
        details: {}
      }

      mockDb.query.mockRejectedValueOnce(new Error('Database error'))

      await expect(agentMonitoringService.recordHealthCheck(healthCheck))
        .rejects.toThrow('Database error')
    })
  })

  describe('recordPerformanceMetrics', () => {
    it('should record performance metrics successfully', async () => {
      const metrics = {
        agentId: 'test-agent',
        businessId: 'test-business',
        successRate: 95.5,
        avgResponseTime: 1200,
        tasksCompleted: 50,
        tasksPerMinute: 2.5,
        errorRate: 4.5,
        uptime: 99.9,
        resourceUsage: {
          cpuUsage: 25.5,
          memoryUsage: 512,
          concurrentTasks: 3,
          maxConcurrentTasks: 10
        }
      }

      await agentMonitoringService.recordPerformanceMetrics(metrics)

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_performance_metrics'),
        expect.arrayContaining([
          'test-agent',
          'test-business',
          95.5,
          1200,
          50,
          2.5,
          4.5,
          99.9,
          expect.any(String)
        ])
      )
    })
  })

  describe('startTaskExecution', () => {
    it('should start task execution and return execution ID', async () => {
      const execution = {
        businessId: 'test-business',
        agentId: 'test-agent',
        taskType: 'process_message',
        input: { message: 'Hello world' },
        metadata: { priority: 'high' }
      }

      // Mock the database to return an ID
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 'execution-123' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      } as any)

      const executionId = await agentMonitoringService.startTaskExecution(execution)

      expect(executionId).toBe('execution-123')
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_task_executions'),
        expect.arrayContaining([
          'test-business',
          'test-agent',
          'process_message',
          'running',
          expect.any(String),
          expect.any(String)
        ])
      )
    })
  })

  describe('completeTaskExecution', () => {
    it('should complete task execution successfully', async () => {
      const executionId = 'execution-123'
      const result = {
        status: 'completed' as const,
        output: { result: 'success' }
      }

      // Mock getting start time
      mockDb.query.mockResolvedValueOnce({
        rows: [{ start_time: new Date('2024-07-22T10:00:00Z') }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as any)

      // Mock the update query
      mockDb.query.mockResolvedValueOnce({ 
        rows: [], 
        rowCount: 1, 
        command: 'UPDATE', 
        oid: 0, 
        fields: [] 
      } as any)

      await agentMonitoringService.completeTaskExecution(executionId, result)

      expect(mockDb.query).toHaveBeenCalledTimes(2)
      expect(mockDb.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE agent_task_executions'),
        expect.arrayContaining([
          'completed',
          expect.any(Date),
          expect.any(Number),
          expect.any(String),
          undefined,
          executionId
        ])
      )
    })

    it('should handle failed task execution', async () => {
      const executionId = 'execution-123'
      const result = {
        status: 'failed' as const,
        error: 'Task timeout'
      }

      mockDb.query.mockResolvedValueOnce({
        rows: [{ start_time: new Date('2024-07-22T10:00:00Z') }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      } as any)
      mockDb.query.mockResolvedValueOnce({ 
        rows: [], 
        rowCount: 1, 
        command: 'UPDATE', 
        oid: 0, 
        fields: [] 
      } as any)

      await agentMonitoringService.completeTaskExecution(executionId, result)

      expect(mockDb.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE agent_task_executions'),
        expect.arrayContaining([
          'failed',
          expect.any(Date),
          expect.any(Number),
          expect.any(String),
          'Task timeout',
          executionId
        ])
      )
    })
  })

  describe('getAgentMetrics', () => {
    it('should return agent metrics for business', async () => {
      const mockData = [
        {
          agent_id: 'test-agent',
          agent_name: 'Test Agent',
          agent_provider: 'test-provider',
          status: 'active',
          connectivity: 'pass',
          authentication: 'pass',
          dependencies: 'pass',
          performance: 'pass',
          success_rate: '95.5',
          avg_response_time: '1200',
          tasks_completed: '50',
          tasks_per_minute: '2.5',
          error_rate: '4.5',
          uptime: '99.9',
          resource_usage: '{"cpuUsage": 25.5}',
          running_tasks: '3',
          last_health_check: '2024-07-22T10:00:00Z'
        }
      ]

      mockDb.query.mockResolvedValueOnce({ 
        rows: mockData, 
        rowCount: mockData.length, 
        command: 'SELECT', 
        oid: 0, 
        fields: [] 
      } as any)

      const metrics = await agentMonitoringService.getAgentMetrics('test-business')

      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toEqual({
        id: 'test-agent',
        name: 'Test Agent',
        provider: 'test-provider',
        status: 'active',
        performance: {
          successRate: 95.5,
          avgResponseTime: 1200,
          tasksCompleted: 50,
          tasksPerMinute: 2.5,
          errorRate: 4.5,
          uptime: 99.9
        },
        resources: {
          cpuUsage: 25.5,
          concurrentTasks: 3
        },
        healthChecks: {
          connectivity: 'pass',
          authentication: 'pass',
          dependencies: 'pass',
          performance: 'pass'
        },
        lastHealthCheck: '2024-07-22T10:00:00Z'
      })
    })

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(agentMonitoringService.getAgentMetrics('test-business'))
        .rejects.toThrow('Database connection failed')
    })
  })

  describe('getRecentTaskExecutions', () => {
    it('should return recent task executions', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          business_id: 'test-business',
          agent_id: 'test-agent',
          agent_name: 'Test Agent',
          task_type: 'process_message',
          status: 'completed',
          start_time: '2024-07-22T10:00:00Z',
          end_time: '2024-07-22T10:01:00Z',
          duration: 60000,
          input: '{"message": "hello"}',
          output: '{"result": "success"}',
          error: null,
          metadata: '{"priority": "high"}'
        }
      ]

      mockDb.query.mockResolvedValueOnce({ 
        rows: mockTasks, 
        rowCount: mockTasks.length, 
        command: 'SELECT', 
        oid: 0, 
        fields: [] 
      } as any)

      const tasks = await agentMonitoringService.getRecentTaskExecutions('test-business', 10)

      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toEqual({
        id: 'task-1',
        businessId: 'test-business',
        agentId: 'test-agent',
        agentName: 'Test Agent',
        taskType: 'process_message',
        status: 'completed',
        startTime: '2024-07-22T10:00:00Z',
        endTime: '2024-07-22T10:01:00Z',
        duration: 60000,
        input: { message: 'hello' },
        output: { result: 'success' },
        error: null,
        metadata: { priority: 'high' }
      })
    })
  })
})