'use client';

import React from 'react';
import { Star, Download, Zap, Crown, Shield, TrendingUp } from 'lucide-react';
import type { AgentManifest } from '../../types/agent-types';

interface AgentCardProps {
  agent: AgentManifest;
  onInstall: () => void;
  featured?: boolean;
  installed?: boolean;
}

export function AgentCard({ agent, onInstall, featured = false, installed = false }: AgentCardProps) {
  const formatPricing = (pricing: AgentManifest['pricing']) => {
    switch (pricing.model) {
      case 'free':
        return { text: 'Free', color: 'text-green-600' };
      case 'freemium':
        return { text: 'Freemium', color: 'text-blue-600' };
      case 'fixed':
        return { 
          text: `₹${pricing.price}/${pricing.period}`, 
          color: 'text-gray-700' 
        };
      case 'usage-based':
        return { 
          text: `₹${pricing.rate}/${pricing.unit}`, 
          color: 'text-gray-700' 
        };
      case 'tiered':
        return { 
          text: `From ₹${pricing.tiers[0].price}`, 
          color: 'text-gray-700' 
        };
      default:
        return { text: 'Custom', color: 'text-gray-500' };
    }
  };

  const pricingInfo = formatPricing(agent.pricing);

  const getCategoryIcon = (category: string) => {
    const icons = {
      communication: '💬',
      sales: '📈',
      marketing: '📢',
      analytics: '📊',
      data: '🗃️',
      automation: '⚡',
      other: '🤖'
    };
    return icons[category as keyof typeof icons] || '🤖';
  };

  return (
    <div className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md hover:border-indigo-200 ${
      featured ? 'border-indigo-200 shadow-sm' : 'border-gray-200'
    }`}>
      {/* Featured Badge */}
      {featured && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-t-lg flex items-center">
          <Crown className="w-3 h-3 mr-1" />
          Featured
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
              {agent.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.icon} alt={agent.name} className="w-8 h-8" />
              ) : (
                getCategoryIcon(agent.category)
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
              <p className="text-xs text-gray-500">{agent.provider.name}</p>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="text-right">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
              {agent.rating || 4.5}
              <span className="ml-1">({agent.reviews || '1.2k'})</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Download className="w-3 h-3 mr-1" />
              {agent.installs || '10k+'}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Capabilities Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span
              key={capability}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>

        {/* Pricing and Install */}
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium ${pricingInfo.color}`}>
              {pricingInfo.text}
            </span>
            {agent.pricing.model === 'freemium' && (
              <p className="text-xs text-gray-500">
                Free up to {(agent.pricing as any).freeLimit} uses
              </p>
            )}
          </div>

          <button
            onClick={onInstall}
            disabled={installed}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              installed
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : featured
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {installed ? 'Installed' : 'Install'}
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Shield className="w-3 h-3 mr-1" />
            Security verified
          </div>
          
          {agent.trending && (
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </div>
          )}
        </div>
      </div>
    </div>
  );
}