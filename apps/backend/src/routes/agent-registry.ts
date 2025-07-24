/**
 * Universal Agent Protocol - Agent Registry API
 * 
 * Handles agent discovery, registration, and capability management
 * for the Universal Agent Protocol ecosystem.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

// Registry Schemas
const registerAgentSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic versioning
  provider: z.string().min(1),
  description: z.string().optional(),
  manifest: z.object({
    protocol_version: z.string().default('1.0.0'),
    capabilities: z.array(z.string()),
    permissions: z.array(z.string()),
    data_types: z.array(z.string()),
    event_types: z.array(z.string()),
    ui_components: z.object({
      config_form: z.any().optional(),
      action_buttons: z.array(z.any()).optional(),
      data_displays: z.array(z.any()).optional()
    }).optional(),
    requirements: z.object({
      minimum_plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
      permissions: z.array(z.string()),
      resources: z.object({
        memory_mb: z.number().min(0).optional(),
        cpu_cores: z.number().min(0).optional(),
        storage_mb: z.number().min(0).optional()
      }).optional()
    }).optional()
  }),
  capabilities: z.array(z.string()),
  api_schema: z.object({
    endpoints: z.array(z.object({
      path: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      description: z.string(),
      parameters: z.any().optional(),
      response: z.any().optional()
    })).optional(),
    webhooks: z.array(z.object({
      event: z.string(),
      url: z.string(),
      method: z.enum(['POST', 'PUT']).default('POST')
    })).optional()
  }).optional()
});

const updateManifestSchema = z.object({
  manifest: registerAgentSchema.shape.manifest,
  capabilities: z.array(z.string()).optional(),
  api_schema: registerAgentSchema.shape.api_schema.optional()
});

const validateManifestSchema = z.object({
  manifest: registerAgentSchema.shape.manifest
});

export async function agentRegistryRoutes(fastify: FastifyInstance) {
  // Apply authentication to registry routes
  fastify.addHook('preHandler', authenticate);

  /**
   * Register Agent in Registry
   * POST /api/agents/registry/register
   * 
   * Registers a new agent type with its capabilities and manifest
   */
  fastify.post<{ Body: z.infer<typeof registerAgentSchema> }>('/register', async (request, reply) => {
    try {
      const data = registerAgentSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Check if agent already exists
      const existingResult = await fastify.db.query(`
        SELECT id FROM agent_registry 
        WHERE agent_id = $1 AND version = $2
      `, [data.agentId, data.version]);

      if (existingResult.rows.length > 0) {
        return reply.status(409).send({
          success: false,
          error: 'Agent version already registered'
        });
      }

      // Insert agent into registry
      const insertResult = await fastify.db.query(`
        INSERT INTO agent_registry (
          agent_id, name, version, provider, description,
          manifest, capabilities, api_schema, status, 
          created_at, updated_at, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
        RETURNING *
      `, [
        data.agentId,
        data.name,
        data.version,
        data.provider,
        data.description || '',
        JSON.stringify(data.manifest),
        JSON.stringify(data.capabilities),
        JSON.stringify(data.api_schema || {}),
        'active'
      ]);

      const registeredAgent = insertResult.rows[0];

      // Log registration
      logger.info('Agent registered in registry', {
        agentId: data.agentId,
        version: data.version,
        provider: data.provider,
        userId
      });

      // Emit registry event
      fastify.io.emit('agent-registered', {
        agentId: data.agentId,
        version: data.version,
        name: data.name,
        provider: data.provider,
        timestamp: new Date()
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: registeredAgent.id,
          agentId: registeredAgent.agent_id,
          name: registeredAgent.name,
          version: registeredAgent.version,
          provider: registeredAgent.provider,
          status: registeredAgent.status,
          publishedAt: registeredAgent.published_at
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid registration data',
          details: error.errors
        });
      }
      
      logger.error('Agent registration failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Registration failed'
      });
    }
  });

  /**
   * Update Agent Manifest
   * PUT /api/agents/registry/update/:agentId
   * 
   * Updates an existing agent's manifest and capabilities
   */
  fastify.put<{ 
    Params: { agentId: string },
    Body: z.infer<typeof updateManifestSchema> 
  }>('/update/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const data = updateManifestSchema.parse(request.body);
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Get latest version of agent
      const latestResult = await fastify.db.query(`
        SELECT * FROM agent_registry 
        WHERE agent_id = $1 
        ORDER BY version DESC 
        LIMIT 1
      `, [agentId]);

      if (latestResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found in registry'
        });
      }

      const agent = latestResult.rows[0];

      // Update manifest and capabilities
      const updateResult = await fastify.db.query(`
        UPDATE agent_registry 
        SET 
          manifest = $1,
          capabilities = COALESCE($2, capabilities),
          api_schema = COALESCE($3, api_schema),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [
        JSON.stringify(data.manifest),
        data.capabilities ? JSON.stringify(data.capabilities) : null,
        data.api_schema ? JSON.stringify(data.api_schema) : null,
        agent.id
      ]);

      const updatedAgent = updateResult.rows[0];

      // Log update
      logger.info('Agent manifest updated', {
        agentId,
        version: updatedAgent.version,
        userId
      });

      return reply.send({
        success: true,
        data: {
          id: updatedAgent.id,
          agentId: updatedAgent.agent_id,
          version: updatedAgent.version,
          updatedAt: updatedAgent.updated_at
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid update data',
          details: error.errors
        });
      }
      
      logger.error('Agent manifest update failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Update failed'
      });
    }
  });

  /**
   * Unregister Agent
   * DELETE /api/agents/registry/unregister/:agentId
   * 
   * Removes agent from registry (soft delete)
   */
  fastify.delete<{ Params: { agentId: string } }>('/unregister/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const userId = (request as any).user?.userId || (request as any).user?.id;

      // Soft delete by updating status
      const result = await fastify.db.query(`
        UPDATE agent_registry 
        SET status = 'disabled', updated_at = NOW()
        WHERE agent_id = $1
        RETURNING id, agent_id, version
      `, [agentId]);

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found in registry'
        });
      }

      // Log unregistration
      logger.info('Agent unregistered from registry', {
        agentId,
        userId
      });

      // Emit unregistration event
      fastify.io.emit('agent-unregistered', {
        agentId,
        timestamp: new Date()
      });

      return reply.send({
        success: true,
        data: {
          message: 'Agent unregistered successfully',
          agentId
        }
      });
    } catch (error) {
      logger.error('Agent unregistration failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Unregistration failed'
      });
    }
  });

  /**
   * Get Agent Capabilities
   * GET /api/agents/registry/capabilities/:agentId
   * 
   * Returns detailed capabilities and manifest for an agent
   */
  fastify.get<{ 
    Params: { agentId: string },
    Querystring: { version?: string }
  }>('/capabilities/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const { version } = request.query;

      let query = `
        SELECT * FROM agent_registry 
        WHERE agent_id = $1 AND status = 'active'
      `;
      const params = [agentId];

      if (version) {
        query += ` AND version = $2`;
        params.push(version);
      } else {
        query += ` ORDER BY version DESC LIMIT 1`;
      }

      const result = await fastify.db.query(query, params);

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found or inactive'
        });
      }

      const agent = result.rows[0];

      return reply.send({
        success: true,
        data: {
          agentId: agent.agent_id,
          name: agent.name,
          version: agent.version,
          provider: agent.provider,
          description: agent.description,
          manifest: JSON.parse(agent.manifest),
          capabilities: JSON.parse(agent.capabilities),
          apiSchema: JSON.parse(agent.api_schema || '{}'),
          status: agent.status,
          publishedAt: agent.published_at
        }
      });
    } catch (error) {
      logger.error('Failed to get agent capabilities:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve capabilities'
      });
    }
  });

  /**
   * Validate Agent Manifest
   * POST /api/agents/registry/validate-manifest
   * 
   * Validates agent manifest before registration
   */
  fastify.post<{ Body: z.infer<typeof validateManifestSchema> }>('/validate-manifest', async (request, reply) => {
    try {
      const { manifest } = validateManifestSchema.parse(request.body);

      // Perform additional validation
      const validationErrors = [];

      // Check capabilities are valid
      const validCapabilities = [
        'lead_management', 'message_handling', 'data_enrichment',
        'voice_calls', 'email_automation', 'scheduling', 'analytics'
      ];
      
      for (const capability of manifest.capabilities) {
        if (!validCapabilities.includes(capability)) {
          validationErrors.push(`Invalid capability: ${capability}`);
        }
      }

      // Check required permissions
      if (manifest.requirements?.permissions) {
        const validPermissions = [
          'contacts:read', 'contacts:write', 'messages:read', 'messages:write',
          'leads:read', 'leads:write', 'interactions:read', 'interactions:write'
        ];
        
        for (const permission of manifest.requirements.permissions) {
          if (!validPermissions.includes(permission)) {
            validationErrors.push(`Invalid permission: ${permission}`);
          }
        }
      }

      const isValid = validationErrors.length === 0;

      return reply.send({
        success: true,
        data: {
          valid: isValid,
          errors: validationErrors,
          manifest: manifest
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid manifest format',
          details: error.errors
        });
      }
      
      logger.error('Manifest validation failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Validation failed'
      });
    }
  });

  /**
   * Discover Available Agents
   * GET /api/agents/registry/discover
   * 
   * Returns list of available agents for integration
   */
  fastify.get<{
    Querystring: {
      category?: string;
      capability?: string;
      provider?: string;
      limit?: number;
      offset?: number;
    }
  }>('/discover', async (request, reply) => {
    try {
      const { capability, provider, limit = 50, offset = 0 } = request.query;

      let whereClause = `WHERE status = 'active'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (provider) {
        whereClause += ` AND provider = $${paramIndex}`;
        params.push(provider);
        paramIndex++;
      }

      if (capability) {
        whereClause += ` AND capabilities::text LIKE $${paramIndex}`;
        params.push(`%"${capability}"%`);
        paramIndex++;
      }

      const query = `
        SELECT DISTINCT ON (agent_id) 
          agent_id, name, version, provider, description,
          capabilities, published_at, status
        FROM agent_registry 
        ${whereClause}
        ORDER BY agent_id, version DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(Math.min(limit, 100), offset); // Cap at 100

      const result = await fastify.db.query(query, params);

      const agents = result.rows.map(row => ({
        agentId: row.agent_id,
        name: row.name,
        version: row.version,
        provider: row.provider,
        description: row.description,
        capabilities: JSON.parse(row.capabilities),
        publishedAt: row.published_at,
        status: row.status
      }));

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT agent_id) as total
        FROM agent_registry 
        ${whereClause}
      `;
      const countResult = await fastify.db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return reply.send({
        success: true,
        data: {
          agents,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      });
    } catch (error) {
      logger.error('Agent discovery failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Discovery failed'
      });
    }
  });
}

export default agentRegistryRoutes;