'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight,
  Settings,
  Filter,
  SortAsc,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Target,
  BarChart3,
  Users,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  stageHistory?: { stageId: string; timestamp: Date; }[];
  assignedTo?: string;
  source?: string;
  notes?: string;
}

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  icon?: React.ReactNode;
  leads: PipelineLead[];
  isVisible?: boolean;
  automationRules?: {
    autoAdvance?: boolean;
    timeLimit?: number; // days
    conditions?: string[];
  };
  customFields?: { key: string; label: string; type: 'text' | 'number' | 'date'; }[];
}

interface PipelineConfig {
  viewMode: 'card' | 'table' | 'kanban';
  sortBy: 'name' | 'value' | 'lastContact' | 'priority' | 'aiScore';
  sortOrder: 'asc' | 'desc';
  filters: {
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    assignedTo?: string;
    source?: string;
    valueRange?: { min: number; max: number; };
  };
  showMetrics: boolean;
  compactView: boolean;
  autoRefresh: boolean;
}

interface EnhancedPipelineViewProps {
  stages: PipelineStage[];
  onLeadClick?: (lead: PipelineLead) => void;
  onAddLead?: (stageId: string) => void;
  onMoveToNext?: (leadId: string, currentStageId: string) => void;
  onMoveLead?: (leadId: string, targetStageId: string) => void;
  onStageUpdate?: (stageId: string, updates: Partial<PipelineStage>) => void;
  onConfigChange?: (config: PipelineConfig) => void;
}

export function EnhancedPipelineView({ 
  stages, 
  onLeadClick, 
  onAddLead,
  onMoveToNext,
  onMoveLead,
  onStageUpdate,
  onConfigChange
}: EnhancedPipelineViewProps) {
  const [config, setConfig] = useState<PipelineConfig>({
    viewMode: 'kanban',
    sortBy: 'value',
    sortOrder: 'desc',
    filters: {},
    showMetrics: true,
    compactView: false,
    autoRefresh: false
  });

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  
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

  const getStageProgress = (stage: PipelineStage) => {
    if (!stage.automationRules?.timeLimit) return null;
    
    const overdueTasks = stage.leads.filter(lead => {
      const lastActivity = lead.lastContact || new Date(0);
      const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > stage.automationRules!.timeLimit!;
    });

    return {
      total: stage.leads.length,
      overdue: overdueTasks.length,
      onTrack: stage.leads.length - overdueTasks.length
    };
  };

  const filteredAndSortedLeads = (stageLeads: PipelineLead[]) => {
    let filtered = [...stageLeads];

    // Apply filters
    if (config.filters.priority) {
      filtered = filtered.filter(lead => lead.priority === config.filters.priority);
    }
    if (config.filters.assignedTo) {
      filtered = filtered.filter(lead => lead.assignedTo === config.filters.assignedTo);
    }
    if (config.filters.source) {
      filtered = filtered.filter(lead => lead.source === config.filters.source);
    }
    if (config.filters.valueRange) {
      filtered = filtered.filter(lead => 
        lead.value >= config.filters.valueRange!.min && 
        lead.value <= config.filters.valueRange!.max
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (config.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'lastContact':
          aVal = a.lastContact?.getTime() || 0;
          bVal = b.lastContact?.getTime() || 0;
          break;
        case 'priority':
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'aiScore':
          aVal = a.aiScore || 0;
          bVal = b.aiScore || 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return config.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return config.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  };

  const handleConfigChange = (updates: Partial<PipelineConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (draggedLead) {
      onMoveLead?.(draggedLead, targetStageId);
      setDraggedLead(null);
    }
  };

  const visibleStages = stages.filter(stage => stage.isVisible !== false);
  const totalValue = visibleStages.reduce((total, stage) => 
    total + stage.leads.reduce((stageTotal, lead) => stageTotal + lead.value, 0), 0
  );
  const totalLeads = visibleStages.reduce((total, stage) => total + stage.leads.length, 0);

  const renderPipelineConfiguration = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configure Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipeline Configuration</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="view" className="w-full">
          <TabsList>
            <TabsTrigger value="view">View Settings</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>View Mode</Label>
                  <Select value={config.viewMode} onValueChange={(value: any) => handleConfigChange({ viewMode: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kanban">Kanban Board</SelectItem>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="card">Card Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select value={config.sortBy} onValueChange={(value: any) => handleConfigChange({ sortBy: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Deal Value</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="lastContact">Last Contact</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="aiScore">AI Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort Order</Label>
                  <Select value={config.sortOrder} onValueChange={(value: any) => handleConfigChange({ sortOrder: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Metrics</Label>
                  <Switch 
                    checked={config.showMetrics} 
                    onCheckedChange={(checked) => handleConfigChange({ showMetrics: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Compact View</Label>
                  <Switch 
                    checked={config.compactView} 
                    onCheckedChange={(checked) => handleConfigChange({ compactView: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto Refresh</Label>
                  <Switch 
                    checked={config.autoRefresh} 
                    onCheckedChange={(checked) => handleConfigChange({ autoRefresh: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold">Filters</Label>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={config.filters.priority || 'all'} 
                    onValueChange={(value) => handleConfigChange({ 
                      filters: { ...config.filters, priority: value === 'all' ? undefined : value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Deal Value Range</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      value={config.filters.valueRange?.min || ''} 
                      onChange={(e) => handleConfigChange({
                        filters: {
                          ...config.filters,
                          valueRange: {
                            ...config.filters.valueRange,
                            min: parseInt(e.target.value) || 0,
                            max: config.filters.valueRange?.max || 1000000
                          }
                        }
                      })}
                    />
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={config.filters.valueRange?.max || ''} 
                      onChange={(e) => handleConfigChange({
                        filters: {
                          ...config.filters,
                          valueRange: {
                            min: config.filters.valueRange?.min || 0,
                            max: parseInt(e.target.value) || 1000000
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            {stages.map((stage, index) => (
              <Card key={stage.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${stage.color}`} />
                      <div>
                        <h4 className="font-medium">{stage.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.leads.length} leads • {formatCurrency(stage.leads.reduce((sum, lead) => sum + lead.value, 0))}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={stage.isVisible !== false}
                        onCheckedChange={(checked) => onStageUpdate?.(stage.id, { isVisible: checked })}
                      />
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Automation Rules</h3>
              </div>
              
              {stages.map(stage => (
                <Card key={stage.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{stage.title}</h4>
                        <Switch defaultChecked={stage.automationRules?.autoAdvance} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Time Limit (days)</Label>
                          <Input 
                            type="number" 
                            defaultValue={stage.automationRules?.timeLimit || ''} 
                            placeholder="No limit"
                          />
                        </div>
                        <div>
                          <Label>Auto-advance when</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time">Time limit reached</SelectItem>
                              <SelectItem value="activity">Activity completed</SelectItem>
                              <SelectItem value="score">AI score threshold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stages.slice(0, -1).map((stage, index) => {
                      const nextStage = stages[index + 1];
                      const conversionRate = stage.leads.length > 0 
                        ? ((nextStage?.leads.length || 0) / stage.leads.length * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div key={stage.id} className="flex justify-between">
                          <span className="text-sm">{stage.title} → {nextStage?.title}</span>
                          <span className="font-medium">{conversionRate}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stage Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stages.map(stage => {
                      const progress = getStageProgress(stage);
                      return (
                        <div key={stage.id} className="flex justify-between">
                          <span className="text-sm">{stage.title}</span>
                          <div className="flex items-center space-x-1">
                            {progress?.overdue ? (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            )}
                            <span className="text-sm">{progress?.onTrack || stage.leads.length}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {visibleStages.map((stage, stageIndex) => {
        const progress = getStageProgress(stage);
        const filteredLeads = filteredAndSortedLeads(stage.leads);
        
        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stageIndex * 0.1 }}
            className="space-y-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Enhanced Stage Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color.replace('from-', 'bg-').replace(' to-' + stage.color.split(' to-')[1], '')}`} />
                    <CardTitle className="text-lg font-semibold">
                      {stage.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {filteredLeads.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {formatCurrency(filteredLeads.reduce((sum, lead) => sum + lead.value, 0))}
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
                  
                  {/* Stage Progress Indicator */}
                  {progress && (
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full transition-all"
                          style={{ width: `${(progress.onTrack / progress.total) * 100}%` }}
                        />
                      </div>
                      {progress.overdue > 0 && (
                        <div className="flex items-center space-x-1 text-red-500">
                          <Timer className="w-3 h-3" />
                          <span>{progress.overdue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Stage Leads */}
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {filteredLeads.map((lead, leadIndex) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: leadIndex * 0.05 }}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    className={cn(
                      "cursor-move",
                      draggedLead === lead.id && "opacity-50"
                    )}
                  >
                    <Card className="group hover:shadow-md transition-all duration-200">
                      <CardContent className={cn("p-4", config.compactView && "p-3")}>
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
                              onClick={() => onLeadClick?.(lead)}
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

                            {config.showMetrics && (
                              <>
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

                                {lead.assignedTo && (
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {lead.assignedTo}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {!config.compactView && (
                            <>
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
                                {stageIndex < visibleStages.length - 1 && (
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
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State for Stage */}
              {filteredLeads.length === 0 && (
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
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Pipeline Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">Sales Pipeline</h2>
            <p className="text-muted-foreground">Track and manage your deals through the sales process</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          {renderPipelineConfiguration()}
        </div>
      </div>

      {/* Enhanced Pipeline Summary */}
      {config.showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <Target className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Close Rate</p>
                  <p className="text-2xl font-bold">
                    {stages[stages.length - 1]?.leads.length || 0 > 0 
                      ? `${((stages[stages.length - 1]?.leads.length || 0) / totalLeads * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Cycle</p>
                  <p className="text-2xl font-bold">12d</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline View */}
      {config.viewMode === 'kanban' && renderKanbanView()}
    </div>
  );
}