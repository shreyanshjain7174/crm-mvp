'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useNotifications, useNotificationStats, useNotificationPreferences } from '@/hooks/use-notifications';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'urgent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use real backend data
  const { 
    notifications, 
    loading: notificationsLoading, 
    error: notificationsError,
    markAsRead, 
    toggleStar, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications({
    filter,
    category: categoryFilter,
    search: searchQuery,
    limit: 20
  });

  const { 
    stats: notificationStats, 
    loading: statsLoading 
  } = useNotificationStats();

  const { 
    preferences, 
    loading: preferencesLoading, 
    updatePreferences 
  } = useNotificationPreferences();

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

  // Show loading state
  if (notificationsLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading notifications...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (notificationsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load notifications</h3>
            <p className="text-gray-600">{notificationsError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <p className="text-2xl font-bold text-blue-600">{notificationStats.total}</p>
            <p className="text-sm text-gray-600">Total Notifications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{notificationStats.unread}</p>
            <p className="text-sm text-gray-600">Unread</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{notificationStats.starred}</p>
            <p className="text-sm text-gray-600">Starred</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-600">{notificationStats.urgent}</p>
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
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
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
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading preferences...</span>
                </div>
              ) : (
                preferences.map((pref) => (
                  <div key={pref.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium capitalize">{pref.category}</Label>
                      <p className="text-sm text-gray-600">
                        {pref.category === 'lead' && 'When new leads are added to your CRM'}
                        {pref.category === 'message' && 'New incoming messages from contacts'}
                        {pref.category === 'ai' && 'AI-generated response suggestions and updates'}
                        {pref.category === 'pipeline' && 'When leads move through pipeline stages'}
                        {pref.category === 'system' && 'System maintenance and updates'}
                        {pref.category === 'workflow' && 'Automation workflow notifications'}
                        {pref.category === 'achievement' && 'When you unlock new features or achievements'}
                        {pref.category === 'contact' && 'Contact-related notifications and updates'}
                      </p>
                    </div>
                    <Switch 
                      checked={pref.inAppEnabled} 
                      onCheckedChange={async (checked) => {
                        await updatePreferences(pref.category, {
                          ...pref,
                          inAppEnabled: checked
                        });
                      }}
                    />
                  </div>
                ))
              )}
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