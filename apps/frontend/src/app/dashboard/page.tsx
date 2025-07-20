'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressiveDashboard } from '@/components/dashboard/ProgressiveDashboard';
import { AchievementSystem } from '@/components/help/AchievementToast';
import { ContextualGuide, useContextualHints } from '@/components/help/ContextualGuide';
import { DiscoveryPrompt } from '@/components/help/DiscoveryPrompt';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useUserProgressStore } from '@/stores/userProgress';
import { useFeatureTracker } from '@/hooks/useFeatureGate';
import { useCreateLead } from '@/hooks/use-api';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    priority: 'MEDIUM' as Priority,
    businessProfile: ''
  });
  
  const { hints } = useContextualHints();
  const { trackFeatureUsage } = useFeatureTracker();
  const stage = useUserProgressStore(state => state.stage);
  const resetProgress = useUserProgressStore(state => state.resetProgress);
  const createLead = useCreateLead();
  
  // Add reset function to global scope for easy access in console
  if (typeof window !== 'undefined') {
    (window as any).resetUserProgress = resetProgress;
  }
  
  const handleAddContact = () => {
    // Show the real add contact modal (tracking will happen on actual creation)
    setShowAddContactModal(true);
  };
  
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead.mutateAsync({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || undefined,
        source: newLead.source || undefined,
        priority: newLead.priority,
        businessProfile: newLead.businessProfile || undefined
      });
      
      // Track the feature usage after successful creation
      trackFeatureUsage('contacts:create');
      
      // Reset form and close modal
      setShowAddContactModal(false);
      setNewLead({
        name: '',
        phone: '',
        email: '',
        source: '',
        priority: 'MEDIUM',
        businessProfile: ''
      });
      
      // Navigate to leads page to show the new contact
      router.push('/dashboard/leads');
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };
  
  const handleDiscoveryAction = (actionType: string) => {
    switch (actionType) {
      case 'message_inactive':
        router.push('/dashboard/messages');
        break;
      case 'create_template':
        router.push('/dashboard/messages?tab=templates');
        break;
      case 'view_pipeline':
        router.push('/dashboard/leads');
        break;
      case 'try_ai':
        router.push('/dashboard/ai');
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };

  return (
    <>
      {/* Main progressive dashboard */}
      <ProgressiveDashboard onAddContact={handleAddContact} />
      
      {/* Help and guidance systems */}
      <ContextualGuide hints={hints} />
      <DiscoveryPrompt onAction={handleDiscoveryAction} />
      
      {/* Achievement celebrations */}
      <AchievementSystem />
      
      {/* Connection status for advanced users */}
      {(stage === 'advanced' || stage === 'expert') && (
        <div className="fixed bottom-4 right-4">
          <ConnectionStatus showDetails={false} />
        </div>
      )}
      
      {/* Add Contact Modal (real form) */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Your First Contact</h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
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
                    <SelectValue placeholder="How did you find this contact?" />
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
                <Label htmlFor="businessProfile">Business Notes</Label>
                <Input
                  id="businessProfile"
                  value={newLead.businessProfile}
                  onChange={(e) => setNewLead({ ...newLead, businessProfile: e.target.value })}
                  placeholder="Brief notes about their business"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddContactModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLead.isPending}>
                  {createLead.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
                      Creating...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                🎉 Adding your first contact will unlock messaging features and advance your CRM journey!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}