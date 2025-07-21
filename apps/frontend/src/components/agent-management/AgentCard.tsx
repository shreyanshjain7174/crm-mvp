/**
 * Agent Card - Individual Agent Display in Management Dashboard
 * 
 * Shows agent status, metrics, and control actions in a compact card format
 */

'use client'

import React from 'react'
import { 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal
} from 'lucide-react'

interface AgentCardProps {
  agent: {
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
  onStart: () => void
  onStop: () => void
  onDelete: () => void
  onViewDetails: () => void
}

export function AgentCard({ agent, onStart, onStop, onDelete, onViewDetails }: AgentCardProps) {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'running': return 'text-green-600 bg-green-100'
      case 'stopped': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'installing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthIcon = () => {
    switch (agent.health) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'unhealthy': return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const usagePercentage = (agent.usage.current / agent.usage.limit) * 100

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Agent Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            {agent.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900 truncate">{agent.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </span>
              {getHealthIcon()}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{agent.provider}</span>
              <span>v{agent.version}</span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatLastActivity(agent.lastActivity)}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="hidden md:flex items-center space-x-8 mr-8">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{agent.metrics.callsToday}</div>
            <div className="text-xs text-gray-500">Actions Today</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{agent.metrics.successRate}%</div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{agent.metrics.avgResponseTime}s</div>
            <div className="text-xs text-gray-500">Avg Response</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">₹{agent.metrics.totalSavings}</div>
            <div className="text-xs text-gray-500">Saved Today</div>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="hidden lg:block mr-8">
          <div className="text-sm text-gray-600 mb-2">
            {agent.usage.current.toLocaleString()} / {agent.usage.limit.toLocaleString()} {agent.usage.unit}
          </div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{Math.round(usagePercentage)}% used</div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {agent.status === 'stopped' ? (
            <button
              onClick={onStart}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Start Agent"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStop}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Stop Agent"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onViewDetails}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Uninstall Agent"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Metrics */}
      <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{agent.metrics.callsToday}</div>
            <div className="text-xs text-gray-500">Actions Today</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{agent.metrics.successRate}%</div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Usage</span>
            <span>{Math.round(usagePercentage)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}