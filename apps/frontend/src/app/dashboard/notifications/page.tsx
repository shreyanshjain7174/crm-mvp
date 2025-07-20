'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Check, 
  X, 
  Search,
  Filter,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  MessageSquare,
  Users,
  Target,
  Zap,
  Clock,
  MoreHorizontal,
  Archive,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Globe
} from 'lucide-react';
import { useUserProgressStore } from '@/stores/userProgress';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'lead' | 'message' | 'ai' | 'system' | 'pipeline';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  relatedEntity?: {
    type: 'contact' | 'lead' | 'workflow';
    id: string;
    name: string;
  };
}

export default function NotificationsPage() {
  const { stats } = useUserProgressStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'urgent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        category: 'lead',
        title: 'New Lead Added',
        message: 'Rajesh Kumar has been added as a new lead from WhatsApp',
        timestamp: '2 minutes ago',
        isRead: false,
        isStarred: false,
        priority: 'medium',
        actionRequired: true,
        relatedEntity: { type: 'contact', id: '123', name: 'Rajesh Kumar' }
      },
      {
        id: '2',
        type: 'success',
        category: 'ai',
        title: 'AI Response Approved',
        message: 'Your AI-generated response to Priya Sharma has been successfully sent',
        timestamp: '5 minutes ago',
        isRead: false,
        isStarred: true,
        priority: 'low',
        actionRequired: false,
        relatedEntity: { type: 'contact', id: '456', name: 'Priya Sharma' }
      },
      {
        id: '3',
        type: 'warning',
        category: 'pipeline',
        title: 'Lead Score Threshold Reached',
        message: 'Amit Patel has reached a lead score of 85. Consider moving to qualified stage.',
        timestamp: '15 minutes ago',
        isRead: true,
        isStarred: false,
        priority: 'high',
        actionRequired: true,
        relatedEntity: { type: 'lead', id: '789', name: 'Amit Patel' }
      },
      {
        id: '4',
        type: 'error',
        category: 'system',
        title: 'Workflow Execution Failed',
        message: 'The "Welcome New Leads" workflow failed to execute due to template error',
        timestamp: '1 hour ago',
        isRead: true,
        isStarred: false,
        priority: 'urgent',
        actionRequired: true,
        relatedEntity: { type: 'workflow', id: 'wf-001', name: 'Welcome New Leads' }
      },
      {
        id: '5',
        type: 'info',
        category: 'message',
        title: 'New WhatsApp Message',
        message: 'Received message from Sunita Singh: "Can we schedule a call tomorrow?"',
        timestamp: '2 hours ago',
        isRead: true,
        isStarred: false,
        priority: 'medium',
        actionRequired: true,
        relatedEntity: { type: 'contact', id: '101', name: 'Sunita Singh' }
      },
      {
        id: '6',
        type: 'success',
        category: 'pipeline',
        title: 'Lead Converted',
        message: 'Congratulations! Ravi Gupta has been successfully converted to a customer',
        timestamp: '3 hours ago',
        isRead: true,
        isStarred: true,
        priority: 'medium',
        actionRequired: false,
        relatedEntity: { type: 'lead', id: '202', name: 'Ravi Gupta' }
      },
      {
        id: '7',
        type: 'info',
        category: 'ai',
        title: 'AI Suggestion Available',
        message: 'New AI suggestions available for improving your follow-up messages',
        timestamp: '4 hours ago',
        isRead: true,
        isStarred: false,
        priority: 'low',
        actionRequired: false
      },
      {
        id: '8',
        type: 'warning',
        category: 'system',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance window: Tonight 11 PM - 1 AM IST',
        timestamp: '6 hours ago',
        isRead: true,
        isStarred: false,
        priority: 'medium',
        actionRequired: false
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lead': return <Users className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'ai': return <Zap className="h-4 w-4" />;
      case 'pipeline': return <Target className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'starred' && notification.isStarred) ||
      (filter === 'urgent' && notification.priority === 'urgent');
    
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
    
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;
  const starredCount = notifications.filter(n => n.isStarred).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const toggleStar = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isStarred: !n.isStarred } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with real-time alerts and important CRM events
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
            <p className="text-sm text-gray-600">Total Notifications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
            <p className="text-sm text-gray-600">Unread</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{starredCount}</p>
            <p className="text-sm text-gray-600">Starred</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
            <p className="text-sm text-gray-600">Urgent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="pipeline">Pipeline</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Management */}
      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  'cursor-pointer hover:shadow-md transition-shadow',
                  !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.type)}
                      {getCategoryIcon(notification.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className={cn(
                            'font-semibold',
                            !notification.isRead && 'text-blue-900'
                          )}>
                            {notification.title}
                          </h4>
                          <Badge className={cn('text-xs', getPriorityColor(notification.priority))}>
                            {notification.priority}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{notification.timestamp}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(notification.id);
                            }}
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              notification.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'
                            )} />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      
                      {notification.relatedEntity && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <span>Related {notification.relatedEntity.type}:</span>
                          <span className="font-medium">{notification.relatedEntity.name}</span>
                        </div>
                      )}
                      
                      {notification.actionRequired && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Take Action
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Desktop Notifications</Label>
                    <p className="text-sm text-gray-600">Show browser notifications for important alerts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Sound Notifications</Label>
                    <p className="text-sm text-gray-600">Play sound for new notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Digest</Label>
                    <p className="text-sm text-gray-600">Receive daily email summary of notifications</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Mobile Push Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications to mobile devices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { category: 'New Leads', description: 'When new leads are added to your CRM', enabled: true },
                { category: 'WhatsApp Messages', description: 'New incoming WhatsApp messages', enabled: true },
                { category: 'AI Suggestions', description: 'AI-generated response suggestions', enabled: true },
                { category: 'Pipeline Changes', description: 'When leads move through pipeline stages', enabled: false },
                { category: 'Lead Scoring', description: 'Lead score threshold alerts', enabled: true },
                { category: 'System Updates', description: 'System maintenance and updates', enabled: false },
                { category: 'Workflow Alerts', description: 'Automation workflow notifications', enabled: true },
                { category: 'Achievement Unlocks', description: 'When you unlock new features or achievements', enabled: true }
              ].map((pref, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">{pref.category}</Label>
                    <p className="text-sm text-gray-600">{pref.description}</p>
                  </div>
                  <Switch defaultChecked={pref.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">In-App Notifications</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Receive notifications directly in the CRM interface
                </p>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="font-semibold mb-2">Email Notifications</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get important alerts via email
                </p>
                <Badge className="bg-yellow-100 text-yellow-800">Configured</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Smartphone className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <h3 className="font-semibold mb-2">Mobile Push</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Push notifications to mobile devices
                </p>
                <Badge className="bg-gray-100 text-gray-800">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}