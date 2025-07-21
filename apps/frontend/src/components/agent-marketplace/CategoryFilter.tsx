/**
 * Category Filter - Agent Marketplace Categories
 * 
 * Provides category filtering for the agent marketplace with
 * visual icons and agent counts.
 */

'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: LucideIcon
  color: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id
        
        const buttonClass = isSelected 
          ? 'flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all bg-blue-50 border-blue-200 text-blue-700'
          : 'flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        
        const iconClass = isSelected ? 'w-4 h-4 text-blue-600' : `w-4 h-4 ${category.color}`
        
        const countClass = isSelected 
          ? 'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'
          : 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={buttonClass}
          >
            <Icon className={iconClass} />
            <span>{category.name}</span>
            {category.count !== undefined && (
              <span className={countClass}>
                {category.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}