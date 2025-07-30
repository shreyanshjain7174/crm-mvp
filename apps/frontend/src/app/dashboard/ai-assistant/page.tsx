'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyAI } from '@/components/empty-states/EmptyAI';
import { SimpleFeatureReveal } from '@/components/animations/SimpleFeatureReveal';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Zap,
  Loader2,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, AISuggestion, AIAnalytics } from '@/lib/api';

type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AIAssistantPage() {
  const router = useRouter();
  const canAccessAI = useCanAccessFeature()('ai:suggestions');
  const { stats, incrementStat, pendingCelebrations, completePendingCelebration } = useUserProgressStore();
  
  const [showFeatureReveal, setShowFeatureReveal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SuggestionStatus | 'ALL'>('ALL');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Load AI data
  useEffect(() => {
    const loadAIData = async () => {
      if (!canAccessAI) return;
      
      try {
        setLoading(true);
        const [suggestionsData, analyticsData] = await Promise.all([
          apiClient.getPendingAISuggestions(),
          apiClient.getAIAnalytics()
        ]);
        
        setSuggestions(suggestionsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading AI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAIData();
  }, [canAccessAI]);
  
  // Check if this is the first time accessing AI assistant
  useEffect(() => {
    const aiCelebration = pendingCelebrations.find(c => c === 'feature-ai:suggestions');
    if (aiCelebration && canAccessAI) {
      setShowFeatureReveal(true);
      completePendingCelebration(aiCelebration);
    }
  }, [pendingCelebrations, canAccessAI, completePendingCelebration]);

  const handleSendMoreMessages = () => {
    router.push('/dashboard/messages');
  };

  const handleViewPipeline = () => {
    router.push('/dashboard/pipeline');
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      const updatedSuggestion = await apiClient.approveAISuggestion(suggestionId, { approved: true });
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...updatedSuggestion, status: 'APPROVED' as SuggestionStatus } : s)
      );
      incrementStat('aiInteractions');
    } catch (error) {
      console.error('Error approving suggestion:', error);
      alert('Failed to approve suggestion. Please try again.');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      const updatedSuggestion = await apiClient.approveAISuggestion(suggestionId, { approved: false });
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...updatedSuggestion, status: 'REJECTED' as SuggestionStatus } : s)
      );
      incrementStat('aiInteractions');
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      alert('Failed to reject suggestion. Please try again.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return MessageSquare;
      case 'FOLLOW_UP': return Clock;
      case 'STATUS_CHANGE': return TrendingUp;
      case 'PRIORITY_UPDATE': return Zap;
      default: return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MESSAGE': return 'bg-blue-100 text-blue-800';
      case 'FOLLOW_UP': return 'bg-yellow-100 text-yellow-800';
      case 'STATUS_CHANGE': return 'bg-green-100 text-green-800';
      case 'PRIORITY_UPDATE': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: SuggestionStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper to get suggestion status
  const getSuggestionStatus = (suggestion: AISuggestion): SuggestionStatus => {
    if (suggestion.executed) return 'APPROVED';
    if (suggestion.approved === false) return 'REJECTED';
    return 'PENDING';
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const status = getSuggestionStatus(suggestion);
    return selectedStatus === 'ALL' || status === selectedStatus;
  });

  const pendingCount = suggestions.filter(s => getSuggestionStatus(s) === 'PENDING').length;
  const approvedCount = suggestions.filter(s => getSuggestionStatus(s) === 'APPROVED').length;
  const rejectedCount = suggestions.filter(s => getSuggestionStatus(s) === 'REJECTED').length;

  // Show empty state if AI is locked
  if (!canAccessAI) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyAI
          onSendMessages={handleSendMoreMessages}
          onViewPipeline={handleViewPipeline}
          messageCount={stats.messagesSent}
          requiredMessages={50}
          isLocked={true}
        />
      </div>
    );
  }

  // Show feature reveal if it's the first time
  if (showFeatureReveal) {
    return (
      <SimpleFeatureReveal
        featureName="AI Assistant"
        description="Get intelligent suggestions for messages, lead prioritization, and automated responses!"
        onContinue={() => setShowFeatureReveal(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
          <p className="text-gray-600">AI-powered suggestions and automation</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800">
            <Bot className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure AI
          </Button>
        </div>
      </div>

      {/* AI Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Bot className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-primary">
              {analytics ? `${analytics.averageConfidence.toFixed(1)}%` : '--'}
            </p>
            <p className="text-sm text-gray-600">Avg Confidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            <p className="text-sm text-gray-600">Pending Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-sm text-gray-600">Approved Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {analytics ? `${analytics.approvalRate.toFixed(1)}%` : '--'}
            </p>
            <p className="text-sm text-gray-600">Approval Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Total Suggestions</span>
                <span className="font-medium">{analytics?.totalSuggestions || 0}</span>
              </div>
              <Progress value={Math.min((analytics?.totalSuggestions || 0) * 5, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Execution Rate</span>
                <span className="font-medium">{analytics ? `${analytics.executionRate.toFixed(1)}%` : '0%'}</span>
              </div>
              <Progress value={analytics?.executionRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Average Confidence</span>
                <span className="font-medium">{analytics ? `${analytics.averageConfidence.toFixed(1)}%` : '0%'}</span>
              </div>
              <Progress value={analytics?.averageConfidence || 0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Suggestions</CardTitle>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as SuggestionStatus | 'ALL')}
            >
              <option value="ALL">All Suggestions</option>
              <option value="PENDING">Pending ({pendingCount})</option>
              <option value="APPROVED">Approved ({approvedCount})</option>
              <option value="REJECTED">Rejected ({rejectedCount})</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading AI suggestions...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => {
                const TypeIcon = getTypeIcon(suggestion.type);
                const status = getSuggestionStatus(suggestion);
                const leadName = suggestion.lead?.name || 'Unknown Lead';
                const formattedDate = new Date(suggestion.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <Card key={suggestion.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-2 rounded-full bg-primary/10">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-gray-900">{leadName}</h3>
                              <Badge className={cn('text-xs', getTypeColor(suggestion.type))}>
                                {suggestion.type.replace('_', ' ')}
                              </Badge>
                              <Badge className={cn('text-xs', getStatusColor(status))}>
                                {status}
                              </Badge>
                              <span className={cn('text-sm font-medium', getConfidenceColor(suggestion.confidence * 100))}>
                                {(suggestion.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 mb-3">
                              <p className="text-gray-900 text-sm font-medium mb-2">Suggested Action:</p>
                              <p className="text-gray-700">{suggestion.content}</p>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {suggestion.context && (
                                <p><strong>Context:</strong> {suggestion.context}</p>
                              )}
                              <p><strong>Generated:</strong> {formattedDate}</p>
                              {suggestion.lead && (
                                <div className="flex gap-4">
                                  <p><strong>Lead Status:</strong> {suggestion.lead.status}</p>
                                  <p><strong>Priority:</strong> {suggestion.lead.priority}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {status === 'PENDING' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveSuggestion(suggestion.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredSuggestions.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
              <p className="text-gray-600">Try adjusting your filter or check back later for new AI suggestions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Configuration Preview */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Response Generation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Auto-response threshold:</span>
                  <span className="font-medium">80% confidence</span>
                </div>
                <div className="flex justify-between">
                  <span>Response tone:</span>
                  <span className="font-medium">Professional & Friendly</span>
                </div>
                <div className="flex justify-between">
                  <span>Max response length:</span>
                  <span className="font-medium">150 words</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Lead Scoring</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Scoring model:</span>
                  <span className="font-medium">Advanced ML</span>
                </div>
                <div className="flex justify-between">
                  <span>Update frequency:</span>
                  <span className="font-medium">Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority threshold:</span>
                  <span className="font-medium">75% score</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}