/**
 * Marketplace API Service
 * 
 * Handles all API calls to the marketplace backend for agent discovery,
 * installation, and management.
 */

import { API_BASE_URL } from '../config';

export interface Agent {
  id: string;
  agentId: string;
  name: string;
  version: string;
  provider: {
    name: string;
    website?: string;
    verified: boolean;
  };
  description: string;
  category: string;
  tags: string[];
  capabilities: string[];
  pricing: {
    model: 'free' | 'subscription' | 'usage' | 'freemium';
    price?: number;
    currency?: string;
    freeTrialDays?: number;
  };
  stats: {
    installs: number;
    rating: number;
    reviews: number;
  };
  requirements: {
    minPlanLevel?: string;
    requiredFeatures?: string[];
  };
  screenshots?: string[];
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  pricing?: 'all' | 'free' | 'paid' | 'freemium';
  capabilities?: string[];
  featured?: boolean;
  verified?: boolean;
  sort?: 'popular' | 'newest' | 'rating' | 'name';
  limit?: number;
  offset?: number;
}

export interface AgentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  agentCount: number;
}

export interface MarketplaceResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface InstallationEligibility {
  canInstall: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  alreadyInstalled?: boolean;
}

class MarketplaceAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/marketplace`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<MarketplaceResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private buildQueryString(filters: MarketplaceFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return params.toString();
  }

  /**
   * Get all available agents with filtering and pagination
   */
  async getAgents(filters: MarketplaceFilters = {}): Promise<MarketplaceResponse<Agent[]>> {
    const queryString = this.buildQueryString(filters);
    const endpoint = `/agents${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<any>(endpoint);
    
    // Handle enhanced marketplace routes response format
    if (response.success && response.agents) {
      const agents = response.agents.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt || agent.created_at),
        updatedAt: new Date(agent.updatedAt || agent.updated_at),
      }));
      
      return {
        success: true,
        data: agents,
        meta: {
          total: response.total || agents.length,
          limit: response.limit || 20,
          offset: response.offset || 0,
          hasMore: response.hasMore || false
        }
      };
    }
    
    // Fallback to original format if available
    if (response.success && response.data) {
      response.data = response.data.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
        updatedAt: new Date(agent.updatedAt),
      }));
    }
    
    return response;
  }

  /**
   * Get featured agents
   */
  async getFeaturedAgents(): Promise<MarketplaceResponse<Agent[]>> {
    const response = await this.request<any>('/featured');
    
    // Handle enhanced marketplace routes response format
    if (response.success && response.featured) {
      const agents = response.featured.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt || agent.created_at),
        updatedAt: new Date(agent.updatedAt || agent.updated_at),
      }));
      
      return {
        success: true,
        data: agents
      };
    }
    
    // Fallback to original format if available
    if (response.success && response.data) {
      response.data = response.data.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
        updatedAt: new Date(agent.updatedAt),
      }));
    }
    
    return response;
  }

  /**
   * Get detailed information about a specific agent
   */
  async getAgentDetails(agentId: string): Promise<MarketplaceResponse<Agent & {
    fullDescription?: string;
    changelog?: string;
    documentation?: string;
    configSchema?: any;
  }>> {
    const response = await this.request<Agent & {
      fullDescription?: string;
      changelog?: string;
      documentation?: string;
      configSchema?: any;
    }>(`/agents/${agentId}`);
    
    // Transform dates from string to Date objects
    if (response.success && response.data) {
      response.data = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      };
    }
    
    return response;
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<MarketplaceResponse<AgentCategory[]>> {
    const response = await this.request<any>('/categories');
    
    // Handle enhanced marketplace routes response format
    if (response.success && response.categories) {
      return {
        success: true,
        data: response.categories
      };
    }
    
    return response;
  }

  /**
   * Check if user can install a specific agent
   */
  async checkInstallationEligibility(
    agentId: string,
    token?: string
  ): Promise<MarketplaceResponse<InstallationEligibility>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request<InstallationEligibility>(
      `/agents/${agentId}/can-install`,
      { headers }
    );
  }

  /**
   * Install an agent
   */
  async installAgent(
    agentId: string,
    config: Record<string, any> = {},
    token?: string
  ): Promise<MarketplaceResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(`/agents/install`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId,
        config,
      }),
    });
  }

  /**
   * Get marketplace statistics
   */
  async getStats(): Promise<MarketplaceResponse<{
    totalAgents: number;
    featuredAgents: number;
    verifiedAgents: number;
    totalInstalls: number;
    averageRating: number;
    categoryCounts: Record<string, number>;
    pricingModels: Record<string, number>;
    topRated: Array<{
      id: string;
      name: string;
      rating: number;
      installs: number;
    }>;
  }>> {
    const response = await this.request<any>('/stats');
    
    // Handle enhanced marketplace routes response format
    if (response.success && response.stats) {
      return {
        success: true,
        data: response.stats
      };
    }
    
    return response;
  }
}

// Create and export singleton instance
export const marketplaceAPI = new MarketplaceAPI();

// Export individual methods for convenience
export const {
  getAgents,
  getFeaturedAgents,
  getAgentDetails,
  getCategories,
  getStats,
  checkInstallationEligibility,
  installAgent,
} = marketplaceAPI;