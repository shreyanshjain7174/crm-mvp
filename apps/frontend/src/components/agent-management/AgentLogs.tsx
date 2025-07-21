/**
 * Agent Logs - Real-time Activity Monitor
 * 
 * Shows live activity logs and events from individual agents
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock,
  Filter,
  Download,
  Search
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  action?: string
  duration?: number
}

interface AgentLogsProps {
  agentId: string
}

export function AgentLogs({ agentId }: AgentLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    // Mock log data - in production, this would come from WebSocket or API
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        level: 'success',
        message: 'WhatsApp message processed successfully',
        details: 'Customer inquiry about pricing responded with template #3',
        action: 'AUTO_REPLY',
        duration: 1.2
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        level: 'info',
        message: 'New message received from +91-9876543210',
        details: 'Message: "Hello, I need information about your services"',
        action: 'MESSAGE_RECEIVED'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        level: 'success',
        message: 'Lead qualification completed',
        details: 'Contact marked as hot lead based on interaction patterns',
        action: 'LEAD_QUALIFICATION',
        duration: 0.8
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        level: 'warning',
        message: 'Response time above threshold',
        details: 'AI processing took 3.2s (threshold: 3.0s)',
        action: 'PERFORMANCE_WARNING',
        duration: 3.2
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        level: 'info',
        message: 'Agent health check completed',
        details: 'All systems operational',
        action: 'HEALTH_CHECK'
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        level: 'error',
        message: 'Failed to send WhatsApp message',
        details: 'Network timeout - message queued for retry',
        action: 'SEND_MESSAGE_FAILED'
      }
    ]

    // Simulate real-time log updates
    setLogs(mockLogs)
    
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level: Math.random() > 0.8 ? 'warning' : Math.random() > 0.6 ? 'success' : 'info',
        message: 'New activity detected',
        details: 'Real-time log entry simulation',
        action: 'SYSTEM_EVENT',
        duration: Math.random() * 2
      }
      
      setLogs(prev => [newLog, ...prev.slice(0, 19)]) // Keep last 20 logs
    }, 10000) // Add new log every 10 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = logs

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query)
      )
    }

    setFilteredLogs(filtered)
  }, [logs, selectedLevel, searchQuery])

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'border-l-green-500 bg-green-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'error':
        return 'border-l-red-500 bg-red-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const levelCounts = logs.reduce(
    (counts, log) => {
      counts[log.level]++
      return counts
    },
    { info: 0, success: 0, warning: 0, error: 0 }
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
          <p className="text-sm text-gray-600">Real-time agent activity and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All levels ({logs.length})</option>
          <option value="info">Info ({levelCounts.info})</option>
          <option value="success">Success ({levelCounts.success})</option>
          <option value="warning">Warning ({levelCounts.warning})</option>
          <option value="error">Error ({levelCounts.error})</option>
        </select>
      </div>

      {/* Auto-scroll toggle */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="mr-2"
          />
          Auto-scroll
        </label>
      </div>

      {/* Log Entries */}
      <div className="bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No log entries found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-700 mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`p-4 border-l-4 ${getLogColor(log.level)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.level)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {log.duration && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {log.duration}s
                          </span>
                        )}
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                    
                    {log.details && (
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                    )}
                    
                    {log.action && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {log.action}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live monitoring active
        </div>
      </div>
    </div>
  )
}