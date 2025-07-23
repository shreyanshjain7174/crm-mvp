/**
 * Agent Marketplace API Routes
 * 
 * Provides endpoints for discovering, browsing, and searching available AI agents
 * in the marketplace. This is the core of our platform strategy - enabling
 * third-party agents to be discovered and installed by users.
 */

import '../types/fastify-extended.d'
import { FastifyPluginAsync } from 'fastify'
import { authenticate } from '../middleware/auth'
import { db } from '../db'

interface MarketplaceAgent {
  id: string
  agentId: string
  name: string
  version: string
  provider: {
    name: string
    website?: string
    verified: boolean
  }
  description: string
  category: string
  tags: string[]
  capabilities: string[]
  pricing: {
    model: 'free' | 'subscription' | 'usage' | 'freemium'
    price?: number
    currency?: string
    freeTrialDays?: number
  }
  stats: {
    installs: number
    rating: number
    reviews: number
  }
  requirements: {
    minPlanLevel?: string
    requiredFeatures?: string[]
  }
  screenshots?: string[]
  featured: boolean
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

interface MarketplaceFilters {
  category?: string
  search?: string
  pricing?: 'all' | 'free' | 'paid' | 'freemium'
  capabilities?: string[]
  featured?: boolean
  verified?: boolean
  sort?: 'popular' | 'newest' | 'rating' | 'name'
  limit?: number
  offset?: number
}

const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all available agents in marketplace
   * GET /api/marketplace/agents
   */
  fastify.get<{
    Querystring: MarketplaceFilters
    Reply: {
      success: boolean
      data?: MarketplaceAgent[]
      meta?: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
      }
      error?: string
    }
  }>('/agents', async (request, reply) => {
    const {
      category,
      search,
      pricing = 'all',
      capabilities,
      featured,
      verified,
      sort = 'popular',
      limit = 20,
      offset = 0
    } = request.query

    try {
      // Build query
      let query = `
        SELECT 
          ar.*,
          COUNT(DISTINCT ia.id) as install_count,
          COALESCE(AVG(reviews.rating), 0) as avg_rating,
          COUNT(DISTINCT reviews.id) as review_count
        FROM agent_registry ar
        LEFT JOIN installed_agents ia ON ia.agent_id = ar.agent_id
        LEFT JOIN agent_reviews reviews ON reviews.agent_id = ar.agent_id
        WHERE ar.status = 'active'
      `
      const params: any[] = []
      let paramIndex = 1

      // Apply filters
      if (category && category !== 'all') {
        query += ` AND ar.category = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      if (search) {
        query += ` AND (
          ar.name ILIKE $${paramIndex} OR 
          ar.description ILIKE $${paramIndex} OR
          ar.provider_name ILIKE $${paramIndex} OR
          ar.tags::text ILIKE $${paramIndex}
        )`
        params.push(`%${search}%`)
        paramIndex++
      }

      if (pricing !== 'all') {
        query += ` AND ar.pricing_model = $${paramIndex}`
        params.push(pricing)
        paramIndex++
      }

      if (capabilities && capabilities.length > 0) {
        query += ` AND ar.capabilities && $${paramIndex}::jsonb`
        params.push(JSON.stringify(capabilities))
        paramIndex++
      }

      if (featured !== undefined) {
        query += ` AND ar.featured = $${paramIndex}`
        params.push(featured)
        paramIndex++
      }

      if (verified !== undefined) {
        query += ` AND ar.verified = $${paramIndex}`
        params.push(verified)
        paramIndex++
      }

      // Group by for aggregates
      query += ` GROUP BY ar.id`

      // Apply sorting
      switch (sort) {
        case 'popular':
          query += ` ORDER BY install_count DESC, avg_rating DESC`
          break
        case 'newest':
          query += ` ORDER BY ar.created_at DESC`
          break
        case 'rating':
          query += ` ORDER BY avg_rating DESC, review_count DESC`
          break
        case 'name':
          query += ` ORDER BY ar.name ASC`
          break
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT ar.id) as total
        FROM agent_registry ar
        WHERE ar.status = 'active'
        ${params.length > 0 ? query.split('WHERE ar.status = \'active\'')[1].split('GROUP BY')[0] : ''}
      `
      const countResult = await db.query(countQuery, params)
      const total = parseInt(countResult.rows[0]?.total || '0')

      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      // Execute main query
      const result = await db.query(query, params)

      // Transform results
      const agents: MarketplaceAgent[] = result.rows.map(row => ({
        id: row.id,
        agentId: row.agent_id,
        name: row.name,
        version: row.version,
        provider: {
          name: row.provider_name,
          website: row.provider_website,
          verified: row.provider_verified || false
        },
        description: row.description,
        category: row.category,
        tags: row.tags || [],
        capabilities: row.capabilities || [],
        pricing: {
          model: row.pricing_model,
          price: row.price,
          currency: row.currency,
          freeTrialDays: row.free_trial_days
        },
        stats: {
          installs: parseInt(row.install_count || '0'),
          rating: parseFloat(row.avg_rating || '0'),
          reviews: parseInt(row.review_count || '0')
        },
        requirements: {
          minPlanLevel: row.min_plan_level,
          requiredFeatures: row.required_features || []
        },
        screenshots: row.screenshots || [],
        featured: row.featured || false,
        verified: row.verified || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      return reply.send({
        success: true,
        data: agents,
        meta: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit
        }
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch marketplace agents')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch marketplace agents'
      })
    }
  })

  /**
   * Get featured agents
   * GET /api/marketplace/featured
   */
  fastify.get<{
    Reply: {
      success: boolean
      data?: MarketplaceAgent[]
      error?: string
    }
  }>('/featured', async (request, reply) => {
    try {
      const query = `
        SELECT 
          ar.*,
          COUNT(DISTINCT ia.id) as install_count,
          COALESCE(AVG(reviews.rating), 0) as avg_rating,
          COUNT(DISTINCT reviews.id) as review_count
        FROM agent_registry ar
        LEFT JOIN installed_agents ia ON ia.agent_id = ar.agent_id
        LEFT JOIN agent_reviews reviews ON reviews.agent_id = ar.agent_id
        WHERE ar.status = 'active' AND ar.featured = true
        GROUP BY ar.id
        ORDER BY ar.featured_order ASC, install_count DESC
        LIMIT 6
      `

      const result = await db.query(query)
      
      const agents: MarketplaceAgent[] = result.rows.map(row => ({
        id: row.id,
        agentId: row.agent_id,
        name: row.name,
        version: row.version,
        provider: {
          name: row.provider_name,
          website: row.provider_website,
          verified: row.provider_verified || false
        },
        description: row.description,
        category: row.category,
        tags: row.tags || [],
        capabilities: row.capabilities || [],
        pricing: {
          model: row.pricing_model,
          price: row.price,
          currency: row.currency,
          freeTrialDays: row.free_trial_days
        },
        stats: {
          installs: parseInt(row.install_count || '0'),
          rating: parseFloat(row.avg_rating || '0'),
          reviews: parseInt(row.review_count || '0')
        },
        requirements: {
          minPlanLevel: row.min_plan_level,
          requiredFeatures: row.required_features || []
        },
        screenshots: row.screenshots || [],
        featured: true,
        verified: row.verified || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      return reply.send({
        success: true,
        data: agents
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch featured agents')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch featured agents'
      })
    }
  })

  /**
   * Get agent details
   * GET /api/marketplace/agents/:agentId
   */
  fastify.get<{
    Params: { agentId: string }
    Reply: {
      success: boolean
      data?: MarketplaceAgent & {
        fullDescription?: string
        changelog?: string
        documentation?: string
        configSchema?: any
      }
      error?: string
    }
  }>('/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params

    try {
      const query = `
        SELECT 
          ar.*,
          COUNT(DISTINCT ia.id) as install_count,
          COALESCE(AVG(reviews.rating), 0) as avg_rating,
          COUNT(DISTINCT reviews.id) as review_count
        FROM agent_registry ar
        LEFT JOIN installed_agents ia ON ia.agent_id = ar.agent_id
        LEFT JOIN agent_reviews reviews ON reviews.agent_id = ar.agent_id
        WHERE ar.agent_id = $1 AND ar.status = 'active'
        GROUP BY ar.id
      `

      const result = await db.query(query, [agentId])

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found'
        })
      }

      const row = result.rows[0]
      const agent = {
        id: row.id,
        agentId: row.agent_id,
        name: row.name,
        version: row.version,
        provider: {
          name: row.provider_name,
          website: row.provider_website,
          verified: row.provider_verified || false
        },
        description: row.description,
        fullDescription: row.full_description,
        changelog: row.changelog,
        documentation: row.documentation,
        configSchema: row.config_schema,
        category: row.category,
        tags: row.tags || [],
        capabilities: row.capabilities || [],
        pricing: {
          model: row.pricing_model,
          price: row.price,
          currency: row.currency,
          freeTrialDays: row.free_trial_days
        },
        stats: {
          installs: parseInt(row.install_count || '0'),
          rating: parseFloat(row.avg_rating || '0'),
          reviews: parseInt(row.review_count || '0')
        },
        requirements: {
          minPlanLevel: row.min_plan_level,
          requiredFeatures: row.required_features || []
        },
        screenshots: row.screenshots || [],
        featured: row.featured || false,
        verified: row.verified || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }

      return reply.send({
        success: true,
        data: agent
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to fetch agent details')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent details'
      })
    }
  })

  /**
   * Get agent categories
   * GET /api/marketplace/categories
   */
  fastify.get<{
    Reply: {
      success: boolean
      data?: Array<{
        id: string
        name: string
        description: string
        icon: string
        agentCount: number
      }>
      error?: string
    }
  }>('/categories', async (request, reply) => {
    try {
      const categories = [
        {
          id: 'whatsapp',
          name: 'WhatsApp',
          description: 'Agents for WhatsApp automation and messaging',
          icon: 'MessageSquare',
          agentCount: 0
        },
        {
          id: 'voice',
          name: 'Voice Agents',
          description: 'AI-powered voice call handling',
          icon: 'Phone',
          agentCount: 0
        },
        {
          id: 'data',
          name: 'Data & Analytics',
          description: 'Data enrichment and analytics agents',
          icon: 'BarChart3',
          agentCount: 0
        },
        {
          id: 'automation',
          name: 'Automation',
          description: 'Workflow and process automation',
          icon: 'Zap',
          agentCount: 0
        },
        {
          id: 'lead-gen',
          name: 'Lead Generation',
          description: 'Lead capture and qualification',
          icon: 'UserPlus',
          agentCount: 0
        },
        {
          id: 'support',
          name: 'Customer Support',
          description: 'Customer service automation',
          icon: 'Headphones',
          agentCount: 0
        }
      ]

      // Get agent counts per category
      const countQuery = `
        SELECT category, COUNT(*) as count
        FROM agent_registry
        WHERE status = 'active'
        GROUP BY category
      `
      const countResult = await db.query(countQuery)
      
      const counts = countResult.rows.reduce((acc, row) => {
        acc[row.category] = parseInt(row.count)
        return acc
      }, {} as Record<string, number>)

      // Update categories with counts
      const categoriesWithCounts = categories.map(cat => ({
        ...cat,
        agentCount: counts[cat.id] || 0
      }))

      return reply.send({
        success: true,
        data: categoriesWithCounts
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch categories')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories'
      })
    }
  })

  /**
   * Check if user can install an agent (authenticated route)
   * GET /api/marketplace/agents/:agentId/can-install
   */
  fastify.get<{
    Params: { agentId: string }
    Reply: {
      success: boolean
      data?: {
        canInstall: boolean
        reason?: string
        requiresUpgrade?: boolean
        alreadyInstalled?: boolean
      }
      error?: string
    }
  }>('/agents/:agentId/can-install', {
    preHandler: authenticate
  }, async (request, reply) => {
    const { agentId } = request.params
    const userId = (request.user as any)?.id || (request.user as any)?.userId

    try {
      // Check if agent exists
      const agentQuery = `
        SELECT pricing_model, min_plan_level, required_features
        FROM agent_registry
        WHERE agent_id = $1 AND status = 'active'
      `
      const agentResult = await db.query(agentQuery, [agentId])

      if (agentResult.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found'
        })
      }

      // Check if already installed
      const installedQuery = `
        SELECT id FROM installed_agents
        WHERE agent_id = $1 AND business_id = $2
      `
      const installedResult = await db.query(installedQuery, [agentId, userId])

      if (installedResult.rows.length > 0) {
        return reply.send({
          success: true,
          data: {
            canInstall: false,
            reason: 'Agent already installed',
            alreadyInstalled: true
          }
        })
      }

      // TODO: Check user's plan level and features
      // For now, allow all installations
      return reply.send({
        success: true,
        data: {
          canInstall: true
        }
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to check agent installation eligibility')
      return reply.status(500).send({
        success: false,
        error: 'Failed to check installation eligibility'
      })
    }
  })
}

export default marketplaceRoutes