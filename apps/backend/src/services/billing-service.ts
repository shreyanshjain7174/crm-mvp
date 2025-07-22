/**
 * Billing Service
 * 
 * Handles agent billing, usage tracking, and cost calculations.
 * Provides APIs for recording usage events, calculating costs, and managing billing periods.
 */

import { db } from '../db/index'
import { logger } from '../utils/logger'

export interface UsageEvent {
  businessId: string
  agentId: string
  eventType: string
  eventData?: Record<string, any>
  usageAmount: number
  usageUnit: string
  timestamp?: Date
}

export interface AgentInstallation {
  id: string
  businessId: string
  agentId: string
  agentName: string
  agentProvider: string
  agentVersion: string
  pricingModel: 'free' | 'subscription' | 'usage' | 'hybrid'
  pricingConfig: {
    perMinute?: number
    perToken?: number
    perRequest?: number
    monthlyPrice?: number
    freeLimit?: number
    unit?: string
    currency?: string
  }
  status: 'active' | 'suspended' | 'cancelled'
  installedAt: Date
}

export interface BillingPeriod {
  id: string
  businessId: string
  periodStart: Date
  periodEnd: Date
  status: 'active' | 'finalized' | 'paid' | 'overdue'
  totalAmount: number
  currency: string
  dueDate: Date
}

export interface UsageQuota {
  id: string
  businessId: string
  agentId: string
  quotaType: 'monthly' | 'daily' | 'lifetime'
  usageUnit: string
  quotaLimit: number
  quotaUsed: number
  quotaPeriodStart: Date
  quotaPeriodEnd: Date
}

export interface BillingSummary {
  businessId: string
  agentId: string
  agentName: string
  totalCost: number
  usageSummary: Record<string, number>
  eventsCount: number
  period: string
}

export interface CostCalculation {
  baseCost: number
  freeTierDeduction: number
  finalCost: number
  usageBreakdown: Array<{
    unit: string
    amount: number
    rate: number
    cost: number
  }>
}

class BillingService {
  /**
   * Record a usage event for billing
   */
  async recordUsageEvent(event: UsageEvent): Promise<void> {
    try {
      logger.info('Recording usage event', { 
        businessId: event.businessId, 
        agentId: event.agentId, 
        eventType: event.eventType,
        usage: `${event.usageAmount} ${event.usageUnit}`
      })

      // Get agent installation
      const installation = await this.getAgentInstallation(event.businessId, event.agentId)
      if (!installation) {
        throw new Error(`Agent installation not found: ${event.agentId}`)
      }

      // Calculate cost based on pricing model
      const cost = await this.calculateUsageCost(installation, event.usageAmount, event.usageUnit)

      // Get current billing period
      const billingPeriod = await this.getCurrentBillingPeriod(event.businessId)

      // Insert usage event
      await db.query(`
        INSERT INTO agent_usage_events (
          business_id, agent_id, installation_id, event_type, event_data,
          usage_amount, usage_unit, cost_amount, billing_period
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        event.businessId,
        event.agentId,
        installation.id,
        event.eventType,
        JSON.stringify(event.eventData || {}),
        event.usageAmount,
        event.usageUnit,
        cost * 100, // Store in smallest currency unit (paise)
        billingPeriod.format('YYYY-MM-DD')
      ])

      // Update quota usage
      await this.updateQuotaUsage(event.businessId, event.agentId, event.usageAmount, event.usageUnit)

      // Check for quota warnings
      await this.checkQuotaWarnings(event.businessId, event.agentId)

      logger.debug('Usage event recorded successfully', { cost, billingPeriod: billingPeriod.format('YYYY-MM-DD') })
    } catch (error) {
      logger.error('Failed to record usage event', { error, event })
      throw error
    }
  }

  /**
   * Calculate cost for usage based on agent pricing model
   */
  private async calculateUsageCost(
    installation: AgentInstallation, 
    usageAmount: number, 
    usageUnit: string
  ): Promise<number> {
    const { pricingModel, pricingConfig } = installation

    if (pricingModel === 'free') {
      return 0
    }

    if (pricingModel === 'subscription') {
      // Subscription model - no per-usage cost
      return 0
    }

    if (pricingModel === 'usage') {
      // Calculate based on usage rates
      let rate = 0
      
      switch (usageUnit) {
        case 'minutes':
          rate = pricingConfig.perMinute || 0
          break
        case 'tokens':
          rate = pricingConfig.perToken || 0
          break
        case 'requests':
          rate = pricingConfig.perRequest || 0
          break
        default:
          logger.warn(`Unknown usage unit: ${usageUnit}`)
          return 0
      }

      // Check if we're within free tier
      let billableAmount = usageAmount
      if (pricingConfig.freeLimit && pricingConfig.unit === usageUnit) {
        const currentUsage = await this.getCurrentPeriodUsage(
          installation.businessId, 
          installation.agentId, 
          usageUnit
        )
        
        if (currentUsage < pricingConfig.freeLimit) {
          const remainingFree = pricingConfig.freeLimit - currentUsage
          billableAmount = Math.max(0, usageAmount - remainingFree)
        }
      }

      return billableAmount * (rate / 100) // Rate is in paise, convert to rupees
    }

    return 0
  }

  /**
   * Get agent installation details
   */
  private async getAgentInstallation(businessId: string, agentId: string): Promise<AgentInstallation | null> {
    const result = await db.query(`
      SELECT * FROM agent_installations 
      WHERE business_id = $1 AND agent_id = $2 AND status = 'active'
    `, [businessId, agentId])

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      businessId: row.business_id,
      agentId: row.agent_id,
      agentName: row.agent_name,
      agentProvider: row.agent_provider,
      agentVersion: row.agent_version,
      pricingModel: row.pricing_model,
      pricingConfig: row.pricing_config,
      status: row.status,
      installedAt: row.installed_at
    }
  }

  /**
   * Get current billing period
   */
  private async getCurrentBillingPeriod(businessId: string): Promise<Date> {
    // Return first day of current month
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  /**
   * Get current period usage for an agent
   */
  private async getCurrentPeriodUsage(
    businessId: string, 
    agentId: string, 
    usageUnit: string
  ): Promise<number> {
    const currentPeriod = await this.getCurrentBillingPeriod(businessId)
    
    const result = await db.query(`
      SELECT COALESCE(SUM(usage_amount), 0) as total_usage
      FROM agent_usage_events 
      WHERE business_id = $1 AND agent_id = $2 AND usage_unit = $3 
        AND billing_period = $4
    `, [businessId, agentId, usageUnit, currentPeriod.toISOString().split('T')[0]])

    return parseFloat(result.rows[0]?.total_usage || '0')
  }

  /**
   * Update quota usage
   */
  private async updateQuotaUsage(
    businessId: string, 
    agentId: string, 
    usageAmount: number, 
    usageUnit: string
  ): Promise<void> {
    // Update monthly quota
    await db.query(`
      INSERT INTO agent_usage_quotas (
        business_id, agent_id, installation_id, quota_type, usage_unit,
        quota_limit, quota_used, quota_period_start, quota_period_end
      ) VALUES (
        $1, $2, 
        (SELECT id FROM agent_installations WHERE business_id = $1 AND agent_id = $2),
        'monthly', $3, 999999, $4, DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day'
      )
      ON CONFLICT (business_id, agent_id, quota_type, usage_unit)
      DO UPDATE SET quota_used = agent_usage_quotas.quota_used + $4, updated_at = CURRENT_TIMESTAMP
    `, [businessId, agentId, usageUnit, usageAmount])
  }

  /**
   * Check for quota warnings and create notifications
   */
  private async checkQuotaWarnings(businessId: string, agentId: string): Promise<void> {
    const quotas = await db.query(`
      SELECT * FROM agent_usage_quotas 
      WHERE business_id = $1 AND agent_id = $2
        AND quota_period_start <= CURRENT_TIMESTAMP 
        AND quota_period_end >= CURRENT_TIMESTAMP
    `, [businessId, agentId])

    for (const quota of quotas.rows) {
      const usagePercent = (quota.quota_used / quota.quota_limit) * 100

      // Send warning at 80% and 100% usage
      if (usagePercent >= 80) {
        const severity = usagePercent >= 100 ? 'critical' : 'warning'
        const title = usagePercent >= 100 ? 'Usage Limit Exceeded' : 'Usage Limit Warning'
        const message = usagePercent >= 100 
          ? `Agent ${agentId} has exceeded its ${quota.usage_unit} limit (${quota.quota_used}/${quota.quota_limit})`
          : `Agent ${agentId} has used ${Math.round(usagePercent)}% of its ${quota.usage_unit} limit (${quota.quota_used}/${quota.quota_limit})`

        await this.createBillingNotification({
          businessId,
          agentId,
          type: usagePercent >= 100 ? 'quota_exceeded' : 'quota_warning',
          severity,
          title,
          message,
          data: { quota, usagePercent }
        })
      }
    }
  }

  /**
   * Create billing notification
   */
  private async createBillingNotification(notification: {
    businessId: string
    agentId?: string
    type: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    message: string
    data?: any
  }): Promise<void> {
    // Check if similar notification already exists (avoid spam)
    const existing = await db.query(`
      SELECT id FROM billing_notifications 
      WHERE business_id = $1 AND agent_id = $2 AND notification_type = $3 
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    `, [notification.businessId, notification.agentId, notification.type])

    if (existing.rows.length > 0) {
      logger.debug('Similar notification already exists, skipping', { notification })
      return
    }

    await db.query(`
      INSERT INTO billing_notifications (
        business_id, agent_id, notification_type, severity, title, message, data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      notification.businessId,
      notification.agentId,
      notification.type,
      notification.severity,
      notification.title,
      notification.message,
      JSON.stringify(notification.data || {})
    ])

    logger.info('Billing notification created', { 
      type: notification.type, 
      severity: notification.severity,
      businessId: notification.businessId,
      agentId: notification.agentId
    })
  }

  /**
   * Get billing summary for a business
   */
  async getBillingSummary(businessId: string, periodStart?: Date): Promise<BillingSummary[]> {
    const period = periodStart || await this.getCurrentBillingPeriod(businessId)
    const periodStr = period.toISOString().split('T')[0]

    const result = await db.query(`
      SELECT 
        ai.agent_id,
        ai.agent_name,
        COALESCE(SUM(ue.cost_amount), 0) / 100.0 as total_cost,
        COUNT(ue.id) as events_count,
        json_object_agg(ue.usage_unit, usage_totals.total_usage) as usage_summary
      FROM agent_installations ai
      LEFT JOIN agent_usage_events ue ON ai.id = ue.installation_id 
        AND ue.billing_period = $2
      LEFT JOIN (
        SELECT installation_id, usage_unit, SUM(usage_amount) as total_usage
        FROM agent_usage_events 
        WHERE billing_period = $2
        GROUP BY installation_id, usage_unit
      ) usage_totals ON ai.id = usage_totals.installation_id
      WHERE ai.business_id = $1 AND ai.status = 'active'
      GROUP BY ai.agent_id, ai.agent_name
      ORDER BY total_cost DESC
    `, [businessId, periodStr])

    return result.rows.map(row => ({
      businessId,
      agentId: row.agent_id,
      agentName: row.agent_name,
      totalCost: parseFloat(row.total_cost || '0'),
      usageSummary: row.usage_summary || {},
      eventsCount: parseInt(row.events_count || '0'),
      period: periodStr
    }))
  }

  /**
   * Get detailed cost calculation for preview
   */
  async calculateCostEstimate(
    businessId: string,
    agentId: string,
    projectedUsage: Array<{ unit: string; amount: number }>
  ): Promise<CostCalculation> {
    const installation = await this.getAgentInstallation(businessId, agentId)
    if (!installation) {
      throw new Error(`Agent installation not found: ${agentId}`)
    }

    let baseCost = 0
    let freeTierDeduction = 0
    const usageBreakdown = []

    for (const usage of projectedUsage) {
      const unitCost = await this.calculateUsageCost(installation, usage.amount, usage.unit)
      const costWithoutFreeTier = await this.calculateUsageCost(
        { ...installation, pricingConfig: { ...installation.pricingConfig, freeLimit: 0 } },
        usage.amount,
        usage.unit
      )

      baseCost += costWithoutFreeTier
      freeTierDeduction += (costWithoutFreeTier - unitCost)

      usageBreakdown.push({
        unit: usage.unit,
        amount: usage.amount,
        rate: installation.pricingConfig[`per${usage.unit.charAt(0).toUpperCase() + usage.unit.slice(1, -1)}`] || 0,
        cost: unitCost
      })
    }

    return {
      baseCost,
      freeTierDeduction,
      finalCost: baseCost - freeTierDeduction,
      usageBreakdown
    }
  }

  /**
   * Get usage analytics for dashboard
   */
  async getUsageAnalytics(businessId: string, days: number = 30) {
    const result = await db.query(`
      SELECT 
        ai.agent_name,
        ai.agent_id,
        DATE(ue.created_at) as usage_date,
        ue.usage_unit,
        SUM(ue.usage_amount) as daily_usage,
        SUM(ue.cost_amount) / 100.0 as daily_cost
      FROM agent_installations ai
      JOIN agent_usage_events ue ON ai.id = ue.installation_id
      WHERE ai.business_id = $1 
        AND ue.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY ai.agent_name, ai.agent_id, DATE(ue.created_at), ue.usage_unit
      ORDER BY usage_date DESC, daily_cost DESC
    `, [businessId])

    return result.rows
  }

  /**
   * Get billing notifications
   */
  async getBillingNotifications(businessId: string, limit: number = 50) {
    const result = await db.query(`
      SELECT * FROM billing_notifications 
      WHERE business_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [businessId, limit])

    return result.rows.map(row => ({
      id: row.id,
      businessId: row.business_id,
      agentId: row.agent_id,
      type: row.notification_type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      data: row.data,
      sent: row.sent,
      sentAt: row.sent_at,
      createdAt: row.created_at
    }))
  }
}

export const billingService = new BillingService()