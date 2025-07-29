import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { workflowOrchestrator, WorkflowDefinition } from '../services/workflow-orchestrator';
import { n8nIntegration } from '../services/n8n-integration';
import { langGraphIntegration } from '../services/langgraph-integration';
import { cacheMiddleware, cacheKeyGenerators } from '../middleware/cache-middleware';
import { logger } from '../utils/logger';

interface CreateWorkflowRequest {
  name: string;
  description: string;
  type: 'n8n' | 'langgraph' | 'hybrid';
  triggers: any[];
  nodes: any[];
  edges: any[];
  settings?: any;
}

interface ExecuteWorkflowRequest {
  input?: Record<string, any>;
  triggeredBy?: string;
  config?: {
    streaming?: boolean;
    maxIterations?: number;
  };
}

export async function workflowRoutes(fastify: FastifyInstance) {
  
  // Get all workflows
  fastify.get('/', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache
        keyGenerator: cacheKeyGenerators.userWithQuery
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, status, tags } = request.query as any;
      
      const workflows = workflowOrchestrator.listWorkflows({
        type,
        status,
        tags: tags ? tags.split(',') : undefined
      });
      
      reply.send({
        success: true,
        workflows,
        total: workflows.length
      });
    } catch (error) {
      logger.error('Failed to list workflows:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to list workflows'
      });
    }
  });

  // Get workflow by ID
  fastify.get('/:id', {
    preHandler: [
      cacheMiddleware({
        ttl: 600, // 10 minutes cache
        keyGenerator: (req) => `workflow:${(req.params as any).id}`
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      const workflow = workflowOrchestrator.getWorkflow(id);
      if (!workflow) {
        reply.status(404).send({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }
      
      reply.send({
        success: true,
        workflow
      });
    } catch (error) {
      logger.error('Failed to get workflow:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get workflow'
      });
    }
  });

  // Create new workflow
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workflowData = request.body as CreateWorkflowRequest;
      
      // Validate required fields
      if (!workflowData.name?.trim()) {
        reply.status(400).send({
          success: false,
          error: 'Workflow name is required'
        });
        return;
      }
      
      if (!workflowData.type || !['n8n', 'langgraph', 'hybrid'].includes(workflowData.type)) {
        reply.status(400).send({
          success: false,
          error: 'Valid workflow type is required (n8n, langgraph, or hybrid)'
        });
        return;
      }

      // Create workflow definition
      const workflowDef: Omit<WorkflowDefinition, 'id' | 'metadata'> = {
        name: workflowData.name,
        description: workflowData.description || '',
        type: workflowData.type,
        status: 'draft',
        triggers: workflowData.triggers || [],
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        settings: {
          timeout: 300000, // 5 minutes default
          retryPolicy: {
            maxRetries: 3,
            backoffType: 'exponential',
            delay: 1000
          },
          errorHandling: 'stop',
          ...workflowData.settings
        }
      };

      const workflow = await workflowOrchestrator.createWorkflow(workflowDef);
      
      reply.status(201).send({
        success: true,
        workflow
      });
    } catch (error) {
      logger.error('Failed to create workflow:', error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create workflow'
      });
    }
  });

  // Execute workflow
  fastify.post('/:id/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { input = {}, triggeredBy = 'manual' } = request.body as ExecuteWorkflowRequest;
      
      const execution = await workflowOrchestrator.executeWorkflow(id, input, triggeredBy);
      
      reply.send({
        success: true,
        execution
      });
    } catch (error) {
      logger.error('Failed to execute workflow:', error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow'
      });
    }
  });

  // Get workflow executions
  fastify.get('/:id/executions', {
    preHandler: [
      cacheMiddleware({
        ttl: 60, // 1 minute cache for executions
        keyGenerator: (req) => `workflow_executions:${(req.params as any).id}`
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { limit = 50 } = request.query as any;
      
      const executions = workflowOrchestrator.listExecutions(id, parseInt(limit));
      
      reply.send({
        success: true,
        executions,
        total: executions.length
      });
    } catch (error) {
      logger.error('Failed to get workflow executions:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get workflow executions'
      });
    }
  });

  // Get execution by ID
  fastify.get('/executions/:id', {
    preHandler: [
      cacheMiddleware({
        ttl: 300, // 5 minutes cache
        keyGenerator: (req) => `execution:${(req.params as any).id}`
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      
      const execution = workflowOrchestrator.getExecution(id);
      if (!execution) {
        reply.status(404).send({
          success: false,
          error: 'Execution not found'
        });
        return;
      }
      
      reply.send({
        success: true,
        execution
      });
    } catch (error) {
      logger.error('Failed to get execution:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get execution'
      });
    }
  });

  // Get workflow statistics
  fastify.get('/stats', {
    preHandler: [
      cacheMiddleware({
        ttl: 180, // 3 minutes cache
        keyGenerator: () => 'workflow_stats'
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await workflowOrchestrator.getWorkflowStats();
      
      reply.send({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get workflow stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get workflow stats'
      });
    }
  });

  // Get workflow templates
  fastify.get('/templates', {
    preHandler: [
      cacheMiddleware({
        ttl: 3600, // 1 hour cache for templates
        keyGenerator: () => 'workflow_templates'
      })
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const templates = getWorkflowTemplates();
      
      reply.send({
        success: true,
        templates
      });
    } catch (error) {
      logger.error('Failed to get workflow templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get workflow templates'
      });
    }
  });

  // Health check for workflow engines
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [n8nHealth, langGraphHealth] = await Promise.all([
        n8nIntegration.getHealthStatus(),
        langGraphIntegration.getHealthStatus()
      ]);
      
      reply.send({
        success: true,
        health: {
          n8n: n8nHealth,
          langgraph: langGraphHealth,
          orchestrator: {
            initialized: true,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get workflow health:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get workflow health'
      });
    }
  });

  // Update workflow status (activate/deactivate)
  fastify.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { status } = request.body as any;
      
      if (!['active', 'inactive', 'draft'].includes(status)) {
        reply.status(400).send({
          success: false,
          error: 'Invalid status. Must be active, inactive, or draft'
        });
        return;
      }
      
      const workflow = workflowOrchestrator.getWorkflow(id);
      if (!workflow) {
        reply.status(404).send({
          success: false,
          error: 'Workflow not found'
        });
        return;
      }
      
      // Update workflow status
      workflow.status = status;
      workflow.metadata.updatedAt = new Date();
      
      // TODO: Update in storage and trigger engine updates
      
      reply.send({
        success: true,
        workflow
      });
    } catch (error) {
      logger.error('Failed to update workflow status:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update workflow status'
      });
    }
  });
}

/**
 * Get predefined workflow templates
 */
function getWorkflowTemplates(): any[] {
  return [
    {
      id: 'lead-nurturing-sequence',
      name: 'Lead Nurturing Sequence',
      description: 'Automated email sequence for new leads with AI personalization',
      type: 'hybrid',
      category: 'sales',
      difficulty: 'beginner',
      estimatedTime: '30 minutes',
      nodes: [
        {
          id: 'trigger',
          name: 'New Lead Trigger',
          type: 'trigger',
          engine: 'n8n',
          config: { event: 'lead_created' }
        },
        {
          id: 'ai_personalize',
          name: 'AI Personalization',
          type: 'ai',
          engine: 'langgraph',
          config: { 
            model: 'gpt-4',
            prompt: 'Personalize welcome message based on lead profile'
          }
        },
        {
          id: 'send_email',
          name: 'Send Welcome Email',
          type: 'action',
          engine: 'n8n',
          config: { service: 'email' }
        }
      ],
      benefits: [
        'Automated lead engagement',
        'AI-powered personalization',
        'Improved conversion rates'
      ]
    },
    {
      id: 'customer-support-bot',
      name: 'AI Customer Support Bot',
      description: 'Intelligent chatbot for handling customer inquiries',
      type: 'langgraph',
      category: 'support',
      difficulty: 'intermediate',
      estimatedTime: '45 minutes',
      nodes: [
        {
          id: 'message_trigger',
          name: 'Message Received',
          type: 'trigger',
          engine: 'langgraph',
          config: { channel: 'chat' }
        },
        {
          id: 'intent_analysis',
          name: 'Intent Analysis',
          type: 'ai',
          engine: 'langgraph',
          config: { 
            model: 'gpt-4',
            task: 'intent_classification'
          }
        },
        {
          id: 'generate_response',
          name: 'Generate Response',
          type: 'ai',
          engine: 'langgraph',
          config: { 
            model: 'gpt-4',
            task: 'response_generation'
          }
        }
      ],
      benefits: [
        '24/7 customer support',
        'Intelligent query routing',
        'Reduced response time'
      ]
    },
    {
      id: 'sales-pipeline-automation',
      name: 'Sales Pipeline Automation',
      description: 'Complete sales process automation with AI insights',
      type: 'hybrid',
      category: 'sales',
      difficulty: 'advanced',
      estimatedTime: '60 minutes',
      nodes: [
        {
          id: 'opportunity_created',
          name: 'Opportunity Created',
          type: 'trigger',
          engine: 'n8n',
          config: { event: 'opportunity_created' }
        },
        {
          id: 'ai_score',
          name: 'AI Lead Scoring',
          type: 'ai',
          engine: 'langgraph',
          config: { 
            model: 'gpt-4',
            task: 'lead_scoring'
          }
        },
        {
          id: 'route_to_sales',
          name: 'Route to Sales Rep',
          type: 'action',
          engine: 'n8n',
          config: { 
            service: 'crm',
            action: 'assign_lead'
          }
        },
        {
          id: 'follow_up_reminder',
          name: 'Follow-up Reminder',
          type: 'action',
          engine: 'n8n',
          config: { 
            service: 'calendar',
            delay: '2 days'
          }
        }
      ],
      benefits: [
        'Automated lead routing',
        'AI-powered scoring',
        'Improved sales efficiency'
      ]
    }
  ];
}