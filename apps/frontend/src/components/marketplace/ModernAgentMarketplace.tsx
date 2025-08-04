'use client';

import React, { useState, memo, useMemo } from 'react';
import { Search, Star, Download, Zap, MessageSquare, BarChart3, Database, Bot, Sparkles, Filter, Grid3X3, List, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplace } from '@/hooks/useMarketplace';
import { Agent } from '@/lib/api/marketplace';

interface MarketplaceFilters {
  category: string;
  search: string;
  pricing: 'all' | 'free' | 'paid' | 'freemium';
  sort: 'popular' | 'newest' | 'rating' | 'name';
  view: 'grid' | 'list';
}

const categoryIcons = {
  'all': Bot,
  'whatsapp': MessageSquare,
  'voice': Zap,
  'data': BarChart3,
  'automation': Database,
  'lead-gen': Database,
  'support': MessageSquare,
};

const categoryColors = {
  'all': { color: 'text-muted-foreground', bgColor: 'bg-muted' },
  'whatsapp': { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20' },
  'voice': { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  'data': { color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  'automation': { color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
  'lead-gen': { color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/20' },
  'support': { color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/20' },
};

export function ModernAgentMarketplace() {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    search: '',
    pricing: 'all',
    sort: 'popular',
    view: 'grid'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Use the marketplace hook
  const {
    agents,
    featuredAgents,
    categories,
    loading,
    error,
    updateFilters,
    installAgent,
  } = useMarketplace({
    category: filters.category !== 'all' ? filters.category : undefined,
    search: filters.search || undefined,
    pricing: filters.pricing !== 'all' ? filters.pricing : undefined,
    sort: filters.sort,
    limit: 20,
  });

  // Build categories list with API data (memoized for performance)
  const categoriesWithIcons = useMemo(() => [
    { id: 'all', name: 'All Agents', icon: Bot, color: 'text-muted-foreground', bgColor: 'bg-muted' },
    ...categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: categoryIcons[cat.id as keyof typeof categoryIcons] || Bot,
      color: categoryColors[cat.id as keyof typeof categoryColors]?.color || 'text-muted-foreground',
      bgColor: categoryColors[cat.id as keyof typeof categoryColors]?.bgColor || 'bg-muted',
    }))
  ], [categories]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<MarketplaceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update API filters
    updateFilters({
      category: updatedFilters.category !== 'all' ? updatedFilters.category : undefined,
      search: updatedFilters.search || undefined,
      pricing: updatedFilters.pricing !== 'all' ? updatedFilters.pricing : undefined,
      sort: updatedFilters.sort,
    });
  };

  const [installingAgents, setInstallingAgents] = useState<Set<string>>(new Set());
  const [installedAgents, setInstalledAgents] = useState<Set<string>>(new Set());

  const handleInstall = async (agent: Agent) => {
    try {
      setInstallingAgents(prev => new Set(prev).add(agent.agentId));
      
      const result = await installAgent(agent.agentId);
      if (result.success) {
        setInstalledAgents(prev => new Set(prev).add(agent.agentId));
        console.log(`✅ ${agent.name} installed successfully!`);
        
        // Create a secure success notification without innerHTML
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg transform transition-all duration-300';
        
        const container = document.createElement('div');
        container.className = 'flex items-center gap-3';
        
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'w-6 h-6');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('viewBox', '0 0 24 24');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('d', 'M5 13l4 4L19 7');
        icon.appendChild(path);
        
        const textContainer = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'font-semibold';
        title.textContent = `${agent.name} Installed!`;
        
        const subtitle = document.createElement('div');
        subtitle.className = 'text-sm opacity-90';
        subtitle.textContent = 'Ready to use in workflows';
        
        textContainer.appendChild(title);
        textContainer.appendChild(subtitle);
        container.appendChild(icon);
        container.appendChild(textContainer);
        notification.appendChild(container);
        
        document.body.appendChild(notification);
        
        // Auto-remove notification after 4 seconds
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (notification.parentNode) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, 4000);
      } else {
        console.error(`❌ Failed to install ${agent.name}:`, result.error);
        
        // Create secure error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg';
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'flex items-center gap-3';
        
        const errorIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        errorIcon.setAttribute('class', 'w-6 h-6');
        errorIcon.setAttribute('fill', 'none');
        errorIcon.setAttribute('stroke', 'currentColor');
        errorIcon.setAttribute('viewBox', '0 0 24 24');
        
        const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        errorPath.setAttribute('stroke-linecap', 'round');
        errorPath.setAttribute('stroke-linejoin', 'round');
        errorPath.setAttribute('stroke-width', '2');
        errorPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
        errorIcon.appendChild(errorPath);
        
        const errorTextContainer = document.createElement('div');
        const errorTitle = document.createElement('div');
        errorTitle.className = 'font-semibold';
        errorTitle.textContent = 'Installation Failed';
        
        const errorSubtitle = document.createElement('div');
        errorSubtitle.className = 'text-sm opacity-90';
        errorSubtitle.textContent = result.error || 'Unknown error occurred';
        
        errorTextContainer.appendChild(errorTitle);
        errorTextContainer.appendChild(errorSubtitle);
        errorContainer.appendChild(errorIcon);
        errorContainer.appendChild(errorTextContainer);
        errorNotification.appendChild(errorContainer);
        
        document.body.appendChild(errorNotification);
        setTimeout(() => {
          if (errorNotification.parentNode) {
            document.body.removeChild(errorNotification);
          }
        }, 5000);
      }
    } catch (error) {
      console.error(`❌ Installation failed for ${agent.name}:`, error);
      
      // Create secure catch error notification
      const catchErrorNotification = document.createElement('div');
      catchErrorNotification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg';
      
      const catchErrorContainer = document.createElement('div');
      catchErrorContainer.className = 'flex items-center gap-3';
      
      const catchErrorIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      catchErrorIcon.setAttribute('class', 'w-6 h-6');
      catchErrorIcon.setAttribute('fill', 'none');
      catchErrorIcon.setAttribute('stroke', 'currentColor');
      catchErrorIcon.setAttribute('viewBox', '0 0 24 24');
      
      const catchErrorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      catchErrorPath.setAttribute('stroke-linecap', 'round');
      catchErrorPath.setAttribute('stroke-linejoin', 'round');
      catchErrorPath.setAttribute('stroke-width', '2');
      catchErrorPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      catchErrorIcon.appendChild(catchErrorPath);
      
      const catchErrorTextContainer = document.createElement('div');
      const catchErrorTitle = document.createElement('div');
      catchErrorTitle.className = 'font-semibold';
      catchErrorTitle.textContent = 'Installation Failed';
      
      const catchErrorSubtitle = document.createElement('div');
      catchErrorSubtitle.className = 'text-sm opacity-90';
      catchErrorSubtitle.textContent = error instanceof Error ? error.message : 'Unknown error';
      
      catchErrorTextContainer.appendChild(catchErrorTitle);
      catchErrorTextContainer.appendChild(catchErrorSubtitle);
      catchErrorContainer.appendChild(catchErrorIcon);
      catchErrorContainer.appendChild(catchErrorTextContainer);
      catchErrorNotification.appendChild(catchErrorContainer);
      
      document.body.appendChild(catchErrorNotification);
      setTimeout(() => {
        if (catchErrorNotification.parentNode) {
          document.body.removeChild(catchErrorNotification);
        }
      }, 5000);
    } finally {
      setInstallingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agent.agentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load marketplace</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
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
            <h1 className="text-4xl font-bold text-foreground mb-3">
              AI Agent Marketplace
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                onChange={(e) => handleFilterChange({ search: e.target.value })}
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
            {categoriesWithIcons.map((category) => {
              const Icon = category.icon;
              const isActive = filters.category === category.id;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFilterChange({ category: category.id })}
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

      {/* Marketplace Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">{agents.length}+</div>
            <div className="text-sm text-gray-600">AI Agents Available</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{categoriesWithIcons.length - 1}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{installedAgents.size}</div>
            <div className="text-sm text-gray-600">Installed Agents</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Always Available</div>
          </div>
        </div>
      </motion.div>

      {/* Recently Installed Agents */}
      {installedAgents.size > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recently Installed</h2>
            </div>
            <button
              onClick={() => window.open('/dashboard/workflows/builder', '_blank')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Use in Workflows →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from(installedAgents).slice(0, 3).map((agentId) => {
              const agent = agents.find(a => a.agentId === agentId);
              if (!agent) return null;
              return (
                <div key={agentId} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">Ready to use</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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
            {featuredAgents.map((agent: Agent, index: number) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <AgentCard agent={agent} onInstall={handleInstall} featured categories={categoriesWithIcons} isInstalling={installingAgents.has(agent.agentId)} isInstalled={installedAgents.has(agent.agentId)} />
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
              {agents.length} agents found
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
        {agents.length > 0 ? (
          <motion.div
            layout
            className={`grid gap-6 ${
              filters.view === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            <AnimatePresence>
              {agents.map((agent: Agent, index: number) => (
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
                    categories={categoriesWithIcons}
                    isInstalling={installingAgents.has(agent.agentId)}
                    isInstalled={installedAgents.has(agent.agentId)}
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
const AgentCard = memo(function AgentCard({ 
  agent, 
  onInstall, 
  featured = false, 
  listView = false,
  categories,
  isInstalling = false,
  isInstalled = false
}: { 
  agent: Agent; 
  onInstall: (agent: Agent) => void; 
  featured?: boolean;
  listView?: boolean;
  categories: any[];
  isInstalling?: boolean;
  isInstalled?: boolean;
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
      group relative bg-card border border-border rounded-2xl p-6 
      shadow-lg hover:shadow-xl 
      transition-all duration-300 overflow-hidden
      ${listView ? 'flex items-center space-x-6' : ''}
      ${featured ? 'ring-2 ring-yellow-400/30 dark:ring-yellow-400/50' : ''}
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
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {agent.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{agent.stats.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>{agent.stats.installs.toLocaleString()}</span>
            </div>
            <div className="text-muted-foreground/50">•</div>
            <span>{agent.provider.name}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Action */}
      <div className={`${listView ? 'flex-shrink-0' : ''} flex items-center justify-between`}>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">
            {getPricingDisplay()}
          </span>
          {agent.pricing.model === 'freemium' && (
            <span className="text-xs text-muted-foreground">Free tier available</span>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: isInstalling || isInstalled ? 1 : 1.05 }}
          whileTap={{ scale: isInstalling || isInstalled ? 1 : 0.95 }}
          onClick={() => !isInstalling && !isInstalled && onInstall(agent)}
          disabled={isInstalling || isInstalled}
          className={`px-6 py-2 rounded-xl font-medium text-sm shadow-lg transition-all duration-300 ${
            isInstalled 
              ? 'bg-green-500 text-white cursor-default' 
              : isInstalling 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isInstalled ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Installed
            </div>
          ) : isInstalling ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
              Installing...
            </div>
          ) : (
            'Install'
          )}
        </motion.button>
      </div>
    </div>
  );
});