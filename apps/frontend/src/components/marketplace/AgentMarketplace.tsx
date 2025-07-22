'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Download, Zap, MessageSquare, BarChart3, Database, Bot, Sparkles } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { AgentCategoryTabs } from './AgentCategoryTabs';
import { AgentSearchBar } from './AgentSearchBar';
import { AgentInstallModal } from './AgentInstallModal';
import { mockAgents } from '../../lib/mock-data/agents';
import type { AgentManifest } from '../../types/agent-types';

export interface MarketplaceFilters {
  category: string;
  search: string;
  pricing: 'all' | 'free' | 'paid' | 'freemium';
  capabilities: string[];
}

export function AgentMarketplace() {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    search: '',
    pricing: 'all',
    capabilities: []
  });
  const [selectedAgent, setSelectedAgent] = useState<AgentManifest | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Filter agents based on current filters
  const filteredAgents = useMemo(() => {
    return mockAgents.filter(agent => {
      // Category filter
      if (filters.category !== 'all' && agent.category !== filters.category) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!agent.name.toLowerCase().includes(searchLower) &&
            !agent.description.toLowerCase().includes(searchLower) &&
            !agent.tags?.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Pricing filter
      if (filters.pricing !== 'all') {
        if (filters.pricing === 'free' && agent.pricing.model !== 'free') return false;
        if (filters.pricing === 'paid' && (agent.pricing.model === 'free' || agent.pricing.model === 'freemium')) return false;
        if (filters.pricing === 'freemium' && agent.pricing.model !== 'freemium') return false;
      }

      // Capabilities filter
      if (filters.capabilities.length > 0) {
        if (!filters.capabilities.some(cap => agent.capabilities.includes(cap))) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const handleInstallAgent = (agent: AgentManifest) => {
    setSelectedAgent(agent);
    setShowInstallModal(true);
  };

  const handleCloseModal = () => {
    setShowInstallModal(false);
    setSelectedAgent(null);
  };

  const featuredAgents = mockAgents.filter(agent => agent.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Agent Marketplace
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover and install AI agents to supercharge your CRM. 
              From auto-replies to data enrichment, find the perfect AI assistant for your business.
            </p>
          </div>

          <AgentSearchBar 
            value={filters.search}
            onChange={(search) => setFilters(prev => ({ ...prev, search }))}
            placeholder="Search AI agents..."
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Agents Section */}
        {featuredAgents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Featured Agents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAgents.slice(0, 3).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onInstall={() => handleInstallAgent(agent)}
                  featured={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filters and Categories */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <AgentCategoryTabs
                selectedCategory={filters.category}
                onCategoryChange={(category) => setFilters(prev => ({ ...prev, category }))}
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'free', label: 'Free' },
                  { value: 'freemium', label: 'Freemium' },
                  { value: 'paid', label: 'Paid' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="pricing"
                      value={option.value}
                      checked={filters.pricing === option.value}
                      onChange={(e) => setFilters(prev => ({ ...prev, pricing: e.target.value as any }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Capabilities</h3>
              <div className="space-y-2">
                {[
                  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { value: 'voice', label: 'Voice Calls', icon: Zap },
                  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { value: 'data-enrichment', label: 'Data Enrichment', icon: Database }
                ].map((capability) => (
                  <label key={capability.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={capability.value}
                      checked={filters.capabilities.includes(capability.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilters(prev => ({
                          ...prev,
                          capabilities: e.target.checked
                            ? [...prev.capabilities, value]
                            : prev.capabilities.filter(cap => cap !== value)
                        }));
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 rounded"
                    />
                    <capability.icon className="w-4 h-4 text-gray-400 ml-2 mr-1" />
                    <span className="text-sm text-gray-700">{capability.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {filteredAgents.length} agents found
              </p>
              <select className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <option>Most Popular</option>
                <option>Newest</option>
                <option>Highest Rated</option>
                <option>Price: Low to High</option>
              </select>
            </div>

            {/* Agent Grid */}
            {filteredAgents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onInstall={() => handleInstallAgent(agent)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => setFilters({
                    category: 'all',
                    search: '',
                    pricing: 'all',
                    capabilities: []
                  })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {selectedAgent && (
        <AgentInstallModal
          agent={selectedAgent}
          isOpen={showInstallModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}