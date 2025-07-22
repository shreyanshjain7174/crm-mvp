/**
 * Security Dashboard Component
 * 
 * Provides a comprehensive overview of agent security status, permissions,
 * and security events across all installed agents.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Lock, 
  Unlock,
  Activity,
  TrendingUp,
  Users,
  Database,
  Bell,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SecurityEvent {
  id: string
  timestamp: Date
  agentId: string
  agentName: string
  eventType: 'permission_granted' | 'permission_revoked' | 'access_attempt' | 'security_violation' | 'permission_change'
  resource: string
  action: string
  result: 'success' | 'denied' | 'warning'
  details: string
  severity: 'low' | 'medium' | 'high'
}

interface SecuritySummary {
  totalAgents: number
  agentsWithHighRiskPermissions: number
  totalPermissions: number
  grantedPermissions: number
  securityEvents24h: number
  violationsThisWeek: number
  lastSecurityReview: Date
}

interface SecurityDashboardProps {
  businessId: string
}

export function SecurityDashboard({ businessId }: SecurityDashboardProps) {
  const [summary, setSummary] = useState<SecuritySummary | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - in production, this would come from API
    const mockSummary: SecuritySummary = {
      totalAgents: 3,
      agentsWithHighRiskPermissions: 1,
      totalPermissions: 18,
      grantedPermissions: 14,
      securityEvents24h: 7,
      violationsThisWeek: 0,
      lastSecurityReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }

    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        agentId: 'cozmox-voice-agent',
        agentName: 'Cozmox Voice Assistant',
        eventType: 'permission_granted',
        resource: 'contact',
        action: 'read',
        result: 'success',
        details: 'Permission granted to read contact information',
        severity: 'low'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        agentId: 'whatsapp-responder',
        agentName: 'WhatsApp AI Responder',
        eventType: 'access_attempt',
        resource: 'message',
        action: 'create',
        result: 'success',
        details: 'Agent successfully sent automated response to customer inquiry',
        severity: 'low'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        agentId: 'data-enricher',
        agentName: 'Contact Data Enricher',
        eventType: 'access_attempt',
        resource: 'contact',
        action: 'update',
        result: 'success',
        details: 'Updated contact information with enriched data from external source',
        severity: 'low'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        agentId: 'cozmox-voice-agent',
        agentName: 'Cozmox Voice Assistant',
        eventType: 'permission_change',
        resource: 'appointment',
        action: 'create',
        result: 'warning',
        details: 'Agent attempted to create appointment but requires manual approval',
        severity: 'medium'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        agentId: 'whatsapp-responder',
        agentName: 'WhatsApp AI Responder',
        eventType: 'access_attempt',
        resource: 'contact',
        action: 'read',
        result: 'success',
        details: 'Retrieved contact details for message personalization',
        severity: 'low'
      }
    ]

    const loadData = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      setSummary(mockSummary)
      setEvents(mockEvents)
      setLoading(false)
    }

    loadData()
  }, [businessId])

  const getEventIcon = (eventType: SecurityEvent['eventType'], result: SecurityEvent['result']) => {
    switch (eventType) {
      case 'permission_granted':
        return <Unlock className="w-4 h-4 text-green-600" />
      case 'permission_revoked':
        return <Lock className="w-4 h-4 text-red-600" />
      case 'access_attempt':
        return result === 'success' ? 
          <CheckCircle className="w-4 h-4 text-green-600" /> : 
          <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'security_violation':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'permission_change':
        return <Settings className="w-4 h-4 text-orange-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ago`
    } else {
      return `${diffMinutes}m ago`
    }
  }

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

  if (!summary) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Security Dashboard</h1>
            <p className="text-gray-600">Monitor and manage agent security across your CRM</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
          <Button variant="outline" size="sm">
            Security Review
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.totalAgents}</div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                summary.agentsWithHighRiskPermissions > 0 ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  summary.agentsWithHighRiskPermissions > 0 ? 'text-orange-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {summary.agentsWithHighRiskPermissions}
                </div>
                <div className="text-sm text-gray-600">High Risk Access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {summary.grantedPermissions}/{summary.totalPermissions}
                </div>
                <div className="text-sm text-gray-600">Permissions Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                summary.violationsThisWeek > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  summary.violationsThisWeek > 0 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{summary.violationsThisWeek}</div>
                <div className="text-sm text-gray-600">Violations This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Status Alert */}
      {summary.violationsThisWeek === 0 && summary.agentsWithHighRiskPermissions <= 1 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Security Status: Good</div>
                <div className="text-sm text-green-700">
                  No security violations detected. All agents are operating within approved permissions.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">Security Status: Attention Required</div>
                <div className="text-sm text-orange-700">
                  {summary.agentsWithHighRiskPermissions > 1 && 
                    `${summary.agentsWithHighRiskPermissions} agents have high-risk permissions. `}
                  {summary.violationsThisWeek > 0 && 
                    `${summary.violationsThisWeek} security violations detected this week.`}
                  Review agent permissions and security settings.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="permissions">Permission Overview</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Security Events</span>
                <Badge variant="outline" className="ml-auto">
                  {events.length} events
                </Badge>
              </CardTitle>
              <CardDescription>
                Monitor all security-related activities across your AI agents
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event.eventType, event.result)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{event.agentName}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityColor(event.severity)}`}
                        >
                          {event.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTimeAgo(event.timestamp)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1">
                        {event.eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {event.resource} • {event.action}
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        {event.details}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Badge 
                        variant={event.result === 'success' ? 'default' : 
                               event.result === 'denied' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {event.result.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Summary</CardTitle>
              <CardDescription>
                Overview of permissions granted across all agents
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Contact Access</span>
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-600">3 agents • Read & Update</div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-orange-600 bg-orange-50">
                      MEDIUM RISK
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Message Access</span>
                    <Eye className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-600">2 agents • Read & Create</div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-green-600 bg-green-50">
                      LOW RISK
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Appointment Access</span>
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-600">1 agent • Create (Approval Required)</div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-red-600 bg-red-50">
                      HIGH RISK
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure global security policies for agent access
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Automatic Security Reviews</div>
                <div className="text-sm text-gray-600 mb-3">
                  Automatically review agent permissions and flag suspicious activities
                </div>
                <Button size="sm" variant="outline">
                  Configure Review Schedule
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Permission Approval Workflow</div>
                <div className="text-sm text-gray-600 mb-3">
                  Require manual approval for high-risk permissions and actions
                </div>
                <Button size="sm" variant="outline">
                  Manage Approval Rules
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Security Notifications</div>
                <div className="text-sm text-gray-600 mb-3">
                  Get alerted about security events and permission changes
                </div>
                <Button size="sm" variant="outline">
                  Notification Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}