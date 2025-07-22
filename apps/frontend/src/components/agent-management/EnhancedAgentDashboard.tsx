/**
 * Enhanced Agent Management Dashboard with Security Integration
 * 
 * Combines agent management with comprehensive security features,
 * permission management, and marketplace integration.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bot, 
  Plus, 
  Shield, 
  Activity, 
  Settings, 
  Store, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentDashboard } from './AgentDashboard'
import { SecurityDashboard } from '../agent-security/SecurityDashboard'
import { AgentMarketplace } from '../agent-marketplace/AgentMarketplace'
import { AgentPermissions } from '../agent-security/AgentPermissions'
import { AgentInstallModal } from '../agent-security/AgentInstallModal'

interface EnhancedAgentDashboardProps {
  businessId: string
}

interface InstalledAgent {
  id: string
  name: string
  provider: string
  version: string
  status: 'running' | 'stopped' | 'error'
  permissions: any[]
  lastActivity: Date
  securityRisk: 'low' | 'medium' | 'high'
  hasHighRiskPermissions: boolean
}

export function EnhancedAgentDashboard({ businessId }: EnhancedAgentDashboardProps) {
  const [agents, setAgents] = useState<InstalledAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<InstalledAgent | null>(null)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [selectedAgentToInstall, setSelectedAgentToInstall] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('agents')

  useEffect(() => {
    // Mock data with security information
    const mockAgents: InstalledAgent[] = [
      {
        id: 'cozmox-voice-agent-1',
        name: 'Cozmox Voice Assistant',
        provider: 'Cozmox AI',
        version: '1.5.2',
        status: 'running',
        permissions: [
          {
            id: 'contact-read',
            resource: 'contact',
            actions: ['read'],
            granted: true,
            required: true,
            riskLevel: 'medium',
            description: 'Access contact information for personalized conversations'
          },
          {
            id: 'call-create',
            resource: 'call',
            actions: ['create'],
            granted: true,
            required: true,
            riskLevel: 'low',
            description: 'Make outbound calls to customers'
          },
          {
            id: 'appointment-create',
            resource: 'appointment',
            actions: ['create'],
            granted: true,
            required: false,
            riskLevel: 'high',
            description: 'Schedule appointments in calendar'
          }
        ],
        lastActivity: new Date(Date.now() - 15 * 60 * 1000),
        securityRisk: 'medium',
        hasHighRiskPermissions: true
      },
      {
        id: 'whatsapp-ai-responder-1',
        name: 'WhatsApp AI Responder',
        provider: 'Local AI Co.',
        version: '2.1.0',
        status: 'running',
        permissions: [
          {
            id: 'message-read',
            resource: 'message',
            actions: ['read'],
            granted: true,
            required: true,
            riskLevel: 'low',
            description: 'Read incoming WhatsApp messages'
          },
          {
            id: 'message-create',
            resource: 'message',
            actions: ['create'],
            granted: true,
            required: true,
            riskLevel: 'medium',
            description: 'Send automated responses to customers'
          }
        ],
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
        securityRisk: 'low',
        hasHighRiskPermissions: false
      }
    ]

    const loadAgents = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      setAgents(mockAgents)
      setLoading(false)
    }
    
    loadAgents()
  }, [businessId])

  const handleInstallAgent = (agentId: string, approvedPermissions: string[]) => {
    console.log('Installing agent:', agentId, 'with permissions:', approvedPermissions)
    // In production, this would install the agent with approved permissions
    setShowInstallModal(false)
    setSelectedAgentToInstall(null)
  }

  const handlePermissionChange = (agentId: string, permissionId: string, granted: boolean) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId
        ? {
            ...agent,
            permissions: agent.permissions.map(p =>
              p.id === permissionId ? { ...p, granted } : p
            )
          }
        : agent
    ))
  }

  const securityOverview = {
    totalAgents: agents.length,
    runningAgents: agents.filter(a => a.status === 'running').length,
    highRiskAgents: agents.filter(a => a.hasHighRiskPermissions).length,
    securityViolations: 0 // Mock data
  }

  // Sample agent for installation demo
  const sampleAgentToInstall = selectedAgentToInstall || {
    id: 'cozmox-voice-agent',
    name: 'Cozmox Voice Assistant',
    provider: 'Cozmox AI',
    version: '1.5.2',
    description: 'AI-powered voice assistant for handling calls and appointments',
    longDescription: 'A comprehensive voice AI agent that handles incoming calls, schedules appointments, qualifies leads, and provides customer support through natural voice conversations. Includes advanced features like sentiment analysis, appointment booking with calendar integration, and lead qualification scoring.',
    permissions: [
      {
        id: 'contact-read',
        resource: 'contact',
        actions: ['read'],
        description: 'Access contact information for personalized conversations',
        required: true,
        riskLevel: 'medium' as const,
        constraints: { businessScope: true }
      },
      {
        id: 'call-create',
        resource: 'call',
        actions: ['create'],
        description: 'Make outbound calls to customers',
        required: true,
        riskLevel: 'low' as const,
        constraints: { businessScope: true }
      },
      {
        id: 'appointment-create',
        resource: 'appointment',
        actions: ['create'],
        description: 'Schedule appointments in your calendar',
        required: false,
        riskLevel: 'high' as const,
        constraints: { businessScope: true }
      }
    ],
    pricing: {
      model: 'usage' as const,
      details: '₹1.50 per minute + 60 min free'
    },
    rating: 4.8,
    installs: 15670,
    verified: true,
    supportUrl: 'https://cozmox.ai/support',
    privacyPolicyUrl: 'https://cozmox.ai/privacy'
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AI Agent Center</h1>
            <p className="text-gray-600">Manage your AI workforce with advanced security controls</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('marketplace')}
          >
            <Store className="w-4 h-4 mr-2" />
            Browse Agents
          </Button>
          <Button onClick={() => {
            setSelectedAgentToInstall(sampleAgentToInstall)
            setShowInstallModal(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Install Agent
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {securityOverview.runningAgents}/{securityOverview.totalAgents}
                </div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                securityOverview.highRiskAgents > 0 ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                <Shield className={`w-5 h-5 ${
                  securityOverview.highRiskAgents > 0 ? 'text-orange-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{securityOverview.highRiskAgents}</div>
                <div className="text-sm text-gray-600">High Risk Permissions</div>
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
                <div className="text-lg font-semibold text-gray-900">{securityOverview.securityViolations}</div>
                <div className="text-sm text-gray-600">Security Violations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Actions Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <AgentDashboard businessId={businessId} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityDashboard businessId={businessId} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {agents.length > 0 ? (
            <div className="space-y-6">
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="w-8 h-8 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>{agent.provider} • v{agent.version}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={agent.securityRisk === 'high' ? 'destructive' : agent.securityRisk === 'medium' ? 'default' : 'secondary'}>
                          {agent.securityRisk.toUpperCase()} RISK
                        </Badge>
                        <Badge variant={agent.status === 'running' ? 'default' : 'secondary'}>
                          {agent.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <AgentPermissions
                      agentId={agent.id}
                      agentName={agent.name}
                      permissions={agent.permissions}
                      onPermissionChange={(permissionId, granted) => 
                        handlePermissionChange(agent.id, permissionId, granted)
                      }
                      onSave={() => console.log('Permissions saved for', agent.name)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Installed</h3>
                <p className="text-gray-600 mb-4">Install agents to manage their permissions</p>
                <Button onClick={() => setActiveTab('marketplace')}>
                  Browse Agent Marketplace
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <AgentMarketplace 
            businessId={businessId}
            onInstallAgent={(agentId) => {
              setSelectedAgentToInstall({ id: agentId, ...sampleAgentToInstall })
              setShowInstallModal(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Install Modal */}
      <AgentInstallModal
        open={showInstallModal}
        agent={selectedAgentToInstall}
        onClose={() => {
          setShowInstallModal(false)
          setSelectedAgentToInstall(null)
        }}
        onInstall={handleInstallAgent}
      />
    </div>
  )
}