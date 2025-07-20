'use client';

import { Bell, Search, LogOut, Settings, CheckCircle, AlertCircle, Info, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        type: 'info',
        title: 'New Lead Added',
        message: 'Rajesh Kumar has been added as a new lead',
        timestamp: '2 min ago',
        isRead: false
      },
      {
        id: '2',
        type: 'success',
        title: 'AI Response Approved',
        message: 'Your AI response has been sent successfully',
        timestamp: '5 min ago',
        isRead: false
      },
      {
        id: '3',
        type: 'warning',
        title: 'Lead Score Alert',
        message: 'Amit Patel reached score threshold of 85',
        timestamp: '15 min ago',
        isRead: true
      },
      {
        id: '4',
        type: 'info',
        title: 'New WhatsApp Message',
        message: 'Message from Sunita Singh',
        timestamp: '1 hour ago',
        isRead: true
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfile = () => {
    router.push('/dashboard/settings');
  };

  const handleNotifications = () => {
    router.push('/dashboard/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search leads, messages..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-80"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Notifications</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleNotifications}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 4).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                    <div className="flex items-start gap-3 w-full">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            !notification.isRead && 'text-blue-900'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNotifications}
                  className="w-full"
                >
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <div className="text-sm">
            <p className="font-medium">Real-time Status</p>
            <p className="text-green-600 text-xs">● Connected</p>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}