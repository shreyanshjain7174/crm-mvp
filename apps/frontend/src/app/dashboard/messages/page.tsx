'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Send, Phone, Bot, Clock } from 'lucide-react';

type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
type Direction = 'INBOUND' | 'OUTBOUND';

interface Message {
  id: string;
  leadName: string;
  leadPhone: string;
  content: string;
  direction: Direction;
  status: MessageStatus;
  timestamp: string;
  isAiGenerated?: boolean;
  aiConfidence?: number;
}

const mockMessages: Message[] = [
  {
    id: '1',
    leadName: 'Rajesh Kumar',
    leadPhone: '+91 98765 43210',
    content: 'Hi, I\'m interested in your services. Can you provide more details?',
    direction: 'INBOUND',
    status: 'READ',
    timestamp: 'Today 2:30 PM'
  },
  {
    id: '2',
    leadName: 'Rajesh Kumar',
    leadPhone: '+91 98765 43210',
    content: 'Thank you for your interest! I\'d be happy to help. Our services include comprehensive CRM solutions tailored for SMEs. Would you like to schedule a demo?',
    direction: 'OUTBOUND',
    status: 'DELIVERED',
    timestamp: 'Today 2:35 PM',
    isAiGenerated: true,
    aiConfidence: 89
  },
  {
    id: '3',
    leadName: 'Priya Sharma',
    leadPhone: '+91 87654 32109',
    content: 'What are your pricing plans?',
    direction: 'INBOUND',
    status: 'READ',
    timestamp: 'Yesterday 4:15 PM'
  },
  {
    id: '4',
    leadName: 'Priya Sharma',
    leadPhone: '+91 87654 32109',
    content: 'Our pricing starts at ₹2,999/month for our basic plan. It includes lead management, WhatsApp integration, and AI assistance. Would you like me to send you a detailed pricing sheet?',
    direction: 'OUTBOUND',
    status: 'READ',
    timestamp: 'Yesterday 4:20 PM',
    isAiGenerated: true,
    aiConfidence: 92
  },
  {
    id: '5',
    leadName: 'Amit Patel',
    leadPhone: '+91 76543 21098',
    content: 'Hello, I got your contact from a friend. Can we discuss your CRM solution?',
    direction: 'INBOUND',
    status: 'READ',
    timestamp: '2 days ago'
  }
];

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'READ': return 'bg-gray-100 text-gray-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
    }
  };

  const filteredMessages = mockMessages.filter(message =>
    message.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.leadPhone.includes(searchTerm)
  );

  const conversations = filteredMessages.reduce((acc, message) => {
    const key = message.leadPhone;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-gray-600">WhatsApp conversations and AI suggestions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800">
            WhatsApp Connected
          </Badge>
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {Object.entries(conversations).map(([phone, messages]) => {
                const latestMessage = messages[messages.length - 1];
                const unreadCount = messages.filter(m => 
                  m.direction === 'INBOUND' && m.status === 'DELIVERED'
                ).length;

                return (
                  <div
                    key={phone}
                    className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                      selectedLead === phone ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setSelectedLead(phone)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{latestMessage.leadName}</h4>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{latestMessage.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{latestMessage.timestamp}</span>
                      <Badge className={`text-xs ${getStatusColor(latestMessage.status)}`}>
                        {latestMessage.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="col-span-2">
          {selectedLead ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {conversations[selectedLead]?.[0]?.leadName}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{selectedLead}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bot className="h-4 w-4" />
                      AI Suggest
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-96">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                  {conversations[selectedLead]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'OUTBOUND'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${
                            message.direction === 'OUTBOUND' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {message.timestamp}
                          </span>
                          {message.isAiGenerated && (
                            <div className="flex items-center space-x-1">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">AI ({message.aiConfidence}%)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="outline" size="sm">
                      <Bot className="h-4 w-4 mr-2" />
                      Generate AI Response
                    </Button>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Response time: ~2 minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}