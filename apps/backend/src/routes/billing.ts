/**
 * Billing API Routes
 * 
 * Provides REST endpoints for agent billing, usage tracking, and cost management.
 */

import '../types/fastify-extended'
import { FastifyPluginAsync } from 'fastify'
import { billingService } from '../services/billing-service'
import { authenticate } from '../middleware/auth'

const billingRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all billing routes
  fastify.addHook('preHandler', authenticate)

  /**
   * Get billing summary for the business
   * GET /api/billing/summary
   */
  fastify.get<{
    Querystring: { 
      period?: string // YYYY-MM-DD format
    }
    Reply: {
      success: boolean
      data?: Array<{
        businessId: string
        agentId: string
        agentName: string
        totalCost: number
        usageSummary: Record<string, number>
        eventsCount: number
        period: string
      }>
      meta?: {
        totalCost: number
        period: string
        currency: string
      }
      error?: string
    }
  }>('/summary', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { period } = request.query

    try {
      const periodDate = period ? new Date(period) : undefined
      const summary = await billingService.getBillingSummary(userId, periodDate)
      
      const totalCost = summary.reduce((sum, item) => sum + item.totalCost, 0)
      
      return reply.send({
        success: true,
        data: summary,
        meta: {
          totalCost,
          period: summary[0]?.period || new Date().toISOString().split('T')[0],
          currency: 'INR'
        }
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch billing summary')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch billing summary'
      })
    }
  })

  /**
   * Record a usage event
   * POST /api/billing/usage
   */
  fastify.post<{
    Body: {
      agentId: string
      eventType: string
      eventData?: Record<string, any>
      usageAmount: number
      usageUnit: string
      timestamp?: string
    }
    Reply: {
      success: boolean
      message?: string
      error?: string
    }
  }>('/usage', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { agentId, eventType, eventData, usageAmount, usageUnit, timestamp } = request.body

    if (!agentId || !eventType || typeof usageAmount !== 'number' || !usageUnit) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: agentId, eventType, usageAmount, usageUnit'
      })
    }

    try {
      await billingService.recordUsageEvent({
        businessId: userId,
        agentId,
        eventType,
        eventData,
        usageAmount,
        usageUnit,
        timestamp: timestamp ? new Date(timestamp) : undefined
      })

      return reply.send({
        success: true,
        message: 'Usage event recorded successfully'
      })
    } catch (error) {
      request.log.error({ error, agentId, eventType }, 'Failed to record usage event')
      return reply.status(500).send({
        success: false,
        error: 'Failed to record usage event'
      })
    }
  })

  /**
   * Get cost estimate for projected usage
   * POST /api/billing/estimate
   */
  fastify.post<{
    Body: {
      agentId: string
      projectedUsage: Array<{
        unit: string
        amount: number
      }>
    }
    Reply: {
      success: boolean
      data?: {
        baseCost: number
        freeTierDeduction: number
        finalCost: number
        usageBreakdown: Array<{
          unit: string
          amount: number
          rate: number
          cost: number
        }>
        currency: string
      }
      error?: string
    }
  }>('/estimate', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { agentId, projectedUsage } = request.body

    if (!agentId || !Array.isArray(projectedUsage)) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: agentId, projectedUsage'
      })
    }

    try {
      const estimate = await billingService.calculateCostEstimate(userId, agentId, projectedUsage)

      return reply.send({
        success: true,
        data: {
          ...estimate,
          currency: 'INR'
        }
      })
    } catch (error) {
      request.log.error({ error, agentId }, 'Failed to calculate cost estimate')
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate cost estimate'
      })
    }
  })

  /**
   * Get usage analytics
   * GET /api/billing/analytics
   */
  fastify.get<{
    Querystring: {
      days?: number
      agentId?: string
    }
    Reply: {
      success: boolean
      data?: Array<{
        agent_name: string
        agent_id: string
        usage_date: string
        usage_unit: string
        daily_usage: number
        daily_cost: number
      }>
      meta?: {
        totalDays: number
        totalCost: number
      }
      error?: string
    }
  }>('/analytics', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { days = 30, agentId } = request.query

    try {
      let analytics = await billingService.getUsageAnalytics(userId, days)

      // Filter by agent if specified
      if (agentId) {
        analytics = analytics.filter(item => item.agent_id === agentId)
      }

      const totalCost = analytics.reduce((sum, item) => sum + parseFloat(item.daily_cost || '0'), 0)

      return reply.send({
        success: true,
        data: analytics,
        meta: {
          totalDays: days,
          totalCost
        }
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch usage analytics')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch usage analytics'
      })
    }
  })

  /**
   * Get billing notifications
   * GET /api/billing/notifications
   */
  fastify.get<{
    Querystring: {
      limit?: number
      unread?: boolean
    }
    Reply: {
      success: boolean
      data?: Array<{
        id: string
        businessId: string
        agentId?: string
        type: string
        severity: string
        title: string
        message: string
        data: any
        sent: boolean
        sentAt?: string
        createdAt: string
      }>
      meta?: {
        total: number
        unread: number
      }
      error?: string
    }
  }>('/notifications', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { limit = 50, unread } = request.query

    try {
      const notifications = await billingService.getBillingNotifications(userId, limit)
      
      // Filter unread if requested
      let filteredNotifications = notifications
      if (unread) {
        filteredNotifications = notifications.filter(n => !n.sent)
      }

      const unreadCount = notifications.filter(n => !n.sent).length

      return reply.send({
        success: true,
        data: filteredNotifications,
        meta: {
          total: notifications.length,
          unread: unreadCount
        }
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch billing notifications')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch billing notifications'
      })
    }
  })

  /**
   * Get current usage quotas
   * GET /api/billing/quotas
   */
  fastify.get<{
    Querystring: {
      agentId?: string
    }
    Reply: {
      success: boolean
      data?: Array<{
        agentId: string
        quotaType: string
        usageUnit: string
        quotaLimit: number
        quotaUsed: number
        quotaRemaining: number
        usagePercentage: number
        periodStart: string
        periodEnd: string
      }>
      error?: string
    }
  }>('/quotas', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { agentId } = request.query

    try {
      let query = `
        SELECT 
          agent_id,
          quota_type,
          usage_unit,
          quota_limit,
          quota_used,
          quota_period_start,
          quota_period_end
        FROM agent_usage_quotas 
        WHERE business_id = $1 
          AND quota_period_start <= CURRENT_TIMESTAMP 
          AND quota_period_end >= CURRENT_TIMESTAMP
      `
      const params = [userId]

      if (agentId) {
        query += ' AND agent_id = $2'
        params.push(agentId)
      }

      query += ' ORDER BY agent_id, quota_type, usage_unit'

      const result = await fastify.db.query(query, params)

      const quotas = result.rows.map(row => ({
        agentId: row.agent_id,
        quotaType: row.quota_type,
        usageUnit: row.usage_unit,
        quotaLimit: parseFloat(row.quota_limit),
        quotaUsed: parseFloat(row.quota_used),
        quotaRemaining: Math.max(0, parseFloat(row.quota_limit) - parseFloat(row.quota_used)),
        usagePercentage: Math.round((parseFloat(row.quota_used) / parseFloat(row.quota_limit)) * 100),
        periodStart: row.quota_period_start,
        periodEnd: row.quota_period_end
      }))

      return reply.send({
        success: true,
        data: quotas
      })
    } catch (error) {
      request.log.error({ error }, 'Failed to fetch usage quotas')
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch usage quotas'
      })
    }
  })

  /**
   * Test endpoint to simulate usage (for development)
   * POST /api/billing/test-usage
   */
  fastify.post<{
    Body: {
      agentId: string
      usageType: 'call' | 'message' | 'token'
      amount?: number
    }
    Reply: {
      success: boolean
      message?: string
      error?: string
    }
  }>('/test-usage', async (request, reply) => {
    const userId = (request.user as any)?.id || (request.user as any)?.userId
    const { agentId, usageType, amount = 1 } = request.body

    if (!agentId || !usageType) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: agentId, usageType'
      })
    }

    try {
      const eventMap = {
        call: { eventType: 'call_completed', usageUnit: 'minutes', defaultAmount: 5.5 },
        message: { eventType: 'message_sent', usageUnit: 'messages', defaultAmount: 1 },
        token: { eventType: 'tokens_used', usageUnit: 'tokens', defaultAmount: 1000 }
      }

      const event = eventMap[usageType]
      if (!event) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid usageType. Use: call, message, or token'
        })
      }

      await billingService.recordUsageEvent({
        businessId: userId,
        agentId,
        eventType: event.eventType,
        eventData: { test: true, simulatedUsage: true },
        usageAmount: amount || event.defaultAmount,
        usageUnit: event.usageUnit
      })

      return reply.send({
        success: true,
        message: `Test ${usageType} usage recorded successfully`
      })
    } catch (error) {
      request.log.error({ error, agentId, usageType }, 'Failed to record test usage')
      return reply.status(500).send({
        success: false,
        error: 'Failed to record test usage'
      })
    }
  })
}

export default billingRoutes