/**
 * Agent Management Dashboard
 * 
 * Main dashboard for users to monitor and manage their installed AI agents.
 * Shows agent status, performance metrics, and provides control actions.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react'
import { AgentCard } from './AgentCard'
import { AgentMetrics } from './AgentMetrics'
import { AgentLogs } from './AgentLogs'

// Mock data - in production, this comes from API
interface InstalledAgent {
  id: string
  name: string
  provider: string
  version: string
  status: 'running' | 'stopped' | 'error' | 'installing'
  icon: string
  lastActivity: Date
  metrics: {
    callsToday: number
    successRate: number
    avgResponseTime: number
    totalSavings: number
  }
  health: 'healthy' | 'degraded' | 'unhealthy'
  usage: {
    current: number
    limit: number
    unit: string
  }
}

interface AgentDashboardProps {
  businessId: string
}

export function AgentDashboard({ businessId }: AgentDashboardProps) {
  const [agents, setAgents] = useState<InstalledAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<InstalledAgent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with API call
    const mockAgents: InstalledAgent[] = [
      {
        id: 'whatsapp-ai-responder-1',
        name: 'WhatsApp AI Responder',
        provider: 'Local AI Co.',
        version: '2.1.0',
        status: 'running',
        icon: '💬',
        lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        metrics: {
          callsToday: 47,
          successRate: 94,
          avgResponseTime: 1.2,
          totalSavings: 2340
        },
        health: 'healthy',
        usage: {
          current: 1247,
          limit: 5000,
          unit: 'messages'
        }
      },
      {
        id: 'cozmox-voice-agent-1',
        name: 'Cozmox Voice Assistant',
        provider: 'Cozmox AI',
        version: '1.5.2',
        status: 'running',
        icon: '🎙️',
        lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        metrics: {
          callsToday: 12,
          successRate: 89,
          avgResponseTime: 8.5,
          totalSavings: 890
        },
        health: 'healthy',
        usage: {
          current: 127,
          limit: 500,
          unit: 'minutes'
        }
      },
      {
        id: 'data-enricher-1',
        name: 'Contact Data Enricher',
        provider: 'DataMax Solutions',
        version: '1.2.1',
        status: 'stopped',
        icon: '📊',
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metrics: {
          callsToday: 23,
          successRate: 96,
          avgResponseTime: 0.8,
          totalSavings: 156
        },
        health: 'healthy',
        usage: {
          current: 89,
          limit: 1000,
          unit: 'enrichments'
        }
      }
    ]

    const loadAgents = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAgents(mockAgents)
      setLoading(false)
    }
    loadAgents()
  }, [])

  const handleStartAgent = async (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'running' as const }
        : agent
    ))
  }

  const handleStopAgent = async (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: 'stopped' as const }
        : agent
    ))
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm('Are you sure you want to uninstall this agent?')) {
      setAgents(prev => prev.filter(agent => agent.id !== agentId))
    }
  }

  const getTotalMetrics = () => {
    return agents.reduce(
      (total, agent) => ({
        totalCalls: total.totalCalls + agent.metrics.callsToday,
        avgSuccessRate: (total.avgSuccessRate + agent.metrics.successRate) / 2,
        totalSavings: total.totalSavings + agent.metrics.totalSavings
      }),
      { totalCalls: 0, avgSuccessRate: 0, totalSavings: 0 }
    )
  }

  const runningAgents = agents.filter(agent => agent.status === 'running').length
  const totalAgents = agents.length
  const totalMetrics = getTotalMetrics()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Agents Installed</h3>
          <p className="text-gray-600 mb-6">
            Install your first AI agent from the marketplace to automate your business processes.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Browse Agent Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Agent Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your AI workforce</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
          <Bot className="w-4 h-4 mr-2" />
          Install New Agent
        </button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-semibold text-gray-900">
                {runningAgents}/{totalAgents}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">All systems operational</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions Today</p>
              <p className="text-2xl font-semibold text-gray-900">{totalMetrics.totalCalls}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600">+23% from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(totalMetrics.avgSuccessRate)}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-sm text-emerald-600">Excellent performance</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost Savings</p>
              <p className="text-2xl font-semibold text-gray-900">₹{totalMetrics.totalSavings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-sm text-purple-600">This month</span>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Installed Agents</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStart={() => handleStartAgent(agent.id)}
              onStop={() => handleStopAgent(agent.id)}
              onDelete={() => handleDeleteAgent(agent.id)}
              onViewDetails={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSelectedAgent(null)} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex h-full">
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {selectedAgent.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedAgent.name}</h3>
                        <p className="text-gray-600">{selectedAgent.provider}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAgent(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <AgentMetrics agent={selectedAgent} />
                    <AgentLogs agentId={selectedAgent.id} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}