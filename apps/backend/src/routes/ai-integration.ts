import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { z } from 'zod';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  triggerData: z.record(z.any()),
  leadId: z.string().optional()
});

const approveWorkflowSchema = z.object({
  executionId: z.string(),
  nodeId: z.string(),
  approved: z.boolean(),
  modifiedData: z.record(z.any()).optional()
});

export async function aiIntegrationRoutes(fastify: FastifyInstance) {
  // Execute workflow via AI service
  fastify.post<{ Body: z.infer<typeof executeWorkflowSchema> }>('/execute-workflow', async (request, reply) => {
    try {
      const data = executeWorkflowSchema.parse(request.body);
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/workflows/execute`, data);
      
      return response.data;
    } catch (error) {
      fastify.log.error('Error executing workflow:', error);
      if (axios.isAxiosError(error)) {
        reply.status(error.response?.status || 500).send({ 
          error: 'AI service error',
          details: error.response?.data 
        });
      } else {
        reply.status(500).send({ error: 'Failed to execute workflow' });
      }
    }
  });

  // Get active executions
  fastify.get('/active-executions', async (request, reply) => {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/workflows/executions/active`);
      return response.data;
    } catch (error) {
      fastify.log.error('Error fetching active executions:', error);
      reply.status(500).send({ error: 'Failed to fetch active executions' });
    }
  });

  // Approve workflow step
  fastify.post<{ Body: z.infer<typeof approveWorkflowSchema> }>('/approve-workflow', async (request, reply) => {
    try {
      const data = approveWorkflowSchema.parse(request.body);
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/workflows/approve`, data);
      
      // Emit real-time event
      fastify.io.emit('workflow:approved', {
        executionId: data.executionId,
        nodeId: data.nodeId,
        approved: data.approved
      });
      
      return response.data;
    } catch (error) {
      fastify.log.error('Error approving workflow:', error);
      reply.status(500).send({ error: 'Failed to approve workflow' });
    }
  });

  // Stop workflow execution
  fastify.delete<{ Params: { executionId: string } }>('/executions/:executionId', async (request, reply) => {
    try {
      const { executionId } = request.params;
      
      const response = await axios.delete(`${AI_SERVICE_URL}/api/workflows/executions/${executionId}`);
      
      return response.data;
    } catch (error) {
      fastify.log.error('Error stopping execution:', error);
      reply.status(500).send({ error: 'Failed to stop execution' });
    }
  });

  // Get workflow templates
  fastify.get('/templates', async (request, reply) => {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/workflows/templates`);
      return response.data;
    } catch (error) {
      fastify.log.error('Error fetching templates:', error);
      reply.status(500).send({ error: 'Failed to fetch templates' });
    }
  });

  // Trigger workflow for new lead
  fastify.post<{ Body: { leadId: string; workflowType?: string } }>('/trigger-lead-workflow', async (request, reply) => {
    try {
      const { leadId, workflowType = 'lead_qualification' } = request.body;
      
      // Get lead data
      const lead = await fastify.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          messages: { orderBy: { timestamp: 'desc' }, take: 5 },
          interactions: { orderBy: { createdAt: 'desc' }, take: 3 }
        }
      });

      if (!lead) {
        return reply.status(404).send({ error: 'Lead not found' });
      }

      // Prepare trigger data
      const triggerData = {
        trigger_type: 'lead_created',
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          status: lead.status,
          priority: lead.priority
        },
        recent_messages: lead.messages,
        recent_interactions: lead.interactions
      };

      // Execute workflow
      const response = await axios.post(`${AI_SERVICE_URL}/api/workflows/execute`, {
        workflowId: workflowType,
        triggerData,
        leadId
      });

      // Create interaction record
      await fastify.prisma.interaction.create({
        data: {
          leadId,
          type: 'STATUS_CHANGE',
          description: `AI workflow started: ${workflowType}`,
          completedAt: new Date()
        }
      });

      return response.data;
    } catch (error) {
      fastify.log.error('Error triggering lead workflow:', error);
      reply.status(500).send({ error: 'Failed to trigger workflow' });
    }
  });

  // AI agent direct execution
  fastify.post<{ Body: { agentType: string; leadId?: string; prompt: string; context?: any } }>('/execute-agent', async (request, reply) => {
    try {
      const { agentType, leadId, prompt, context } = request.body;
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/agents/execute`, {
        agentType,
        leadId,
        prompt,
        context
      });

      // Store AI suggestion if it's for a specific lead
      if (leadId && response.data.response) {
        await fastify.prisma.aiSuggestion.create({
          data: {
            leadId,
            type: 'MESSAGE',
            content: response.data.response,
            context: JSON.stringify(context || {}),
            confidence: response.data.confidence || 0.8,
            approved: false
          }
        });
      }

      return response.data;
    } catch (error) {
      fastify.log.error('Error executing agent:', error);
      reply.status(500).send({ error: 'Failed to execute agent' });
    }
  });

  // Health check for AI service
  fastify.get('/ai-health', async (request, reply) => {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
      return {
        ai_service: 'healthy',
        status: response.data
      };
    } catch (error) {
      return {
        ai_service: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}