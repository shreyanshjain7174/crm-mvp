/**
 * Agent Card - Individual Agent Display
 * 
 * This component displays an individual AI agent in the marketplace grid.
 * It shows key information and provides install/view actions.
 */

'use client'

import React from 'react'
import { Star, Download, Check, Eye, Zap, Shield, Clock } from 'lucide-react'
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

interface AgentCardProps {
  agent: AgentManifestWithMetadata
  onInstall: (agent: AgentManifestWithMetadata) => void
  onViewDetails: (agent: AgentManifestWithMetadata) => void
}

export function AgentCard({ agent, onInstall, onViewDetails }: AgentCardProps) {
  const formatPrice = (pricing: any) => {
    switch (pricing.model) {
      case 'free':
        return 'Free'
      case 'subscription':
        if (pricing.subscription) {
          const monthly = pricing.subscription.monthlyPrice / 100
          return `₹${monthly}/month`
        }
        return 'Subscription'
      case 'usage':
        if (pricing.usage?.perCall) {
          return `₹${pricing.usage.perCall / 100} per call`
        }
        if (pricing.usage?.perMessage) {
          return `₹${pricing.usage.perMessage / 100} per message`
        }
        if (pricing.usage?.perMinute) {
          return `₹${pricing.usage.perMinute / 100} per minute`
        }
        return 'Usage-based'
      case 'one-time':
        if (pricing.oneTime) {
          return `₹${pricing.oneTime.price / 100} one-time`
        }
        return 'One-time purchase'
      default:
        return 'Contact for pricing'
    }
  }

  const formatInstallCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`
    }
    return count.toString()
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'whatsapp':
        return 'bg-green-100 text-green-700'
      case 'voice':
        return 'bg-blue-100 text-blue-700'
      case 'data':
        return 'bg-purple-100 text-purple-700'
      case 'automation':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const isInstalled = agent.metadata?.isInstalled
  const isFeatured = agent.metadata?.featured

  const cardClassName = `relative bg-white rounded-lg border transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
    isFeatured ? 'ring-2 ring-blue-500 ring-opacity-20 border-blue-200' : 'border-gray-200'
  }`

  return (
    <div className={cardClassName}>
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
            {agent.icon || '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
            <p className="text-sm text-gray-600 truncate">{agent.provider.name}</p>
            {agent.metadata?.category && (
              <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 ${getCategoryColor(agent.metadata.category)}`}>
                {agent.metadata.category.charAt(0).toUpperCase() + agent.metadata.category.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{agent.description}</p>

        {/* Rating & Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {agent.metadata?.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                <span className="font-medium text-gray-900">{agent.metadata.rating}</span>
                {agent.metadata.reviews && (
                  <span className="ml-1">({formatInstallCount(agent.metadata.reviews)})</span>
                )}
              </div>
            )}
          </div>
          {agent.metadata?.installs && (
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-1" />
              {formatInstallCount(agent.metadata.installs)}
            </div>
          )}
        </div>

        {/* Key Capabilities */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">Key Features</div>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((capability, index) => (
              <span 
                key={index} 
                className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {capability.requiresApproval && <Shield className="w-3 h-3 mr-1" />}
                {capability.name}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{agent.capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            {formatPrice(agent.pricing)}
          </div>
          {(agent.pricing as any).model === 'free' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Free
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => onViewDetails(agent)}
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>
          
          {isInstalled ? (
            <div className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
              <Check className="w-4 h-4 mr-2" />
              Installed
            </div>
          ) : (
            <button
              onClick={() => onInstall(agent)}
              className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </button>
          )}
        </div>

        {/* Quick Stats */}
        {((agent.pricing as any).model === 'usage' || (agent.pricing as any).subscription) && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            {(agent.pricing as any).subscription?.limits && (
              <div className="flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                {(agent.pricing as any).subscription.limits.messages && `${(agent.pricing as any).subscription.limits.messages} msgs/mo`}
                {(agent.pricing as any).subscription.limits.apiCalls && ` • ${(agent.pricing as any).subscription.limits.apiCalls} calls/mo`}
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              v{agent.version}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}