'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'lead' | 'message' | 'ai' | 'system' | 'pipeline' | 'contact' | 'workflow' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionUrl?: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  starred: number;
  urgent: number;
}

export interface NotificationPreferences {
  category: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  desktopEnabled: boolean;
  soundEnabled: boolean;
}

interface UseNotificationsOptions {
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread' | 'starred' | 'urgent';
  category?: string;
  search?: string;
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NotificationsAPI {
  private baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = localStorage.getItem('token');
    
    // Auto-login for development if no token
    if (!token && process.env.NODE_ENV !== 'production') {
      try {
        const loginResponse = await fetch(`${this.baseUrl}/api/auth/dev-login`, {
          method: 'POST',
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          token = loginData.token;
        }
      } catch (error) {
        console.warn('Auto-login failed:', error);
      }
    }
    
    const response = await fetch(`${this.baseUrl}/api/notifications${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(options: UseNotificationsOptions = {}): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.filter && options.filter !== 'all') params.append('filter', options.filter);
    if (options.category && options.category !== 'all') params.append('category', options.category);
    if (options.search) params.append('search', options.search);

    const query = params.toString();
    return this.request<NotificationResponse>(query ? `?${query}` : '');
  }

  async getNotificationStats(): Promise<NotificationStats> {
    return this.request<NotificationStats>('/stats');
  }

  async markAsRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${id}/read`, {
      method: 'PATCH',
    });
  }

  async toggleStar(id: string): Promise<{ success: boolean; isStarred: boolean }> {
    return this.request<{ success: boolean; isStarred: boolean }>(`/${id}/star`, {
      method: 'PATCH',
    });
  }

  async markAllAsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async getPreferences(): Promise<{ preferences: NotificationPreferences[] }> {
    return this.request<{ preferences: NotificationPreferences[] }>('/preferences');
  }

  async updatePreferences(category: string, preferences: Omit<NotificationPreferences, 'category'>): Promise<{ success: boolean; preferences: NotificationPreferences }> {
    return this.request<{ success: boolean; preferences: NotificationPreferences }>(`/preferences/${category}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}

const notificationsAPI = new NotificationsAPI();

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsAPI.getNotifications(options);
      setNotifications(response.notifications);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.filter, options.category, options.search]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const toggleStar = useCallback(async (id: string) => {
    try {
      const response = await notificationsAPI.toggleStar(id);
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, isStarred: response.isStarred } : notification
      ));
    } catch (err) {
      console.error('Error toggling notification star:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    pagination,
    markAsRead,
    toggleStar,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    starred: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsAPI.getNotificationStats();
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification stats');
      console.error('Error fetching notification stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsAPI.getPreferences();
      setPreferences(response.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification preferences');
      console.error('Error fetching notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (category: string, newPreferences: Omit<NotificationPreferences, 'category'>) => {
    try {
      const response = await notificationsAPI.updatePreferences(category, newPreferences);
      setPreferences(prev => prev.map(pref => 
        pref.category === category ? response.preferences : pref
      ));
      return response.success;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      return false;
    }
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}