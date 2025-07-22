/**
 * Billing Notifications Component
 * 
 * Displays billing alerts, quota warnings, and usage notifications
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock,
  DollarSign,
  Zap,
  MessageSquare
} from 'lucide-react'

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

interface BillingNotificationsProps {
  notifications: BillingNotification[]
}

const getNotificationIcon = (type: string, severity: string) => {
  if (severity === 'critical') return AlertTriangle
  if (type === 'quota_warning' || type === 'quota_exceeded') return Zap
  if (type === 'billing_due') return DollarSign
  if (type === 'usage_spike') return MessageSquare
  return Info
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200'
    case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

export function BillingNotifications({ notifications }: BillingNotificationsProps) {
  const unreadNotifications = notifications.filter(n => !n.sent)
  const readNotifications = notifications.filter(n => n.sent)

  const mockNotifications: BillingNotification[] = notifications.length > 0 ? notifications : [
    {
      id: '1',
      businessId: 'demo',
      agentId: 'cozmox-voice-agent',
      type: 'quota_warning',
      severity: 'warning',
      title: 'Usage Approaching Limit',
      message: 'Cozmox Voice Agent has used 75% of its monthly minutes quota (375/500 minutes used)',
      data: { percentage: 75, used: 375, limit: 500, unit: 'minutes' },
      sent: false,
      createdAt: '2024-07-22T10:30:00Z'
    },
    {
      id: '2',
      businessId: 'demo',
      agentId: 'whatsapp-ai-responder',
      type: 'usage_spike',
      severity: 'info',
      title: 'Unusual Activity Detected',
      message: 'WhatsApp AI Responder processed 150% more messages than usual today',
      data: { spike: 150, normalUsage: 40, todayUsage: 100 },
      sent: false,
      createdAt: '2024-07-22T08:15:00Z'
    },
    {
      id: '3',
      businessId: 'demo',
      type: 'billing_due',
      severity: 'warning',
      title: 'Billing Period Ending',
      message: 'Your current billing period ends in 5 days. Total usage: ₹127.50',
      data: { daysRemaining: 5, totalCost: 127.50 },
      sent: true,
      sentAt: '2024-07-21T16:45:00Z',
      createdAt: '2024-07-21T16:45:00Z'
    },
    {
      id: '4',
      businessId: 'demo',
      agentId: 'cozmox-voice-agent',
      type: 'cost_optimization',
      severity: 'info',
      title: 'Cost Optimization Tip',
      message: 'You could save ₹25/month by upgrading to the Pro plan with higher free tier limits',
      data: { potentialSavings: 25 },
      sent: true,
      sentAt: '2024-07-20T12:00:00Z',
      createdAt: '2024-07-20T12:00:00Z'
    }
  ]

  const allNotifications = mockNotifications.length > 0 ? mockNotifications : notifications
  const unread = allNotifications.filter(n => !n.sent)
  const read = allNotifications.filter(n => n.sent)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Billing Notifications</span>
            {unread.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unread.length} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Stay informed about usage limits, costs, and billing events
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Unread Notifications */}
      {unread.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unread Notifications</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {unread.map((notification) => {
                const Icon = getNotificationIcon(notification.type, notification.severity)
                const severityClass = getSeverityColor(notification.severity)
                
                return (
                  <div key={notification.id} className={`p-4 rounded-lg border ${severityClass}`}>
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {notification.severity.toUpperCase()}
                          </Badge>
                          {notification.agentId && (
                            <Badge variant="secondary" className="text-xs">
                              {notification.agentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm mb-2">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                            {notification.type === 'quota_warning' && (
                              <Button size="sm">
                                Upgrade Plan
                              </Button>
                            )}
                            {notification.type === 'billing_due' && (
                              <Button size="sm">
                                View Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read Notifications */}
      {read.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {read.slice(0, 5).map((notification) => {
                const Icon = getNotificationIcon(notification.type, notification.severity)
                
                return (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-4 h-4 mt-1 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900">{notification.title}</h5>
                        {notification.agentId && (
                          <Badge variant="outline" className="text-xs">
                            {notification.agentId.split('-')[0]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {read.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm">
                  View All Notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {allNotifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              You&apos;ll see billing alerts, quota warnings, and usage notifications here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Configure when and how you receive billing alerts</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Quota Warnings</div>
                <div className="text-sm text-gray-600">Alert when approaching usage limits</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Cost Alerts</div>
                <div className="text-sm text-gray-600">Notify about unexpected cost increases</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Billing Reminders</div>
                <div className="text-sm text-gray-600">Monthly billing period notifications</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}