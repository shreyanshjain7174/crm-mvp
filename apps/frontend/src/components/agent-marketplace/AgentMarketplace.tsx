/**
 * Agent Marketplace - Main Discovery Interface
 * 
 * This component provides the main interface for users to discover, browse,
 * and install AI agents from the marketplace. It's the App Store for AI agents.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Star, Download, Zap, Bot, MessageSquare, Phone, BarChart3 } from 'lucide-react'
import { AgentCard } from './AgentCard'
import { CategoryFilter } from './CategoryFilter'
import { SearchBar } from './SearchBar'
import type { AgentManifest } from '../../types/agent-types'

// Extend AgentManifest with metadata for frontend
interface AgentManifestWithMetadata extends AgentManifest {
  metadata?: {
    rating?: number
    reviews?: number
    installs?: number
    category?: string
    featured?: boolean
    isInstalled?: boolean
  }
}

interface AgentMarketplaceProps {
  businessId: string
  onInstallAgent?: (agentId: string) => void
}

export function AgentMarketplace({ businessId, onInstallAgent }: AgentMarketplaceProps) {
  const [agents, setAgents] = useState<AgentManifestWithMetadata[]>([])
  const [filteredAgents, setFilteredAgents] = useState<AgentManifestWithMetadata[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', name: 'All Agents', icon: Bot, color: 'text-gray-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
    { id: 'voice', name: 'Voice Agents', icon: Phone, color: 'text-blue-600' },
    { id: 'data', name: 'Data & Analytics', icon: BarChart3, color: 'text-purple-600' },
    { id: 'automation', name: 'Automation', icon: Zap, color: 'text-orange-600' }
  ]

  useEffect(() => {
    // Mock data for demonstration - in production, this would come from API
    const mockAgents: AgentManifestWithMetadata[] = [
      {
        id: 'whatsapp-ai-responder',
        name: 'WhatsApp AI Responder',
        version: '2.1.0',
        provider: 'Local AI Co.',
        description: 'Automatically respond to WhatsApp messages with intelligent replies',
        capabilities: [
          { id: 'auto-reply', name: 'Auto Reply', description: 'Automatic message responses', inputTypes: ['message'], outputTypes: ['message'], requiresApproval: false },
          { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze customer emotions', inputTypes: ['message'], outputTypes: ['analytics'], requiresApproval: false }
        ],
        permissions: [
          { resource: 'message', actions: ['read', 'create'], constraints: { businessScope: true } }
        ],
        pricing: {
          model: 'subscription',
          subscription: {
            monthlyPrice: 99900,
            limits: { messages: 5000, apiCalls: 10000 }
          }
        } as any,
        ui: {},
        supportedDataTypes: ['message', 'contact', 'conversation'],
        metadata: {
          rating: 4.8,
          reviews: 2341,
          installs: 15670,
          category: 'whatsapp',
          featured: true,
          isInstalled: false
        }
      }
    ]

    const loadAgents = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      setAgents(mockAgents)
      setFilteredAgents(mockAgents)
      setLoading(false)
    }
    
    loadAgents()
  }, [])

  useEffect(() => {
    let filtered = agents

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(agent => agent.metadata?.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.provider.toLowerCase().includes(query)
      )
    }

    setFilteredAgents(filtered)
  }, [agents, selectedCategory, searchQuery])

  const handleInstallAgent = (agent: AgentManifestWithMetadata) => {
    setAgents(prev => prev.map(a => 
      a.id === agent.id 
        ? { ...a, metadata: { ...a.metadata, isInstalled: true } }
        : a
    ))
    onInstallAgent?.(agent.id)
    alert(`${agent.name} installed successfully!`)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Agent Marketplace</h1>
            <p className="text-gray-600">Discover and install AI agents to supercharge your CRM</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search agents, capabilities, or providers..."
          />
        </div>
      </div>

      {/* Category Filters */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'} 
          {searchQuery && ` found for "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
        </div>
      </div>

      {/* Agent Grid */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-16">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? `No agents match your search for "${searchQuery}"`
              : 'No agents available in this category'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAgents
            .sort((a, b) => {
              if (a.metadata?.featured && !b.metadata?.featured) return -1
              if (!a.metadata?.featured && b.metadata?.featured) return 1
              return (b.metadata?.rating || 0) - (a.metadata?.rating || 0)
            })
            .map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onInstall={handleInstallAgent}
                onViewDetails={() => {}}
              />
            ))}
        </div>
      )}
    </div>
  )
}