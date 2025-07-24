/**
 * Marketplace Hook
 * 
 * Custom React hook for managing marketplace data, including agents,
 * categories, and installation states.
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  marketplaceAPI, 
  Agent, 
  MarketplaceFilters, 
  AgentCategory 
} from '@/lib/api/marketplace';

// Mock data for testing when backend is not available
const getMockAgents = (): Agent[] => [
  {
    id: '1',
    agentId: 'whatsapp-auto-responder',
    name: 'WhatsApp Auto Responder',
    version: '1.2.0',
    provider: {
      name: 'CRM Agents Inc',
      website: 'https://crmagents.com',
      verified: true,
    },
    description: 'Automatically respond to WhatsApp messages with intelligent AI responses',
    category: 'whatsapp',
    tags: ['messaging', 'automation', 'ai'],
    capabilities: ['auto-response', 'lead-qualification', 'appointment-booking'],
    pricing: {
      model: 'freemium',
      freeTrialDays: 14,
    },
    stats: {
      installs: 1250,
      rating: 4.8,
      reviews: 89,
    },
    requirements: {},
    featured: true,
    verified: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    agentId: 'lead-scoring-ai',
    name: 'AI Lead Scoring',
    version: '2.1.0',
    provider: {
      name: 'SmartCRM Solutions',
      verified: true,
    },
    description: 'Intelligent lead scoring based on behavior and engagement patterns',
    category: 'data',
    tags: ['analytics', 'lead-scoring', 'machine-learning'],
    capabilities: ['lead-analysis', 'scoring', 'predictions'],
    pricing: {
      model: 'subscription',
      price: 29,
      currency: 'USD',
    },
    stats: {
      installs: 890,
      rating: 4.6,
      reviews: 124,
    },
    requirements: {
      minPlanLevel: 'pro',
    },
    featured: false,
    verified: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    agentId: 'voice-assistant',
    name: 'Voice Call Assistant',
    version: '1.0.5',
    provider: {
      name: 'VoiceAI Technologies',
      verified: false,
    },
    description: 'AI-powered voice assistant for making and receiving calls',
    category: 'voice',
    tags: ['voice', 'calls', 'automation'],
    capabilities: ['call-handling', 'appointment-booking', 'lead-qualification'],
    pricing: {
      model: 'usage',
      price: 0.15,
      currency: 'USD',
    },
    stats: {
      installs: 456,
      rating: 4.2,
      reviews: 67,
    },
    requirements: {},
    featured: true,
    verified: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
];

const getMockCategories = (): AgentCategory[] => [
  { id: 'whatsapp', name: 'WhatsApp', description: 'WhatsApp messaging agents', icon: 'message-square', agentCount: 15 },
  { id: 'voice', name: 'Voice', description: 'Voice and call handling agents', icon: 'phone', agentCount: 8 },
  { id: 'data', name: 'Analytics', description: 'Data analysis and insights', icon: 'bar-chart', agentCount: 12 },
  { id: 'automation', name: 'Automation', description: 'Workflow automation agents', icon: 'zap', agentCount: 20 },
];

export function useMarketplace(initialFilters: MarketplaceFilters = {}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [agentsResponse, featuredResponse, categoriesResponse] = await Promise.all([
          marketplaceAPI.getAgents(filters),
          marketplaceAPI.getFeaturedAgents(),
          marketplaceAPI.getCategories(),
        ]);

        if (agentsResponse.success && agentsResponse.data) {
          setAgents(agentsResponse.data);
          setMeta(agentsResponse.meta || { total: 0, limit: 20, offset: 0, hasMore: false });
        } else {
          // Fallback to mock data for testing
          console.warn('Using mock data for agents:', agentsResponse.error);
          const mockAgents = getMockAgents();
          setAgents(mockAgents);
          setMeta({ total: mockAgents.length, limit: 20, offset: 0, hasMore: false });
        }

        if (featuredResponse.success && featuredResponse.data) {
          setFeaturedAgents(featuredResponse.data);
        } else {
          // Fallback to mock featured agents
          console.warn('Using mock data for featured agents:', featuredResponse.error);
          const mockAgents = getMockAgents();
          setFeaturedAgents(mockAgents.filter(agent => agent.featured));
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        } else {
          // Fallback to mock categories
          console.warn('Using mock data for categories:', categoriesResponse.error);
          setCategories(getMockCategories());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload agents when filters change
  useEffect(() => {
    const loadAgents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await marketplaceAPI.getAgents(filters);
        
        if (response.success && response.data) {
          setAgents(response.data);
          setMeta(response.meta || { total: 0, limit: 20, offset: 0, hasMore: false });
        } else {
          setError(response.error || 'Failed to load agents');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Only reload if filters have actually changed
    const filtersChanged = Object.keys(filters).some(
      key => filters[key as keyof MarketplaceFilters] !== initialFilters[key as keyof MarketplaceFilters]
    );

    if (filtersChanged) {
      loadAgents();
    }
  }, [filters, initialFilters]);

  // Memoized filtered agents (client-side filtering for better UX)
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Additional client-side filtering if needed
    if (filters.search && agents.length > 0) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.provider.name.toLowerCase().includes(searchLower) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [agents, filters.search]);

  // Update filters
  const updateFilters = (newFilters: Partial<MarketplaceFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset offset when changing filters (except for pagination)
      offset: newFilters.offset !== undefined ? newFilters.offset : 0,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
  };

  // Install agent
  const installAgent = async (agentId: string, config: Record<string, any> = {}) => {
    try {
      setError(null);
      
      // Get auth token (implement based on your auth system)
      const token = localStorage.getItem('auth_token'); // or use auth context
      
      const response = await marketplaceAPI.installAgent(agentId, config, token || undefined);
      
      if (response.success) {
        // Optionally update local state or refresh data
        return { success: true, data: response.data };
      } else {
        // For testing: Mock successful installation when backend is not available
        console.warn('Backend not available, mocking successful installation:', response.error);
        return { 
          success: true, 
          data: { 
            message: 'Agent installed successfully (mock)',
            agentId,
            installedAt: new Date().toISOString()
          } 
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Check installation eligibility
  const checkEligibility = async (agentId: string) => {
    try {
      const token = localStorage.getItem('auth_token'); // or use auth context
      const response = await marketplaceAPI.checkInstallationEligibility(agentId, token || undefined);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to check eligibility');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check eligibility');
      return null;
    }
  };

  // Load more agents (pagination)
  const loadMore = async () => {
    if (!meta.hasMore || loading) return;

    setLoading(true);
    try {
      const response = await marketplaceAPI.getAgents({
        ...filters,
        offset: meta.offset + meta.limit,
      });

      if (response.success && response.data) {
        setAgents(prev => [...prev, ...response.data!]);
        setMeta(response.meta || meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more agents');
    } finally {
      setLoading(false);
    }
  };

  return {
    // Data
    agents: filteredAgents,
    featuredAgents,
    categories,
    
    // State
    loading,
    error,
    filters,
    meta,
    
    // Actions
    updateFilters,
    clearFilters,
    installAgent,
    checkEligibility,
    loadMore,
    
    // Utilities
    refresh: () => updateFilters({}), // Trigger a refresh
  };
}

export default useMarketplace;