'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Download, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  agent: string;
  action: string;
  details: string;
  leadId?: string;
  leadName?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export function AgentLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-15T10:30:25Z',
      level: 'success',
      agent: 'Message Generation Agent',
      action: 'Response Generated',
      details: 'Generated contextual response for lead Rajesh Kumar',
      leadId: 'lead_123',
      leadName: 'Rajesh Kumar',
      duration: 0.8,
      metadata: { confidence: 89, messageLength: 142, template: 'follow_up' }
    },
    {
      id: '2',
      timestamp: '2024-01-15T10:29:45Z',
      level: 'info',
      agent: 'Lead Qualification Agent',
      action: 'Lead Scored',
      details: 'Calculated lead score based on engagement patterns',
      leadId: 'lead_124',
      leadName: 'Priya Sharma',
      duration: 1.2,
      metadata: { score: 78, factors: ['email_opens', 'website_visits', 'demo_request'] }
    },
    {
      id: '3',
      timestamp: '2024-01-15T10:28:12Z',
      level: 'warning',
      agent: 'Follow-up Scheduler',
      action: 'Schedule Conflict',
      details: 'Attempted to schedule follow-up but found calendar conflict',
      leadId: 'lead_125',
      leadName: 'Amit Patel',
      metadata: { conflictTime: '2024-01-16T14:00:00Z', suggestedAlternative: '2024-01-16T15:00:00Z' }
    },
    {
      id: '4',
      timestamp: '2024-01-15T10:27:33Z',
      level: 'error',
      agent: 'WhatsApp Integration Agent',
      action: 'Message Send Failed',
      details: 'Failed to send WhatsApp message due to API rate limit',
      leadId: 'lead_126',
      leadName: 'Neha Singh',
      metadata: { error: 'RATE_LIMIT_EXCEEDED', retryAfter: 60 }
    },
    {
      id: '5',
      timestamp: '2024-01-15T10:26:55Z',
      level: 'success',
      agent: 'Intent Recognition Agent',
      action: 'Intent Classified',
      details: 'Classified incoming message intent as pricing_inquiry',
      leadId: 'lead_127',
      leadName: 'Vikram Gupta',
      duration: 0.3,
      metadata: { intent: 'pricing_inquiry', confidence: 0.94, entities: ['plan_type', 'budget_range'] }
    },
    {
      id: '6',
      timestamp: '2024-01-15T10:25:18Z',
      level: 'info',
      agent: 'Context Memory Agent',
      action: 'Context Retrieved',
      details: 'Retrieved conversation history and lead profile for context',
      leadId: 'lead_123',
      leadName: 'Rajesh Kumar',
      duration: 0.6,
      metadata: { historyItems: 15, profileFields: 8, relevanceScore: 0.87 }
    }
  ]);

  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);
  const [filters, setFilters] = useState({
    level: 'all' as 'all' | 'info' | 'warning' | 'error' | 'success',
    agent: 'all' as string,
    timeRange: '1h' as '1h' | '6h' | '24h' | '7d'
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time logs
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.8 ? 'error' : Math.random() > 0.6 ? 'warning' : Math.random() > 0.3 ? 'success' : 'info',
        agent: ['Message Generation Agent', 'Lead Qualification Agent', 'Intent Recognition Agent'][Math.floor(Math.random() * 3)],
        action: ['Processing Request', 'Analyzing Data', 'Generating Response'][Math.floor(Math.random() * 3)],
        details: 'Real-time agent activity',
        duration: Math.random() * 2 + 0.1
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.agent !== 'all') {
      filtered = filtered.filter(log => log.agent === filters.agent);
    }

    // Time range filtering would be implemented here
    setFilteredLogs(filtered);
  }, [logs, filters]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const uniqueAgents = Array.from(new Set(logs.map(log => log.agent)));

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.agent}
            onChange={(e) => setFilters(prev => ({ ...prev, agent: e.target.value }))}
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>No logs found matching your filters</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map((log) => {
                  const LevelIcon = getLevelIcon(log.level);
                  return (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${getLevelColor(log.level)}`}>
                          <LevelIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-sm font-medium text-gray-900">{log.action}</h4>
                              <Badge variant="outline" className="text-xs">
                                {log.agent}
                              </Badge>
                              {log.duration && (
                                <span className="text-xs text-gray-500">{log.duration.toFixed(1)}s</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                          {log.leadName && (
                            <p className="text-xs text-blue-600 mt-1">Lead: {log.leadName}</p>
                          )}
                          {log.metadata && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <pre className="text-gray-600 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Total Logs</p>
          <p className="text-2xl font-bold text-blue-900">{filteredLogs.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-medium">Success</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredLogs.filter(l => l.level === 'success').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-600 font-medium">Warnings</p>
          <p className="text-2xl font-bold text-yellow-900">
            {filteredLogs.filter(l => l.level === 'warning').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600 font-medium">Errors</p>
          <p className="text-2xl font-bold text-red-900">
            {filteredLogs.filter(l => l.level === 'error').length}
          </p>
        </div>
      </div>
    </div>
  );
}