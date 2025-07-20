'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  ChevronRight, 
  Users, 
  Target,
  TrendingUp,
  Trophy,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useUserProgressStore } from '@/stores/userProgress';

export interface PipelineLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  value?: number;
  lastContact?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  aiScore?: number;
  tags?: string[];
}

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  icon: React.ReactNode;
  leads: PipelineLead[];
}

interface PipelineViewProps {
  stages?: PipelineStage[];
  onLeadMove?: (leadId: string, sourceStageId: string, destStageId: string, newIndex: number) => void;
  onLeadClick?: (lead: PipelineLead) => void;
  onAddLead?: (stageId: string) => void;
}

const defaultStages: PipelineStage[] = [
  {
    id: 'new-leads',
    title: 'New Leads',
    color: 'from-blue-500 to-blue-600',
    icon: <Users className="h-4 w-4" />,
    leads: []
  },
  {
    id: 'contacted',
    title: 'Contacted',
    color: 'from-purple-500 to-purple-600',
    icon: <MessageCircle className="h-4 w-4" />,
    leads: []
  },
  {
    id: 'qualified',
    title: 'Qualified',
    color: 'from-orange-500 to-orange-600',
    icon: <Target className="h-4 w-4" />,
    leads: []
  },
  {
    id: 'proposal',
    title: 'Proposal',
    color: 'from-pink-500 to-pink-600',
    icon: <TrendingUp className="h-4 w-4" />,
    leads: []
  },
  {
    id: 'won',
    title: 'Won',
    color: 'from-green-500 to-green-600',
    icon: <Trophy className="h-4 w-4" />,
    leads: []
  }
];

export function PipelineView({ 
  stages = defaultStages, 
  onLeadMove,
  onLeadClick,
  onAddLead 
}: PipelineViewProps) {
  const [pipelineStages, setPipelineStages] = useState(stages);
  const incrementStat = useUserProgressStore(state => state.incrementStat);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Skip if dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStage = pipelineStages.find(stage => stage.id === source.droppableId);
    const destStage = pipelineStages.find(stage => stage.id === destination.droppableId);
    
    if (!sourceStage || !destStage) return;

    const newPipelineStages = [...pipelineStages];
    const sourceStageIndex = newPipelineStages.findIndex(s => s.id === source.droppableId);
    const destStageIndex = newPipelineStages.findIndex(s => s.id === destination.droppableId);

    // Remove lead from source
    const [movedLead] = newPipelineStages[sourceStageIndex].leads.splice(source.index, 1);
    
    // Add lead to destination
    newPipelineStages[destStageIndex].leads.splice(destination.index, 0, movedLead);

    setPipelineStages(newPipelineStages);
    
    // Track pipeline action
    incrementStat('pipelineActions');
    
    // Call callback if provided
    if (onLeadMove) {
      onLeadMove(movedLead.id, source.droppableId, destination.droppableId, destination.index);
    }
  };

  const totalLeads = pipelineStages.reduce((sum, stage) => sum + stage.leads.length, 0);
  const totalValue = pipelineStages.reduce((sum, stage) => 
    sum + stage.leads.reduce((stageSum, lead) => stageSum + (lead.value || 0), 0), 0
  );
  const conversionRate = totalLeads > 0 
    ? Math.round((pipelineStages.find(s => s.id === 'won')?.leads.length || 0) / totalLeads * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Deal Size</p>
                <p className="text-2xl font-bold">
                  ₹{totalLeads > 0 ? Math.round(totalValue / totalLeads).toLocaleString('en-IN') : 0}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-r text-white",
                        stage.color
                      )}>
                        {stage.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{stage.title}</CardTitle>
                        <p className="text-sm text-gray-500">{stage.leads.length} leads</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddLead?.(stage.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress 
                    value={(stage.leads.length / Math.max(totalLeads, 1)) * 100} 
                    className="h-1 mt-3"
                  />
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "space-y-2 min-h-[400px] transition-colors",
                          snapshot.isDraggingOver && "bg-gray-50 rounded-lg"
                        )}
                      >
                        {stage.leads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onLeadClick?.(lead)}
                                className={cn(
                                  "bg-white border rounded-lg p-3 cursor-pointer transition-all",
                                  "hover:shadow-md hover:border-gray-300",
                                  snapshot.isDragging && "shadow-lg rotate-3"
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{lead.name}</p>
                                      {lead.company && (
                                        <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={cn("text-xs", getPriorityColor(lead.priority))}>
                                    {lead.priority}
                                  </Badge>
                                </div>
                                
                                {lead.value && (
                                  <p className="text-sm font-medium text-gray-900 mb-2">
                                    ₹{lead.value.toLocaleString('en-IN')}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-3 w-3" />
                                    <Mail className="h-3 w-3" />
                                    <MessageCircle className="h-3 w-3" />
                                  </div>
                                  {lead.aiScore && (
                                    <span className="font-medium text-primary">
                                      AI: {lead.aiScore}%
                                    </span>
                                  )}
                                </div>
                                
                                {lead.lastContact && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Last contact: {formatDate(lead.lastContact)}
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default PipelineView;