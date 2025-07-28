'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Phone, 
  Mail, 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Star,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface PipelineLead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  value: number;
  lastContact?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  aiScore?: number;
  tags?: string[];
}

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  icon?: React.ReactNode;
  leads: PipelineLead[];
}

interface SimplePipelineViewProps {
  stages: PipelineStage[];
  onLeadClick?: (lead: PipelineLead) => void;
  onAddLead?: (stageId: string) => void;
  onMoveToNext?: (leadId: string, currentStageId: string) => void;
}

export function SimplePipelineView({ 
  stages, 
  onLeadClick, 
  onAddLead,
  onMoveToNext 
}: SimplePipelineViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getNextStageId = (currentStageId: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStageId);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1].id : null;
  };

  const totalValue = stages.reduce((total, stage) => 
    total + stage.leads.reduce((stageTotal, lead) => stageTotal + lead.value, 0), 0
  );

  const totalLeads = stages.reduce((total, stage) => total + stage.leads.length, 0);

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">
                  {totalLeads > 0 ? formatCurrency(totalValue / totalLeads) : '$0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {stages[stages.length - 1]?.leads.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {stages.map((stage, stageIndex) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stageIndex * 0.1 }}
            className="space-y-4"
          >
            {/* Stage Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {stage.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {stage.leads.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {formatCurrency(stage.leads.reduce((sum, lead) => sum + lead.value, 0))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddLead?.(stage.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Stage Leads */}
            <div className="space-y-3">
              {stage.leads.map((lead, leadIndex) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (stageIndex * 0.1) + (leadIndex * 0.05) }}
                >
                  <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Lead Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              {lead.company && (
                                <p className="text-xs text-muted-foreground">{lead.company}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Lead Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(lead.value)}
                            </span>
                            <Badge className={getPriorityColor(lead.priority)} variant="secondary">
                              {lead.priority}
                            </Badge>
                          </div>

                          {lead.aiScore && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-muted-foreground">
                                AI Score: {lead.aiScore}%
                              </span>
                            </div>
                          )}

                          {lead.lastContact && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(lead.lastContact)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Contact Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center space-x-2">
                            {lead.phone && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Phone className="w-3 h-3" />
                              </Button>
                            )}
                            {lead.email && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Mail className="w-3 h-3" />
                              </Button>
                            )}
                          </div>

                          {/* Move to Next Stage */}
                          {getNextStageId(stage.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveToNext?.(lead.id, stage.id);
                              }}
                              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Next
                            </Button>
                          )}
                        </div>

                        {/* Tags */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {lead.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {lead.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{lead.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Empty State for Stage */}
              {stage.leads.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">
                      <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No leads in this stage</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddLead?.(stage.id)}
                        className="mt-2 text-xs"
                      >
                        Add Lead
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}