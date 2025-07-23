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
          setError(agentsResponse.error || 'Failed to load agents');
        }

        if (featuredResponse.success && featuredResponse.data) {
          setFeaturedAgents(featuredResponse.data);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
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
        setError(response.error || 'Installation failed');
        return { success: false, error: response.error };
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