/**
 * Universal Agent Protocol - Event Broadcasting API
 * 
 * Handles real-time event distribution between agents and the CRM platform
 * for coordinated automation and data synchronization.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

// Event Schemas
const subscribeEventSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  eventTypes: z.array(z.string()),
  filters: z.record(z.any()).optional(),
  webhookUrl: z.string().url().optional(),
  deliveryMode: z.enum(['websocket', 'webhook', 'both']).default('websocket')
});

const publishCrmEventSchema = z.object({
  eventType: z.string(),
  data: z.object({
    entityType: z.enum(['contact', 'lead', 'message', 'interaction']),
    entityId: z.string(),
    action: z.enum(['created', 'updated', 'deleted']),
    payload: z.any(),
    metadata: z.record(z.any()).optional()
  }),
  targetAgents: z.array(z.string()).optional(), // Specific agents to notify
  source: z.string().default('crm')
});

const publishAgentEventSchema = z.object({
  agentId: z.string(),
  instanceId: z.string(),
  eventType: z.string(),
  data: z.object({
    action: z.string(),
    payload: z.any(),
    metadata: z.record(z.any()).optional()
  }),
  broadcast: z.boolean().default(false) // Whether to broadcast to other agents
});

export async function agentEventsRoutes(fastify: FastifyInstance) {
  // Apply authentication to event routes
  fastify.addHook('preHandler', authenticate);

  /**
   * Subscribe to Events
   * POST /api/agents/events/subscribe
   * 
   * Agent subscribes to specific event types with optional filters
   */
  fastify.post<{ Body: z.infer<typeof subscribeEventSchema> }>('/subscribe', async (request, reply) => {
    try {
      const data = subscribeEventSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent exists
      const agentResult = await fastify.db.query(`
        SELECT id FROM agent_installations 
        WHERE id = $1 AND user_id = $2
      `, [data.agentId, userId]);

      if (agentResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      // Create or update subscriptions for each event type
      const subscriptions = [];
      
      for (const eventType of data.eventTypes) {
        const result = await fastify.db.query(`
          INSERT INTO agent_event_subscriptions (
            agent_installation_id, event_type, filters, webhook_url, is_active
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (agent_installation_id, event_type) 
          DO UPDATE SET 
            filters = EXCLUDED.filters,
            webhook_url = EXCLUDED.webhook_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
          RETURNING *
        `, [
          data.agentId,
          eventType,
          JSON.stringify(data.filters || {}),
          data.webhookUrl,
          true
        ]);

        subscriptions.push(result.rows[0]);
      }

      // Join WebSocket room for real-time events
      if (data.deliveryMode === 'websocket' || data.deliveryMode === 'both') {
        const roomName = `agent-events-${data.agentId}`;
        // Note: WebSocket room joining would be handled by Socket.io connection handler
        fastify.io.emit('agent-subscription-created', {
          agentId: data.agentId,
          instanceId: data.instanceId,
          eventTypes: data.eventTypes,
          roomName
        });
      }

      // Log subscription
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        data.agentId,
        'Event subscriptions created',
        JSON.stringify({ eventTypes: data.eventTypes, deliveryMode: data.deliveryMode })
      ]);

      return reply.send({
        success: true,
        data: {
          subscriptions: subscriptions.map(sub => ({
            id: sub.id,
            eventType: sub.event_type,
            filters: JSON.parse(sub.filters || '{}'),
            webhookUrl: sub.webhook_url,
            createdAt: sub.created_at
          })),
          deliveryMode: data.deliveryMode,
          roomName: data.deliveryMode !== 'webhook' ? `agent-events-${data.agentId}` : undefined
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid subscription data',
          details: error.errors
        });
      }
      
      logger.error('Event subscription failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Subscription failed'
      });
    }
  });

  /**
   * Unsubscribe from Events
   * POST /api/agents/events/unsubscribe/:agentId
   * 
   * Remove agent's event subscriptions
   */
  fastify.post<{ 
    Params: { agentId: string },
    Body: { eventTypes?: string[], instanceId: string }
  }>('/unsubscribe/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const { eventTypes, instanceId } = request.body;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent ownership
      const agentResult = await fastify.db.query(`
        SELECT id FROM agent_installations 
        WHERE id = $1 AND user_id = $2
      `, [agentId, userId]);

      if (agentResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      let query = `
        UPDATE agent_event_subscriptions 
        SET is_active = false, updated_at = NOW()
        WHERE agent_installation_id = $1
      `;
      const params = [agentId];

      if (eventTypes && eventTypes.length > 0) {
        query += ` AND event_type = ANY($2::text[])`;
        params.push(eventTypes as any);
      }

      query += ` RETURNING event_type`;

      const result = await fastify.db.query(query, params);
      const unsubscribedTypes = result.rows.map(row => row.event_type);

      // Leave WebSocket rooms
      fastify.io.emit('agent-subscription-removed', {
        agentId,
        instanceId,
        eventTypes: unsubscribedTypes
      });

      // Log unsubscription
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        agentId,
        'Event subscriptions removed',
        JSON.stringify({ eventTypes: unsubscribedTypes })
      ]);

      return reply.send({
        success: true,
        data: {
          unsubscribedTypes,
          message: `Unsubscribed from ${unsubscribedTypes.length} event types`
        }
      });
    } catch (error) {
      logger.error('Event unsubscription failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Unsubscription failed'
      });
    }
  });

  /**
   * Publish CRM Event
   * POST /api/agents/events/publish/crm
   * 
   * Platform publishes CRM event to subscribed agents
   */
  fastify.post<{ Body: z.infer<typeof publishCrmEventSchema> }>('/publish/crm', async (request, reply) => {
    try {
      const eventData = publishCrmEventSchema.parse(request.body);

      // Get subscribed agents
      let subscriptionQuery = `
        SELECT aes.*, ai.name as agent_name
        FROM agent_event_subscriptions aes
        JOIN agent_installations ai ON aes.agent_installation_id = ai.id
        WHERE aes.event_type = $1 AND aes.is_active = true
      `;
      const params = [eventData.eventType];

      if (eventData.targetAgents && eventData.targetAgents.length > 0) {
        subscriptionQuery += ` AND aes.agent_installation_id = ANY($2::text[])`;
        params.push(eventData.targetAgents as any);
      }

      const subscriptionResult = await fastify.db.query(subscriptionQuery, params);
      const subscriptions = subscriptionResult.rows;

      if (subscriptions.length === 0) {
        return reply.send({
          success: true,
          data: {
            published: true,
            deliveries: 0,
            message: 'No agents subscribed to this event type'
          }
        });
      }

      // Create event record
      const eventRecord = await fastify.db.query(`
        INSERT INTO agent_protocol_events (
          event_type, direction, payload, source, status, created_at
        ) VALUES ($1, 'outbound', $2, $3, 'pending', NOW())
        RETURNING *
      `, [
        eventData.eventType,
        JSON.stringify({
          ...eventData.data,
          timestamp: new Date().toISOString(),
          source: eventData.source
        }),
        'crm'
      ]);

      const event = eventRecord.rows[0];
      const deliveries = [];

      // Deliver to each subscribed agent
      for (const subscription of subscriptions) {
        try {
          // Check if event matches filters
          const filters = JSON.parse(subscription.filters || '{}');
          if (!matchesFilters(eventData.data, filters)) {
            continue;
          }

          // WebSocket delivery
          const roomName = `agent-events-${subscription.agent_installation_id}`;
          fastify.io.to(roomName).emit('crm-event', {
            eventId: event.id,
            eventType: eventData.eventType,
            data: eventData.data,
            timestamp: new Date().toISOString()
          });

          // Webhook delivery (if configured)
          if (subscription.webhook_url) {
            await deliverWebhook(
              subscription.webhook_url,
              {
                eventId: event.id,
                eventType: eventData.eventType,
                data: eventData.data,
                timestamp: new Date().toISOString()
              },
              fastify.db,
              subscription.id
            );
          }

          deliveries.push({
            agentId: subscription.agent_installation_id,
            agentName: subscription.agent_name,
            deliveryMethod: subscription.webhook_url ? 'webhook+websocket' : 'websocket'
          });
        } catch (deliveryError) {
          logger.error(`Failed to deliver event to agent ${subscription.agent_installation_id}:`, deliveryError);
        }
      }

      // Update event status
      await fastify.db.query(`
        UPDATE agent_protocol_events 
        SET status = 'delivered', processed_at = NOW()
        WHERE id = $1
      `, [event.id]);

      return reply.send({
        success: true,
        data: {
          eventId: event.id,
          published: true,
          deliveries: deliveries.length,
          subscribers: deliveries
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid event data',
          details: error.errors
        });
      }
      
      logger.error('CRM event publishing failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Event publishing failed'
      });
    }
  });

  /**
   * Publish Agent Event
   * POST /api/agents/events/publish/agent
   * 
   * Agent publishes event to CRM and optionally to other agents
   */
  fastify.post<{ Body: z.infer<typeof publishAgentEventSchema> }>('/publish/agent', async (request, reply) => {
    try {
      const eventData = publishAgentEventSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent exists and is active
      const agentResult = await fastify.db.query(`
        SELECT ai.*, ass.status as session_status
        FROM agent_installations ai
        LEFT JOIN agent_sessions ass ON ai.id = ass.agent_installation_id
        WHERE ai.id = $1 AND ai.user_id = $2
      `, [eventData.agentId, userId]);

      if (agentResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      const agent = agentResult.rows[0];

      // Create event record
      const eventRecord = await fastify.db.query(`
        INSERT INTO agent_protocol_events (
          agent_installation_id, event_type, direction, payload, 
          source, status, created_at
        ) VALUES ($1, $2, 'inbound', $3, $4, 'pending', NOW())
        RETURNING *
      `, [
        eventData.agentId,
        eventData.eventType,
        JSON.stringify({
          ...eventData.data,
          timestamp: new Date().toISOString(),
          instanceId: eventData.instanceId
        }),
        `agent:${eventData.agentId}`
      ]);

      const event = eventRecord.rows[0];

      // Emit to CRM WebSocket listeners
      fastify.io.emit('agent-event', {
        eventId: event.id,
        agentId: eventData.agentId,
        agentName: agent.name,
        eventType: eventData.eventType,
        data: eventData.data,
        timestamp: new Date().toISOString()
      });

      // Broadcast to other agents if requested
      if (eventData.broadcast) {
        const otherAgentsResult = await fastify.db.query(`
          SELECT aes.agent_installation_id, ai.name
          FROM agent_event_subscriptions aes
          JOIN agent_installations ai ON aes.agent_installation_id = ai.id
          WHERE aes.event_type = $1 
            AND aes.is_active = true 
            AND aes.agent_installation_id != $2
        `, [eventData.eventType, eventData.agentId]);

        for (const otherAgent of otherAgentsResult.rows) {
          const roomName = `agent-events-${otherAgent.agent_installation_id}`;
          fastify.io.to(roomName).emit('agent-broadcast', {
            eventId: event.id,
            sourceAgentId: eventData.agentId,
            sourceAgentName: agent.name,
            eventType: eventData.eventType,
            data: eventData.data,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update event status
      await fastify.db.query(`
        UPDATE agent_protocol_events 
        SET status = 'delivered', processed_at = NOW()
        WHERE id = $1
      `, [event.id]);

      // Log event
      await fastify.db.query(`
        INSERT INTO agent_logs (
          id, agent_installation_id, timestamp, level, message, context, created_at
        ) VALUES (gen_random_uuid(), $1, NOW(), 'info', $2, $3, NOW())
      `, [
        eventData.agentId,
        `Published event: ${eventData.eventType}`,
        JSON.stringify({ eventId: event.id, broadcast: eventData.broadcast })
      ]);

      return reply.send({
        success: true,
        data: {
          eventId: event.id,
          published: true,
          broadcast: eventData.broadcast,
          message: 'Event published successfully'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid event data',
          details: error.errors
        });
      }
      
      logger.error('Agent event publishing failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Event publishing failed'
      });
    }
  });

  /**
   * Get Event History
   * GET /api/agents/events/history/:agentId
   * 
   * Retrieve event history for an agent
   */
  fastify.get<{
    Params: { agentId: string },
    Querystring: {
      eventType?: string;
      direction?: 'inbound' | 'outbound';
      limit?: number;
      offset?: number;
      from?: string;
      to?: string;
    }
  }>('/history/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const { eventType, direction, limit = 50, offset = 0, from, to } = request.query;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Verify agent access
      const agentResult = await fastify.db.query(`
        SELECT id FROM agent_installations 
        WHERE id = $1 AND user_id = $2
      `, [agentId, userId]);

      if (agentResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or access denied'
        });
      }

      // Build query
      let whereClause = 'WHERE agent_installation_id = $1';
      const params = [agentId];
      let paramIndex = 2;

      if (eventType) {
        whereClause += ` AND event_type = $${paramIndex}`;
        params.push(eventType);
        paramIndex++;
      }

      if (direction) {
        whereClause += ` AND direction = $${paramIndex}`;
        params.push(direction);
        paramIndex++;
      }

      if (from) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(from);
        paramIndex++;
      }

      if (to) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(to);
        paramIndex++;
      }

      const query = `
        SELECT * FROM agent_protocol_events 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(Math.min(limit, 500).toString(), offset.toString());

      const result = await fastify.db.query(query, params);

      const events = result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        direction: row.direction,
        payload: JSON.parse(row.payload),
        source: row.source,
        destination: row.destination,
        status: row.status,
        createdAt: row.created_at,
        processedAt: row.processed_at,
        errorMessage: row.error_message
      }));

      return reply.send({
        success: true,
        data: {
          events,
          pagination: {
            limit,
            offset,
            total: events.length
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get event history:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve event history'
      });
    }
  });
}

// Helper functions
function matchesFilters(eventData: any, filters: Record<string, any>): boolean {
  if (Object.keys(filters).length === 0) return true;

  for (const [key, value] of Object.entries(filters)) {
    if (eventData[key] !== value) {
      return false;
    }
  }
  return true;
}

async function deliverWebhook(
  url: string, 
  payload: any, 
  db: any, 
  subscriptionId: string
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Agent-Platform/1.0'
      },
      body: JSON.stringify(payload)
    });

    // Log webhook delivery
    await db.query(`
      INSERT INTO agent_webhook_deliveries (
        webhook_id, url, payload, response_status, 
        status, created_at, delivered_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      subscriptionId,
      url,
      JSON.stringify(payload),
      response.status,
      response.ok ? 'delivered' : 'failed'
    ]);
  } catch (error) {
    logger.error(`Webhook delivery failed for ${url}:`, error);
    
    // Log failed delivery
    await db.query(`
      INSERT INTO agent_webhook_deliveries (
        webhook_id, url, payload, status, 
        error_message, created_at
      ) VALUES ($1, $2, $3, 'failed', $4, NOW())
    `, [
      subscriptionId,
      url,
      JSON.stringify(payload),
      error instanceof Error ? error.message : 'Unknown error'
    ]);
  }
}

export default agentEventsRoutes;