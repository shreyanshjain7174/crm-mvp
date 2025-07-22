'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, MessageCircle, FileText, Clock } from 'lucide-react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useUserProgressStore } from '@/stores/userProgress';

interface SearchResult {
  id: string;
  type: 'contact' | 'message' | 'workflow' | 'recent';
  title: string;
  description?: string;
  url: string;
  icon: React.ComponentType<any>;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);

  // Mock search data - in real app, this would come from API
  const mockSearchData = React.useMemo((): SearchResult[] => [
    {
      id: '1',
      type: 'contact' as const,
      title: 'John Smith',
      description: 'Lead from LinkedIn - High Priority',
      url: '/dashboard/leads',
      icon: User
    },
    {
      id: '2',
      type: 'contact' as const,
      title: 'Sarah Johnson',
      description: 'Converted customer - Enterprise plan',
      url: '/dashboard/leads',
      icon: User
    },
    {
      id: '3',
      type: 'message' as const,
      title: 'WhatsApp conversation',
      description: 'Last message: "Looking forward to our demo"',
      url: '/dashboard/messages',
      icon: MessageCircle
    },
    {
      id: '4',
      type: 'workflow' as const,
      title: 'Lead Nurturing Workflow',
      description: 'Automated email sequence for new leads',
      url: '/dashboard/workflows',
      icon: FileText
    }
  ], []);

  // Filter search results based on query and user permissions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const filtered = mockSearchData.filter(item => {
      // Check if user has access to this feature
      const hasAccess = 
        (item.type === 'contact' && canAccessFeature('contacts:list')) ||
        (item.type === 'message' && canAccessFeature('messages:send')) ||
        (item.type === 'workflow' && canAccessFeature('workflows:view')) ||
        item.type === 'recent';

      if (!hasAccess) return false;

      // Filter by search query
      return (
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    setResults(filtered);
  }, [searchQuery, canAccessFeature, mockSearchData]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setSearchQuery('');
    router.push(result.url);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return User;
      case 'message':
        return MessageCircle;
      case 'workflow':
        return FileText;
      case 'recent':
        return Clock;
      default:
        return Search;
    }
  };

  return (
    <>
      {/* Search trigger */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search leads, messages... (⌘K)"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-80 cursor-pointer"
          onClick={() => setIsOpen(true)}
          readOnly
        />
      </div>

      {/* Search dialog */}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Search everything..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searchQuery.trim() ? 'No results found.' : 'Start typing to search...'}
          </CommandEmpty>
          
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => {
                const IconComponent = getResultIcon(result.type);
                return (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-sm text-muted-foreground">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Quick actions for new users */}
          {searchQuery.trim() === '' && (
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => {
                setIsOpen(false);
                router.push('/dashboard/leads?add=true');
              }}>
                <User className="mr-2 h-4 w-4" />
                <span>Add New Contact</span>
              </CommandItem>
              
              {canAccessFeature('messages:send') && (
                <CommandItem onSelect={() => {
                  setIsOpen(false);
                  router.push('/dashboard/messages');
                }}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Send Message</span>
                </CommandItem>
              )}
              
              {canAccessFeature('workflows:view') && (
                <CommandItem onSelect={() => {
                  setIsOpen(false);
                  router.push('/dashboard/workflows');
                }}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Create Workflow</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}