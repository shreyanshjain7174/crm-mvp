'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, Phone, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/use-api';
import { Lead } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useUserProgressStore } from '@/stores/userProgress';
import { validateLead } from '@/lib/validation';
import { NameInput, EmailInput, PhoneInput, ValidatedInput } from '@/components/ui/validated-input';

type LeadStatus = 'COLD' | 'WARM' | 'HOT' | 'CONVERTED' | 'LOST';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Auto-open modal if accessed with add=true parameter
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    priority: 'MEDIUM' as Priority,
    businessProfile: ''
  });
  
  const { data: leads = [], isLoading, error } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const incrementStat = useUserProgressStore(state => state.incrementStat);
  const syncWithBackend = useUserProgressStore(state => state.syncWithBackend);

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'COLD': return 'bg-blue-100 text-blue-800';
      case 'WARM': return 'bg-yellow-100 text-yellow-800';
      case 'HOT': return 'bg-red-100 text-red-800';
      case 'CONVERTED': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = selectedStatus === 'ALL' || lead.status === selectedStatus;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getLastContact = (lead: Lead) => {
    if (lead.messages && lead.messages.length > 0) {
      return formatDate(lead.messages[0].timestamp);
    }
    return formatDate(lead.updatedAt);
  };

  const getNextAction = (lead: Lead) => {
    if (lead.aiSuggestions && lead.aiSuggestions.length > 0) {
      const suggestion = lead.aiSuggestions[0];
      if (suggestion.type === 'MESSAGE') return 'AI suggests response';
      if (suggestion.type === 'FOLLOW_UP') return 'Follow-up recommended';
      if (suggestion.type === 'STATUS_CHANGE') return 'Status update suggested';
    }
    return 'No pending actions';
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      // Validate and sanitize lead data
      const validationResult = validateLead(newLead);
      
      if (!validationResult.success) {
        setFormErrors(validationResult.errors || {});
        return;
      }
      
      await createLead.mutateAsync(validationResult.data);
      
      // Update user progress stats
      incrementStat('contactsAdded');
      
      // Sync with backend to update dashboard
      await syncWithBackend();
      
      setIsAddModalOpen(false);
      setNewLead({
        name: '',
        phone: '',
        email: '',
        source: '',
        priority: 'MEDIUM',
        businessProfile: ''
      });
    } catch (error) {
      console.error('Failed to create lead:', error);
      setFormErrors({ general: 'Failed to create lead. Please try again.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error('Leads API Error:', error);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading leads</h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error && error.message.includes('No token provided') 
              ? 'Please log in to access your leads'
              : 'Unable to connect to the backend API'
            }
          </p>
          <div className="text-sm text-gray-500">
            Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600">Manage and track your potential customers</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newLead.priority} onValueChange={(value) => setNewLead({ ...newLead, priority: value as Priority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessProfile">Business Profile</Label>
                <Input
                  id="businessProfile"
                  value={newLead.businessProfile}
                  onChange={(e) => setNewLead({ ...newLead, businessProfile: e.target.value })}
                  placeholder="Brief description of business needs"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLead.isPending}>
                  {createLead.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search leads..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as LeadStatus | 'ALL')}
          >
            <option value="ALL">All Status</option>
            <option value="COLD">Cold</option>
            <option value="WARM">Warm</option>
            <option value="HOT">Hot</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                      <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </Badge>
                      {lead.aiScore && (
                        <div className="text-xs text-gray-500">
                          AI Score: <span className="font-medium text-primary">{lead.aiScore}%</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Source: <span className="font-medium">{lead.source}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">
                        Last contact: <span className="font-medium">{getLastContact(lead)}</span>
                      </p>
                      <p className="text-primary font-medium">{getNextAction(lead)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}