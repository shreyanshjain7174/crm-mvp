'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, Download, Zap, MessageSquare, BarChart3, Database, Bot, Sparkles, Filter, Grid3X3, List, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  agentId: string;
  name: string;
  version: string;
  provider: {
    name: string;
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
  };
  stats: {
    installs: number;
    rating: number;
    reviews: number;
  };
  featured: boolean;
  verified: boolean;
  screenshots?: string[];
}

interface MarketplaceFilters {
  category: string;
  search: string;
  pricing: 'all' | 'free' | 'paid' | 'freemium';
  sort: 'popular' | 'newest' | 'rating' | 'name';
  view: 'grid' | 'list';
}

const categories = [
  { id: 'all', name: 'All Agents', icon: Bot, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'voice', name: 'Voice Agents', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'data', name: 'Data & Analytics', icon: BarChart3, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'automation', name: 'Automation', icon: Database, color: 'text-orange-600', bgColor: 'bg-orange-100' },
];

// Mock data - will be replaced with API calls
const mockAgents: Agent[] = [
  {
    id: '1',
    agentId: 'whatsapp-ai-responder',
    name: 'WhatsApp AI Responder',
    version: '2.1.0',
    provider: { name: 'Local AI Co.', verified: true },
    description: 'Automatically respond to WhatsApp messages with intelligent, context-aware replies',
    category: 'whatsapp',
    tags: ['automation', 'messaging', 'ai'],
    capabilities: ['auto-reply', 'sentiment-analysis', 'context-awareness'],
    pricing: { model: 'freemium', price: 999, currency: 'INR' },
    stats: { installs: 15670, rating: 4.8, reviews: 2341 },
    featured: true,
    verified: true,
  },
  {
    id: '2',
    agentId: 'cozmox-voice-agent',
    name: 'Cozmox Voice Assistant',
    version: '1.5.2',
    provider: { name: 'Cozmox AI', verified: true },
    description: 'AI-powered voice calls with natural conversation and lead qualification',
    category: 'voice',
    tags: ['voice', 'calls', 'lead-qualification'],
    capabilities: ['voice-calls', 'lead-scoring', 'appointment-booking'],
    pricing: { model: 'usage', price: 5, currency: 'INR' },
    stats: { installs: 8340, rating: 4.6, reviews: 892 },
    featured: true,
    verified: true,
  },
  {
    id: '3',
    agentId: 'data-enricher-pro',
    name: 'Data Enricher Pro',
    version: '3.0.1',
    provider: { name: 'DataFlow Inc', verified: false },
    description: 'Automatically enrich contact data with social profiles, company info, and more',
    category: 'data',
    tags: ['data-enrichment', 'contacts', 'automation'],
    capabilities: ['social-lookup', 'company-data', 'email-verification'],
    pricing: { model: 'subscription', price: 1999, currency: 'INR' },
    stats: { installs: 3240, rating: 4.2, reviews: 456 },
    featured: false,
    verified: false,
  }
];

export function ModernAgentMarketplace() {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    search: '',
    pricing: 'all',
    sort: 'popular',
    view: 'grid'
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Load agents from API
  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(true);
    setTimeout(() => {
      setAgents(mockAgents);
      setFeaturedAgents(mockAgents.filter(agent => agent.featured));
      setLoading(false);
    }, 800);
  }, []);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(agent => agent.category === filters.category);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.provider.name.toLowerCase().includes(searchLower) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Pricing filter
    if (filters.pricing !== 'all') {
      filtered = filtered.filter(agent => agent.pricing.model === filters.pricing);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'popular':
          return b.stats.installs - a.stats.installs;
        case 'rating':
          return b.stats.rating - a.stats.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return b.id.localeCompare(a.id); // Mock sorting by ID
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, filters]);

  const handleInstall = (agent: Agent) => {
    // TODO: Implement installation logic
    console.log('Installing agent:', agent.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25"
              >
                <Bot className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
              AI Agent Marketplace
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover powerful AI agents to automate your workflow. From WhatsApp bots to voice assistants, find the perfect AI companion for your business.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search AI agents, capabilities, or providers..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                          shadow-lg shadow-black/5 text-gray-900 placeholder-gray-500
                          transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = filters.category === category.id;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300
                    ${isActive 
                      ? 'bg-white shadow-lg shadow-black/10 text-gray-900 border border-gray-200' 
                      : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80 border border-white/30'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? category.color : 'text-gray-500'}`} />
                  <span className="font-medium text-sm">{category.name}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Featured Agents Section */}
      {featuredAgents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="flex items-center mb-8">
            <Sparkles className="w-6 h-6 text-yellow-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <AgentCard agent={agent} onInstall={handleInstall} featured />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg shadow-black/5">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">
              {filteredAgents.length} agents found
            </span>
            {filters.search && (
              <span className="text-sm text-gray-500">
                for &quot;{filters.search}&quot;
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, view: 'grid' }))}
                className={`p-2 rounded-md transition-all ${
                  filters.view === 'grid' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, view: 'list' }))}
                className={`p-2 rounded-md transition-all ${
                  filters.view === 'list' 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                className="appearance-none bg-white/80 border border-gray-200 rounded-lg px-4 py-2 pr-8 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-lg
                        hover:bg-white transition-all text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg shadow-black/5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
                  <select
                    value={filters.pricing}
                    onChange={(e) => setFilters(prev => ({ ...prev, pricing: e.target.value as any }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="all">All</option>
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="subscription">Paid</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agents Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredAgents.length > 0 ? (
          <motion.div
            layout
            className={`grid gap-6 ${
              filters.view === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            <AnimatePresence>
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -4 }}
                >
                  <AgentCard 
                    agent={agent} 
                    onInstall={handleInstall} 
                    listView={filters.view === 'list'}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => setFilters({ category: 'all', search: '', pricing: 'all', sort: 'popular', view: 'grid' })}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Agent Card Component
function AgentCard({ 
  agent, 
  onInstall, 
  featured = false, 
  listView = false 
}: { 
  agent: Agent; 
  onInstall: (agent: Agent) => void; 
  featured?: boolean;
  listView?: boolean;
}) {
  const categoryConfig = categories.find(cat => cat.id === agent.category) || categories[0];
  const Icon = categoryConfig.icon;

  const formatPrice = (price: number, currency: string) => {
    return currency === 'INR' ? `₹${price}` : `${currency} ${price}`;
  };

  const getPricingDisplay = () => {
    switch (agent.pricing.model) {
      case 'free':
        return 'Free';
      case 'freemium':
        return 'Freemium';
      case 'subscription':
        return agent.pricing.price ? `${formatPrice(agent.pricing.price, agent.pricing.currency!)}/mo` : 'Subscription';
      case 'usage':
        return agent.pricing.price ? `${formatPrice(agent.pricing.price, agent.pricing.currency!)}/use` : 'Pay per use';
      default:
        return 'Contact for pricing';
    }
  };

  return (
    <div className={`
      group relative bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-6 
      shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 
      transition-all duration-300 overflow-hidden
      ${listView ? 'flex items-center space-x-6' : ''}
      ${featured ? 'ring-2 ring-yellow-400/30' : ''}
    `}>
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Featured</span>
          </div>
        </div>
      )}

      {/* Agent Icon & Info */}
      <div className={`${listView ? 'flex-shrink-0' : 'mb-4'}`}>
        <div className={`
          w-12 h-12 ${categoryConfig.bgColor} rounded-xl flex items-center justify-center mb-3
          group-hover:scale-110 transition-transform duration-300
        `}>
          <Icon className={`w-6 h-6 ${categoryConfig.color}`} />
        </div>
        
        <div className={listView ? 'flex-1' : ''}>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {agent.name}
            </h3>
            {agent.verified && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {agent.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{agent.stats.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>{agent.stats.installs.toLocaleString()}</span>
            </div>
            <div className="text-gray-400">•</div>
            <span>{agent.provider.name}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Action */}
      <div className={`${listView ? 'flex-shrink-0' : ''} flex items-center justify-between`}>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900">
            {getPricingDisplay()}
          </span>
          {agent.pricing.model === 'freemium' && (
            <span className="text-xs text-gray-500">Free tier available</span>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onInstall(agent)}
          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl
                    hover:from-indigo-700 hover:to-purple-700 transition-all duration-300
                    font-medium text-sm shadow-lg shadow-indigo-500/25"
        >
          Install
        </motion.button>
      </div>
    </div>
  );
}