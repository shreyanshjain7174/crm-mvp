'use client';

import React from 'react';
import { MessageSquare, TrendingUp, Megaphone, BarChart3, Database, Zap, Bot } from 'lucide-react';

interface AgentCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', name: 'All', icon: Bot, count: 25 },
  { id: 'communication', name: 'Communication', icon: MessageSquare, count: 8 },
  { id: 'sales', name: 'Sales', icon: TrendingUp, count: 6 },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, count: 4 },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, count: 3 },
  { id: 'data', name: 'Data', icon: Database, count: 2 },
  { id: 'automation', name: 'Automation', icon: Zap, count: 2 }
];

export function AgentCategoryTabs({ selectedCategory, onCategoryChange }: AgentCategoryTabsProps) {
  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isSelected
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <Icon className={`w-4 h-4 mr-2 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`} />
              {category.name}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}