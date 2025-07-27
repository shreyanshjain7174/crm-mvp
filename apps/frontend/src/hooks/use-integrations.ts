'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'messaging' | 'email' | 'calendar' | 'data' | 'automation';
  featured: boolean;
  setupComplexity: 'easy' | 'medium' | 'advanced';
  pricing: 'free' | 'premium';
  capabilities: string[];
  authType: 'oauth2' | 'api_key' | 'none';
  configFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'boolean';
    options?: string[];
  }>;
  status: 'available' | 'connected' | 'disabled' | 'error';
  connectedAt?: string;
  lastSyncAt?: string;
  config?: Record<string, any>;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  available: number;
  premium: number;
}

export interface IntegrationLog {
  id: string;
  action: string;
  status: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface ImportResult {
  fileName?: string;
  source?: string;
  totalRows?: number;
  imported: number;
  errors: number;
  summary: string;
}

class IntegrationsAPI {
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
    
    const response = await fetch(`${this.baseUrl}/api/integrations${endpoint}`, {
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

  async getIntegrations(): Promise<{
    success: boolean;
    data: {
      integrations: Integration[];
      summary: IntegrationStats;
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        integrations: Integration[];
        summary: IntegrationStats;
      };
    }>('');
  }

  async connectIntegration(data: {
    integrationId: string;
    authCode?: string;
    config?: Record<string, any>;
    redirectUri?: string;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    return this.request<{
      success: boolean;
      data: any;
    }>('/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectIntegration(integrationId: string): Promise<{
    success: boolean;
    data: {
      message: string;
      integrationId: string;
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        message: string;
        integrationId: string;
      };
    }>(`/${integrationId}`, {
      method: 'DELETE',
    });
  }

  async updateIntegration(integrationId: string, data: {
    enabled?: boolean;
    config?: Record<string, any>;
    settings?: Record<string, any>;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async importData(data: {
    integrationId: string;
    fileData: string;
    fileName: string;
    mapping?: Record<string, string>;
  }): Promise<{
    success: boolean;
    data: ImportResult;
  }> {
    return this.request<{
      success: boolean;
      data: ImportResult;
    }>('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIntegrationLogs(integrationId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    data: {
      logs: IntegrationLog[];
      pagination: {
        limit: number;
        offset: number;
        total: number;
      };
    };
  }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const query = params.toString();
    return this.request<{
      success: boolean;
      data: {
        logs: IntegrationLog[];
        pagination: {
          limit: number;
          offset: number;
          total: number;
        };
      };
    }>(`/${integrationId}/logs${query ? `?${query}` : ''}`);
  }
}

const integrationsAPI = new IntegrationsAPI();

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats>({
    total: 0,
    connected: 0,
    available: 0,
    premium: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await integrationsAPI.getIntegrations();
      setIntegrations(response.data.integrations);
      setStats(response.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectIntegration = useCallback(async (data: {
    integrationId: string;
    authCode?: string;
    config?: Record<string, any>;
    redirectUri?: string;
  }) => {
    try {
      const response = await integrationsAPI.connectIntegration(data);
      await fetchIntegrations(); // Refresh data
      return response.data;
    } catch (err) {
      console.error('Error connecting integration:', err);
      throw err;
    }
  }, [fetchIntegrations]);

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      const response = await integrationsAPI.disconnectIntegration(integrationId);
      await fetchIntegrations(); // Refresh data
      return response.data;
    } catch (err) {
      console.error('Error disconnecting integration:', err);
      throw err;
    }
  }, [fetchIntegrations]);

  const updateIntegration = useCallback(async (integrationId: string, data: {
    enabled?: boolean;
    config?: Record<string, any>;
    settings?: Record<string, any>;
  }) => {
    try {
      const response = await integrationsAPI.updateIntegration(integrationId, data);
      await fetchIntegrations(); // Refresh data
      return response.data;
    } catch (err) {
      console.error('Error updating integration:', err);
      throw err;
    }
  }, [fetchIntegrations]);

  const importData = useCallback(async (data: {
    integrationId: string;
    fileData: string;
    fileName: string;
    mapping?: Record<string, string>;
  }) => {
    try {
      const response = await integrationsAPI.importData(data);
      return response.data;
    } catch (err) {
      console.error('Error importing data:', err);
      throw err;
    }
  }, []);

  return {
    integrations,
    stats,
    loading,
    error,
    connectIntegration,
    disconnectIntegration,
    updateIntegration,
    importData,
    refetch: fetchIntegrations,
  };
}

export function useIntegrationLogs(integrationId: string, options: {
  limit?: number;
  offset?: number;
} = {}) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
  });

  const fetchLogs = useCallback(async () => {
    if (!integrationId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await integrationsAPI.getIntegrationLogs(integrationId, options);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      console.error('Error fetching integration logs:', err);
    } finally {
      setLoading(false);
    }
  }, [integrationId, options]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    pagination,
    refetch: fetchLogs,
  };
}

export function useIntegration(integrationId: string) {
  const { integrations, loading, error, refetch } = useIntegrations();
  
  const integration = integrations.find(i => i.id === integrationId);

  return {
    integration,
    loading,
    error,
    refetch,
  };
}