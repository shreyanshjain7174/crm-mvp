'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  leadName: string;
  leadPhone: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: string;
  isAiGenerated?: boolean;
  aiConfidence?: number;
  leadId?: string;
}

export interface MessageStats {
  total: number;
  sent: number;
  received: number;
  aiGenerated: number;
  todayCount: number;
}

interface UseMessagesOptions {
  page?: number;
  limit?: number;
  search?: string;
  direction?: string;
  status?: string;
  leadId?: string;
}

interface MessageResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class MessagesAPI {
  private baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}/api/messages${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getMessages(options: UseMessagesOptions = {}): Promise<MessageResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);
    if (options.direction && options.direction !== 'all') params.append('direction', options.direction);
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.leadId) params.append('leadId', options.leadId);

    const query = params.toString();
    return this.request<MessageResponse>(query ? `?${query}` : '');
  }

  async getMessageStats(): Promise<MessageStats> {
    return this.request<MessageStats>('/stats');
  }

  async sendMessage(messageData: {
    leadId: string;
    content: string;
    isAiGenerated?: boolean;
  }): Promise<Message> {
    return this.request<Message>('', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getConversation(leadId: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversation/${leadId}`);
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${messageId}/read`, {
      method: 'PATCH',
    });
  }
}

const messagesAPI = new MessagesAPI();

export function useMessages(options: UseMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messagesAPI.getMessages(options);
      setMessages(response.messages);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.search, options.direction, options.status, options.leadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(async (messageData: {
    leadId: string;
    content: string;
    isAiGenerated?: boolean;
  }) => {
    try {
      const newMessage = await messagesAPI.sendMessage(messageData);
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messagesAPI.markAsRead(messageId);
      setMessages(prev => prev.map(message => 
        message.id === messageId 
          ? { ...message, status: 'READ' as const }
          : message
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  }, []);

  return {
    messages,
    loading,
    error,
    pagination,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}

export function useMessageStats() {
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    sent: 0,
    received: 0,
    aiGenerated: 0,
    todayCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messagesAPI.getMessageStats();
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch message stats');
      console.error('Error fetching message stats:', err);
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

export function useConversation(leadId: string) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await messagesAPI.getConversation(leadId);
      setConversation(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
      console.error('Error fetching conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    loading,
    error,
    refetch: fetchConversation,
  };
}