'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, CheckCircle, XCircle, Clock, MessageSquare, TrendingUp, Settings, Zap } from 'lucide-react';

type SuggestionType = 'MESSAGE' | 'FOLLOW_UP' | 'STATUS_CHANGE' | 'PRIORITY_UPDATE';
type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AISuggestion {
  id: string;
  type: SuggestionType;
  leadName: string;
  content: string;
  context: string;
  confidence: number;
  status: SuggestionStatus;
  createdAt: string;
  reason: string;
}

const mockSuggestions: AISuggestion[] = [
  {
    id: '1',
    type: 'MESSAGE',
    leadName: 'Rajesh Kumar',
    content: 'Hi Rajesh! Thanks for your interest in our CRM solution. Based on your business size, I recommend starting with our Professional plan. Would you like me to schedule a personalized demo this week?',
    context: 'Lead asked about pricing and business size is 25-50 employees',
    confidence: 89,
    status: 'PENDING',
    createdAt: '2 minutes ago',
    reason: 'Lead engagement pattern suggests immediate follow-up needed'
  },
  {
    id: '2',
    type: 'STATUS_CHANGE',
    leadName: 'Priya Sharma',
    content: 'Change status from WARM to HOT',
    context: 'Multiple message exchanges, asked for demo, high engagement',
    confidence: 92,
    status: 'PENDING',
    createdAt: '5 minutes ago',
    reason: 'Lead behavior indicates strong purchase intent'
  },
  {
    id: '3',
    type: 'FOLLOW_UP',
    leadName: 'Amit Patel',
    content: 'Schedule follow-up call for tomorrow 2:00 PM',
    context: 'Lead interested but needs more information about integration',
    confidence: 78,
    status: 'APPROVED',
    createdAt: '1 hour ago',
    reason: 'Optimal timing based on lead\'s response pattern'
  },
  {
    id: '4',
    type: 'PRIORITY_UPDATE',
    leadName: 'Neha Singh',
    content: 'Increase priority to URGENT',
    context: 'Lead mentioned immediate need, budget approved',
    confidence: 95,
    status: 'APPROVED',
    createdAt: '2 hours ago',
    reason: 'High-value lead with immediate purchase timeline'
  },
  {
    id: '5',
    type: 'MESSAGE',
    leadName: 'Vikram Gupta',
    content: 'Thank you for choosing our CRM solution! I\'ve sent the onboarding details to your email. Our team will contact you within 24 hours to begin the setup process.',
    context: 'Lead just converted, needs onboarding information',
    confidence: 87,
    status: 'REJECTED',
    createdAt: '3 hours ago',
    reason: 'Post-conversion communication template'
  }
];

export default function AIPage() {
  const [selectedStatus, setSelectedStatus] = useState<SuggestionStatus | 'ALL'>('ALL');

  const filteredSuggestions = mockSuggestions.filter(suggestion =>
    selectedStatus === 'ALL' || suggestion.status === selectedStatus
  );

  const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
      case 'MESSAGE': return MessageSquare;
      case 'FOLLOW_UP': return Clock;
      case 'STATUS_CHANGE': return TrendingUp;
      case 'PRIORITY_UPDATE': return Zap;
    }
  };

  const getTypeColor = (type: SuggestionType) => {
    switch (type) {
      case 'MESSAGE': return 'bg-blue-100 text-blue-800';
      case 'FOLLOW_UP': return 'bg-yellow-100 text-yellow-800';
      case 'STATUS_CHANGE': return 'bg-green-100 text-green-800';
      case 'PRIORITY_UPDATE': return 'bg-red-100 text-red-800';
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

  const pendingCount = mockSuggestions.filter(s => s.status === 'PENDING').length;
  const approvedCount = mockSuggestions.filter(s => s.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
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
            <p className="text-2xl font-bold text-primary">89.5%</p>
            <p className="text-sm text-gray-600">Accuracy Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
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
            <p className="text-2xl font-bold text-blue-600">24%</p>
            <p className="text-sm text-gray-600">Response Time Reduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => {
              const TypeIcon = getTypeIcon(suggestion.type);
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
                            <h3 className="font-semibold text-gray-900">{suggestion.leadName}</h3>
                            <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
                              {suggestion.type.replace('_', ' ')}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(suggestion.status)}`}>
                              {suggestion.status}
                            </Badge>
                            <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                              {suggestion.confidence}% confidence
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <p className="text-gray-900 text-sm font-medium mb-2">Suggested Action:</p>
                            <p className="text-gray-700">{suggestion.content}</p>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Context:</strong> {suggestion.context}</p>
                            <p><strong>Reasoning:</strong> {suggestion.reason}</p>
                            <p><strong>Generated:</strong> {suggestion.createdAt}</p>
                          </div>
                        </div>
                      </div>
                      {suggestion.status === 'PENDING' && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
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