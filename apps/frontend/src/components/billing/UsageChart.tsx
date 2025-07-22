/**
 * Usage Chart Component
 * 
 * Displays usage analytics and trends over time for all agents
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react'

interface UsageData {
  date: string
  agentName: string
  agentId: string
  usageUnit: string
  dailyUsage: number
  dailyCost: number
}

interface UsageChartProps {
  businessId: string
}

export function UsageChart({ businessId }: UsageChartProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('7days')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsageData()
  }, [businessId, selectedPeriod, selectedAgent])

  const loadUsageData = async () => {
    setLoading(true)
    
    // Mock data for demonstration
    const mockData: UsageData[] = [
      // Cozmox Voice Agent data
      { date: '2024-07-15', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 12.5, dailyCost: 18.75 },
      { date: '2024-07-16', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 8.2, dailyCost: 12.30 },
      { date: '2024-07-17', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 15.8, dailyCost: 23.70 },
      { date: '2024-07-18', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 22.3, dailyCost: 33.45 },
      { date: '2024-07-19', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 18.7, dailyCost: 28.05 },
      { date: '2024-07-20', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 9.4, dailyCost: 14.10 },
      { date: '2024-07-21', agentName: 'Cozmox Voice Assistant', agentId: 'cozmox-voice-agent', usageUnit: 'minutes', dailyUsage: 16.8, dailyCost: 25.20 },
      
      // WhatsApp Responder data
      { date: '2024-07-15', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 45, dailyCost: 0 },
      { date: '2024-07-16', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 32, dailyCost: 0 },
      { date: '2024-07-17', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 58, dailyCost: 0 },
      { date: '2024-07-18', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 67, dailyCost: 0 },
      { date: '2024-07-19', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 41, dailyCost: 0 },
      { date: '2024-07-20', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 29, dailyCost: 0 },
      { date: '2024-07-21', agentName: 'WhatsApp AI Responder', agentId: 'whatsapp-ai-responder', usageUnit: 'messages', dailyUsage: 52, dailyCost: 0 }
    ]

    await new Promise(resolve => setTimeout(resolve, 600))
    setUsageData(mockData)
    setLoading(false)
  }

  // Filter data based on selections
  const filteredData = usageData.filter(item => 
    selectedAgent === 'all' || item.agentId === selectedAgent
  )

  // Group by agent for summary
  const agentSummary = filteredData.reduce((acc, item) => {
    if (!acc[item.agentId]) {
      acc[item.agentId] = {
        name: item.agentName,
        totalUsage: 0,
        totalCost: 0,
        usageUnit: item.usageUnit,
        dataPoints: []
      }
    }
    acc[item.agentId].totalUsage += item.dailyUsage
    acc[item.agentId].totalCost += item.dailyCost
    acc[item.agentId].dataPoints.push(item)
    return acc
  }, {} as Record<string, any>)

  // Calculate trends
  const calculateTrend = (dataPoints: UsageData[]) => {
    if (dataPoints.length < 2) return { direction: 'stable', percentage: 0 }
    
    const recent = dataPoints.slice(-3).reduce((sum, item) => sum + item.dailyUsage, 0) / 3
    const previous = dataPoints.slice(-6, -3).reduce((sum, item) => sum + item.dailyUsage, 0) / 3
    
    if (previous === 0) return { direction: 'stable', percentage: 0 }
    
    const change = ((recent - previous) / previous) * 100
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
                <div className="flex space-x-1">
                  {[
                    { value: '7days', label: '7 Days' },
                    { value: '30days', label: '30 Days' },
                    { value: '90days', label: '90 Days' }
                  ].map(period => (
                    <Button
                      key={period.value}
                      variant={selectedPeriod === period.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period.value)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Agent Filter</label>
                <div className="flex space-x-1">
                  <Button
                    variant={selectedAgent === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAgent('all')}
                  >
                    All Agents
                  </Button>
                  {Object.keys(agentSummary).map(agentId => (
                    <Button
                      key={agentId}
                      variant={selectedAgent === agentId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAgent(agentId)}
                    >
                      {agentSummary[agentId].name.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(agentSummary).map(([agentId, summary]) => {
          const trend = calculateTrend(summary.dataPoints)
          return (
            <Card key={agentId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{summary.name}</span>
                  </div>
                  <Badge variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}>
                    {trend.direction === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {trend.direction === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {trend.percentage > 0 ? `${trend.percentage.toFixed(0)}%` : 'Stable'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Usage:</span>
                    <span className="font-medium">{summary.totalUsage.toFixed(1)} {summary.usageUnit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">
                      {summary.totalCost > 0 ? `₹${summary.totalCost.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Daily:</span>
                    <span className="font-medium">
                      {(summary.totalUsage / summary.dataPoints.length).toFixed(1)} {summary.usageUnit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Breakdown</CardTitle>
          <CardDescription>Detailed daily usage and cost information</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Agent</th>
                  <th className="text-right p-2">Usage</th>
                  <th className="text-right p-2">Cost</th>
                  <th className="text-right p-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {new Date(item.date).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span>{item.agentName}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {item.dailyUsage.toFixed(1)} {item.usageUnit}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.dailyCost > 0 ? `₹${item.dailyCost.toFixed(2)}` : 'Free'}
                    </td>
                    <td className="p-2 text-right">
                      <Badge variant="outline" className="text-xs">
                        {item.dailyUsage > 15 ? 'High' : item.dailyUsage > 8 ? 'Medium' : 'Low'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}