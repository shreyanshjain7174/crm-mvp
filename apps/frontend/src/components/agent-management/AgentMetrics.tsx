/**
 * Agent Metrics - Detailed Performance Visualization
 * 
 * Shows comprehensive metrics and performance data for individual agents
 */

'use client'

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  DollarSign
} from 'lucide-react'

interface AgentMetricsProps {
  agent: {
    id: string
    name: string
    metrics: {
      callsToday: number
      successRate: number
      avgResponseTime: number
      totalSavings: number
    }
    status: 'running' | 'stopped' | 'error' | 'installing'
  }
}

export function AgentMetrics({ agent }: AgentMetricsProps) {
  // Mock historical data - in production, this would come from API
  const mockHistoricalData = {
    callsHistory: [12, 18, 24, 31, 28, 35, 47], // Last 7 days
    successRateHistory: [89, 92, 88, 94, 91, 93, 94], // Last 7 days
    responseTimeHistory: [1.8, 1.5, 1.6, 1.2, 1.3, 1.4, 1.2], // Last 7 days
    savingsHistory: [890, 1250, 1680, 1920, 2100, 2200, 2340] // Cumulative
  }

  const getStatusIcon = () => {
    switch (agent.status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const calculateTrend = (history: number[]) => {
    if (history.length < 2) return 0
    const current = history[history.length - 1]
    const previous = history[history.length - 2]
    return ((current - previous) / previous) * 100
  }

  const callsTrend = calculateTrend(mockHistoricalData.callsHistory)
  const successTrend = calculateTrend(mockHistoricalData.successRateHistory)
  const responseTrend = calculateTrend(mockHistoricalData.responseTimeHistory)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          <p className="text-sm text-gray-600">Real-time agent performance data</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions Today</p>
              <p className="text-2xl font-semibold text-gray-900">{agent.metrics.callsToday}</p>
            </div>
            <div className="flex items-center text-sm">
              {callsTrend >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+{callsTrend.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600">{callsTrend.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{agent.metrics.successRate}%</p>
            </div>
            <div className="flex items-center text-sm">
              {successTrend >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+{successTrend.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600">{successTrend.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-semibold text-gray-900">{agent.metrics.avgResponseTime}s</p>
            </div>
            <div className="flex items-center text-sm">
              {responseTrend <= 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">{Math.abs(responseTrend).toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600">+{responseTrend.toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost Savings</p>
              <p className="text-2xl font-semibold text-gray-900">₹{agent.metrics.totalSavings}</p>
            </div>
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">7-Day Performance Trend</h4>
        <div className="space-y-3">
          {/* Simplified chart representation */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Actions per day</span>
              <span>{mockHistoricalData.callsHistory[mockHistoricalData.callsHistory.length - 1]}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(agent.metrics.callsToday / 50) * 100}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Success rate</span>
              <span>{agent.metrics.successRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${agent.metrics.successRate}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Response time (lower is better)</span>
              <span>{agent.metrics.avgResponseTime}s</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(10, 100 - (agent.metrics.avgResponseTime / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">System Health</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CPU Usage</span>
            <span className="text-sm font-medium text-gray-900">23%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Memory Usage</span>
            <span className="text-sm font-medium text-gray-900">156MB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Network Latency</span>
            <span className="text-sm font-medium text-gray-900">45ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Health Check</span>
            <span className="text-sm font-medium text-green-600">2 min ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}