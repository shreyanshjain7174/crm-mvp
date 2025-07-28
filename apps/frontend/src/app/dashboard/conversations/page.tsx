'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MessageSquare, Phone, Video, MoreHorizontal, ChevronDown, Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProgressStore } from '@/stores/userProgress';

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'waiting';
  platform: 'whatsapp' | 'email' | 'sms';
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio';
  isOutgoing: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    contactName: 'Priya Sharma',
    contactPhone: '+91 98765 43210',
    lastMessage: 'Thanks for the product demo! When can we schedule a call?',
    timestamp: '2 min ago',
    unreadCount: 2,
    status: 'active',
    platform: 'whatsapp',
    isOnline: true,
  },
  {
    id: '2',
    contactName: 'Rajesh Kumar',
    contactPhone: '+91 87654 32109',
    lastMessage: 'The pricing looks good. Let me discuss with my team.',
    timestamp: '15 min ago',
    unreadCount: 0,
    status: 'active',
    platform: 'whatsapp',
    isOnline: false,
  },
  {
    id: '3',
    contactName: 'Anita Patel',
    contactPhone: '+91 76543 21098',
    lastMessage: 'Can you send me the brochure again?',
    timestamp: '1 hour ago',
    unreadCount: 1,
    status: 'waiting',
    platform: 'whatsapp',
    isOnline: true,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'contact_1',
    senderName: 'Priya Sharma',
    content: 'Hi! I saw your CRM platform and I\'m interested in learning more.',
    timestamp: '10:30 AM',
    type: 'text',
    isOutgoing: false,
  },
  {
    id: '2',
    senderId: 'user',
    senderName: 'You',
    content: 'Hi Priya! Thank you for your interest. I\'d be happy to show you our platform. When would be a good time for a demo?',
    timestamp: '10:32 AM',
    type: 'text',
    isOutgoing: true,
  },
  {
    id: '3',
    senderId: 'contact_1',
    senderName: 'Priya Sharma',
    content: 'Thanks for the product demo! When can we schedule a call?',
    timestamp: '2 min ago',
    type: 'text',
    isOutgoing: false,
  },
];

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);
  const hasMessagingAccess = canAccessFeature('messaging:whatsapp');

  if (!hasMessagingAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
          <p className="text-muted-foreground">Manage customer conversations across WhatsApp, SMS, and email</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Conversations Feature Locked
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Send your first message to unlock conversation management. Add contacts and engage with customers to access this feature.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/contacts'}>
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredConversations = mockConversations.filter(conv => 
    conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // In a real app, this would send the message via API
    console.log('Sending message:', messageText);
    setMessageText('');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 overflow-auto m-0">
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ backgroundColor: 'var(--accent)' }}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedConversation?.id === conversation.id ? 'bg-accent' : 'hover:bg-accent/50'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.contactName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">{conversation.contactName}</p>
                        <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant={conversation.platform === 'whatsapp' ? 'default' : 'secondary'} className="text-xs">
                          {conversation.platform.toUpperCase()}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unread" className="flex-1 overflow-auto m-0">
            <div className="space-y-1 p-2">
              {filteredConversations.filter(conv => conv.unreadCount > 0).map((conversation) => (
                <div key={conversation.id} className="p-3 rounded-lg hover:bg-accent/50 cursor-pointer">
                  {/* Same conversation item structure */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{conversation.contactName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{conversation.contactName}</p>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>
                    <Badge variant="destructive">{conversation.unreadCount}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="flex-1 overflow-auto m-0">
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No archived conversations</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{selectedConversation.contactName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedConversation.contactName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.isOnline ? 'Online now' : 'Last seen 2 hours ago'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-muted/30">
              {mockMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-xs lg:max-w-md px-4 py-2 rounded-2xl
                    ${message.isOutgoing 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border border-border text-foreground'
                    }
                  `}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}