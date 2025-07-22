'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface AgentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgentSearchBar({ value, onChange, placeholder = "Search agents..." }: AgentSearchBarProps) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        placeholder={placeholder}
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}