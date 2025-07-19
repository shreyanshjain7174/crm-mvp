'use client';

import React from 'react';
import { Users, Plus, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyContactsProps {
  onAddContact?: () => void;
  onImportContacts?: () => void;
  isSearching?: boolean;
  searchQuery?: string;
}

export function EmptyContacts({ 
  onAddContact, 
  onImportContacts, 
  isSearching = false,
  searchQuery 
}: EmptyContactsProps) {
  if (isSearching) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No contacts found
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            No contacts match &quot;{searchQuery}&quot;. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-blue-500" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No contacts yet
        </h3>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Start building your network by adding your first contact. You can add them manually or import from a file.
        </p>
        
        <div className="flex gap-3">
          <Button 
            onClick={onAddContact}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onImportContacts}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
          <p className="text-sm text-blue-700 text-center">
            <span className="font-semibold">Tip:</span> Adding contacts unlocks messaging features and helps you organize your customer relationships.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmptyContacts;