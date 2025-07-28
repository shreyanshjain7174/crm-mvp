'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyPipeline } from '@/components/empty-states/EmptyPipeline';
import { SimplePipelineView, PipelineStage, PipelineLead } from '@/components/pipeline/SimplePipelineView';
import { SimpleFeatureReveal } from '@/components/animations/SimpleFeatureReveal';
import { useUserProgressStore, useCanAccessFeature } from '@/stores/userProgress';
import { useLeads, useUpdateLead } from '@/hooks/use-api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Convert API leads to pipeline format
function convertLeadsToPipelineData(leads: any[]): PipelineStage[] {
  const stages: PipelineStage[] = [
    {
      id: 'new-leads',
      title: 'New Leads',
      color: 'from-blue-500 to-blue-600',
      icon: null,
      leads: []
    },
    {
      id: 'contacted',
      title: 'Contacted',
      color: 'from-purple-500 to-purple-600',
      icon: null,
      leads: []
    },
    {
      id: 'qualified',
      title: 'Qualified',
      color: 'from-orange-500 to-orange-600',
      icon: null,
      leads: []
    },
    {
      id: 'proposal',
      title: 'Proposal',
      color: 'from-pink-500 to-pink-600',
      icon: null,
      leads: []
    },
    {
      id: 'won',
      title: 'Won',
      color: 'from-green-500 to-green-600',
      icon: null,
      leads: []
    }
  ];

  // Map lead status to pipeline stages
  leads.forEach(lead => {
    const pipelineLead: PipelineLead = {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      company: lead.businessProfile,
      value: lead.estimatedValue || Math.floor(Math.random() * 100000) + 10000,
      lastContact: lead.updatedAt ? new Date(lead.updatedAt) : undefined,
      priority: lead.priority || 'MEDIUM',
      aiScore: lead.aiScore,
      tags: lead.tags || []
    };

    // Map lead status to stage
    switch (lead.status) {
      case 'COLD':
        stages[0].leads.push(pipelineLead); // New Leads
        break;
      case 'WARM':
        stages[1].leads.push(pipelineLead); // Contacted
        break;
      case 'HOT':
        stages[2].leads.push(pipelineLead); // Qualified
        break;
      case 'CONVERTED':
        stages[4].leads.push(pipelineLead); // Won
        break;
      case 'LOST':
        // Don't show lost leads in pipeline
        break;
      default:
        stages[0].leads.push(pipelineLead); // Default to New Leads
    }
  });

  return stages;
}

export default function PipelinePage() {
  const router = useRouter();
  const canAccessPipeline = useCanAccessFeature()('pipeline:view');
  const { stats, incrementStat, pendingCelebrations, completePendingCelebration } = useUserProgressStore();
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  
  const [showFeatureReveal, setShowFeatureReveal] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  // Check if this is the first time accessing the pipeline
  useEffect(() => {
    const pipelineCelebration = pendingCelebrations.find(c => c === 'feature-pipeline:view');
    if (pipelineCelebration && canAccessPipeline) {
      setShowFeatureReveal(true);
      completePendingCelebration(pipelineCelebration);
    }
  }, [pendingCelebrations, canAccessPipeline, completePendingCelebration]);

  // Convert leads to pipeline format
  useEffect(() => {
    if (leads.length > 0) {
      setPipelineStages(convertLeadsToPipelineData(leads));
    }
  }, [leads]);

  const handleAddContact = () => {
    router.push('/dashboard/contacts');
  };

  const handleSetupPipeline = () => {
    // This would open a pipeline setup modal or guide
    console.log('Setting up pipeline...');
  };

  const handleMoveToNext = async (leadId: string, currentStageId: string) => {
    // Map pipeline stages to lead statuses
    const stageToStatusMap: Record<string, 'COLD' | 'WARM' | 'HOT' | 'CONVERTED' | 'LOST'> = {
      'new-leads': 'COLD',
      'contacted': 'WARM', 
      'qualified': 'HOT',
      'proposal': 'HOT', // Both qualified and proposal use HOT status
      'won': 'CONVERTED'
    };

    // Find next stage
    const currentIndex = pipelineStages.findIndex(stage => stage.id === currentStageId);
    if (currentIndex === -1 || currentIndex === pipelineStages.length - 1) {
      return; // Already at last stage or stage not found
    }

    const nextStage = pipelineStages[currentIndex + 1];
    const newStatus = stageToStatusMap[nextStage.id];
    
    if (!newStatus) {
      console.error('Unknown destination stage:', nextStage.id);
      return;
    }

    try {
      // Update lead status in backend
      await updateLead.mutateAsync({
        id: leadId,
        data: { status: newStatus }
      });
      
      // Update local state optimistically
      const newStages = [...pipelineStages];
      const sourceStage = newStages[currentIndex];
      const destStage = newStages[currentIndex + 1];
      
      const leadIndex = sourceStage.leads.findIndex(l => l.id === leadId);
      if (leadIndex !== -1) {
        const [lead] = sourceStage.leads.splice(leadIndex, 1);
        destStage.leads.unshift(lead); // Add to beginning of next stage
        setPipelineStages(newStages);
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
      // TODO: Show error toast to user
    }
  };

  const handleLeadClick = (lead: PipelineLead) => {
    router.push(`/dashboard/leads/${lead.id}`);
  };

  const handleAddLead = (stageId: string) => {
    router.push(`/dashboard/leads?stage=${stageId}`);
  };

  // Show empty state if pipeline is locked
  if (!canAccessPipeline) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyPipeline
          onCreatePipeline={handleSetupPipeline}
          onViewContacts={handleAddContact}
          contactCount={stats.contactsAdded}
          requiredContacts={10}
          isLocked={true}
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show feature reveal if it's the first time
  if (showFeatureReveal) {
    return (
      <SimpleFeatureReveal
        featureName="Pipeline View"
        description="Organize your leads visually and track their progress through your sales process!"
        onContinue={() => setShowFeatureReveal(false)}
      />
    );
  }

  // Show empty state if no leads
  if (leads.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Sales Pipeline</h1>
        <p className="text-gray-600 mb-8">Visualize and manage your leads through the sales process</p>
        
        <EmptyPipeline
          onCreatePipeline={handleSetupPipeline}
          onViewContacts={handleAddContact}
          contactCount={stats.contactsAdded}
          requiredContacts={10}
          isLocked={false}
        />
      </div>
    );
  }

  // Show pipeline view
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sales Pipeline</h1>
        <p className="text-gray-600">Move leads through your sales process with simple progression controls</p>
      </div>
      
      <SimplePipelineView
        stages={pipelineStages}
        onMoveToNext={handleMoveToNext}
        onLeadClick={handleLeadClick}
        onAddLead={handleAddLead}
      />
    </div>
  );
}