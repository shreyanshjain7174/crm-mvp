/**
 * Billing Dashboard Component
 * 
 * Comprehensive billing dashboard showing usage analytics, cost breakdowns,
 * quotas, and billing notifications for AI agents.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Bell,
  Download,
  CreditCard,
  Zap,
  BarChart3,
  Users,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsageChart } from './UsageChart'
import { CostEstimator } from './CostEstimator'
import { BillingNotifications } from './BillingNotifications'

interface BillingSummary {
  businessId: string
  agentId: string
  agentName: string
  totalCost: number
  usageSummary: Record<string, number>
  eventsCount: number
  period: string
}

interface UsageQuota {
  agentId: string
  quotaType: string
  usageUnit: string
  quotaLimit: number
  quotaUsed: number
  quotaRemaining: number
  usagePercentage: number
  periodStart: string
  periodEnd: string
}

interface BillingNotification {
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
}

interface BillingDashboardProps {
  businessId: string
}

export function BillingDashboard({ businessId }: BillingDashboardProps) {
  const [summary, setSummary] = useState<BillingSummary[]>([])
  const [quotas, setQuotas] = useState<UsageQuota[]>([])
  const [notifications, setNotifications] = useState<BillingNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>()

  const loadBillingData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Mock data for development - replace with actual API calls
      const mockSummary: BillingSummary[] = [
        {
          businessId,
          agentId: 'cozmox-voice-agent',
          agentName: 'Cozmox Voice Assistant',
          totalCost: 127.50,
          usageSummary: { minutes: 85, calls: 12 },
          eventsCount: 24,
          period: '2024-07-01'
        },
        {
          businessId,
          agentId: 'whatsapp-ai-responder',
          agentName: 'WhatsApp AI Responder',
          totalCost: 0, // Subscription model
          usageSummary: { messages: 247, conversations: 18 },
          eventsCount: 265,
          period: '2024-07-01'
        }
      ]

      const mockQuotas: UsageQuota[] = [
        {
          agentId: 'cozmox-voice-agent',
          quotaType: 'monthly',
          usageUnit: 'minutes',
          quotaLimit: 500,
          quotaUsed: 127,
          quotaRemaining: 373,
          usagePercentage: 25,
          periodStart: '2024-07-01',
          periodEnd: '2024-07-31'
        },
        {
          agentId: 'whatsapp-ai-responder',
          quotaType: 'monthly',
          usageUnit: 'messages',
          quotaLimit: 5000,
          quotaUsed: 247,
          quotaRemaining: 4753,
          usagePercentage: 5,
          periodStart: '2024-07-01',
          periodEnd: '2024-07-31'
        }
      ]

      const mockNotifications: BillingNotification[] = [
        {
          id: '1',
          businessId,
          agentId: 'cozmox-voice-agent',
          type: 'quota_warning',
          severity: 'warning',
          title: 'Usage Limit Warning',
          message: 'Cozmox Voice Agent has used 25% of its monthly minutes limit',
          data: { percentage: 25 },
          sent: false,
          createdAt: '2024-07-22T10:30:00Z'
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      setSummary(mockSummary)
      setQuotas(mockQuotas)
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    loadBillingData()
  }, [businessId, selectedPeriod, loadBillingData])

  const totalCost = summary.reduce((sum, item) => sum + item.totalCost, 0)
  const totalEvents = summary.reduce((sum, item) => sum + item.eventsCount, 0)
  const criticalQuotas = quotas.filter(q => q.usagePercentage >= 80).length
  const unreadNotifications = notifications.filter(n => !n.sent).length

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Billing & Usage</h1>
            <p className="text-gray-600">Monitor agent costs and usage patterns</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing Settings
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Cost This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{totalEvents}</div>
                <div className="text-sm text-gray-600">Usage Events</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                criticalQuotas > 0 ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  criticalQuotas > 0 ? 'text-orange-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{criticalQuotas}</div>
                <div className="text-sm text-gray-600">Critical Quotas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                unreadNotifications > 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <Bell className={`w-5 h-5 ${
                  unreadNotifications > 0 ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{unreadNotifications}</div>
                <div className="text-sm text-gray-600">Unread Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="quotas">Quotas & Limits</TabsTrigger>
          <TabsTrigger value="estimator">Cost Estimator</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Agent Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Cost Breakdown</CardTitle>
              <CardDescription>Cost analysis per agent for current billing period</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {summary.map((agent) => (
                  <div key={agent.agentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-600">
                          {Object.entries(agent.usageSummary).map(([unit, amount]) => 
                            `${amount} ${unit}`
                          ).join(' • ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {agent.totalCost > 0 ? `₹${agent.totalCost.toFixed(2)}` : 'Free'}
                      </div>
                      <div className="text-sm text-gray-600">{agent.eventsCount} events</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Billing Activity</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2 hours ago', event: 'Voice call completed', agent: 'Cozmox Voice Agent', cost: '₹8.25' },
                  { time: '4 hours ago', event: 'Message sent', agent: 'WhatsApp Responder', cost: 'Free' },
                  { time: '6 hours ago', event: 'Call completed', agent: 'Cozmox Voice Agent', cost: '₹12.75' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-gray-900">{activity.event}</span>
                        <span className="text-gray-600"> • {activity.agent}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{activity.time}</span>
                      <span className="font-medium">{activity.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageChart businessId={businessId} />
        </TabsContent>

        <TabsContent value="quotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Quotas & Limits</CardTitle>
              <CardDescription>Monitor usage limits and remaining quotas</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {quotas.map((quota) => (
                  <div key={`${quota.agentId}-${quota.usageUnit}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {quota.agentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-600">
                          {quota.usageUnit.charAt(0).toUpperCase() + quota.usageUnit.slice(1)} Usage
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {quota.quotaUsed.toLocaleString()} / {quota.quotaLimit.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">{quota.usagePercentage}% used</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          quota.usagePercentage >= 90 ? 'bg-red-500' :
                          quota.usagePercentage >= 75 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(quota.usagePercentage, 100)}%` }}
                      />
                    </div>
                    
                    {quota.usagePercentage >= 80 && (
                      <div className="text-sm text-orange-600 font-medium">
                        ⚠️ Approaching limit - {quota.quotaRemaining} {quota.usageUnit} remaining
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimator" className="space-y-4">
          <CostEstimator businessId={businessId} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <BillingNotifications notifications={notifications} />
        </TabsContent>
      </Tabs>
    </div>
  )
}