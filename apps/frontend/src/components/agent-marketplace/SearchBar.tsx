/**
 * Search Bar - Agent Marketplace Search
 * 
 * Provides search functionality for the agent marketplace with
 * suggestions and filtering capabilities.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search agents...', 
  suggestions = [] 
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Default suggestions when no value
  const defaultSuggestions = [
    'WhatsApp automation',
    'Voice agents',
    'Data enrichment',
    'Follow-up scheduling',
    'Customer support',
    'Lead qualification'
  ]

  useEffect(() => {
    if (!value) {
      setFilteredSuggestions(defaultSuggestions.slice(0, 5))
      return
    }

    const filtered = [...suggestions, ...defaultSuggestions]
      .filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase()) && 
        suggestion.toLowerCase() !== value.toLowerCase()
      )
      .slice(0, 5)

    setFilteredSuggestions(filtered)
  }, [value, suggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex items-center">
                  <Search className="w-4 h-4 text-gray-400 mr-3" />
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}