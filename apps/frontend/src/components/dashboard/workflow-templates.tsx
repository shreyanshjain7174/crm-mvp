'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Play, 
  Pause, 
  Eye, 
  Copy, 
  Edit,
  Bot,
  User,
  Zap,
  Clock,
  Timer,
  Target,
  MessageCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useWorkflows } from '@/hooks/use-workflows';
import { useState } from 'react';

export function WorkflowTemplates() {
  const { templates, stats, startWorkflow, isLoading } = useWorkflows();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startContext, setStartContext] = useState({
    leadId: '',
    messageId: '',
    priority: 'normal'
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lead_nurturing': return Target;
      case 'message_automation': return MessageCircle;
      case 'follow_up': return RefreshCw;
      case 'qualification': return BarChart3;
      default: return Settings;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'lead_nurturing': return 'bg-blue-100 text-blue-800';
      case 'message_automation': return 'bg-green-100 text-green-800';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800';
      case 'qualification': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'agent_task': return Bot;
      case 'human_approval': return User;
      case 'webhook': return Zap;
      case 'delay': return Timer;
      default: return Clock;
    }
  };

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType) {
      case 'manual': return 'bg-gray-100 text-gray-800';
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'schedule': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartWorkflow = async () => {
    if (!selectedTemplate) return;
    
    await startWorkflow(selectedTemplate, startContext);
    setStartDialogOpen(false);
    setStartContext({ leadId: '', messageId: '', priority: 'normal' });
    setSelectedTemplate(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Workflow Templates
          </CardTitle>
          <div className="text-sm text-gray-600">
            {stats.activeTemplates}/{stats.totalTemplates} active templates
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const CategoryIcon = getCategoryIcon(template.category);
            
            return (
              <div key={template.id} className="bg-white border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
                {/* Template Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                    <div className="flex items-center space-x-1">
                      {template.isActive ? (
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                      ) : (
                        <div className="h-2 w-2 bg-gray-400 rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(template.category)}`}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {template.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getTriggerColor(template.triggerType)}`}>
                      {template.triggerType}
                    </Badge>
                  </div>
                </div>

                {/* Template Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{template.successRate}%</div>
                    <div className="text-xs text-gray-600">Success</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{template.executionCount}</div>
                    <div className="text-xs text-gray-600">Runs</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{template.estimatedDuration}</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                </div>

                {/* Template Steps Preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">Steps ({template.steps.length})</h4>
                  <div className="space-y-1">
                    {template.steps.slice(0, 3).map((step, index) => {
                      const StepIcon = getStepIcon(step.type);
                      return (
                        <div key={step.id} className="flex items-center space-x-2 text-xs">
                          <StepIcon className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600 truncate">
                            {index + 1}. {step.name}
                          </span>
                        </div>
                      );
                    })}
                    {template.steps.length > 3 && (
                      <div className="text-xs text-gray-500 ml-5">
                        +{template.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{template.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <div className="space-y-2">
                            <h4 className="font-medium">Workflow Steps</h4>
                            <div className="space-y-2">
                              {template.steps.map((step, index) => {
                                const StepIcon = getStepIcon(step.type);
                                return (
                                  <div key={step.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                    <StepIcon className="h-4 w-4 text-gray-600" />
                                    <div>
                                      <p className="text-sm font-medium">{index + 1}. {step.name}</p>
                                      <p className="text-xs text-gray-600 capitalize">{step.type.replace('_', ' ')}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>

                  <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                        disabled={!template.isActive || isLoading}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start Workflow: {template.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="leadId">Lead ID (optional)</Label>
                          <Input
                            id="leadId"
                            placeholder="Enter lead ID"
                            value={startContext.leadId}
                            onChange={(e) => setStartContext(prev => ({ ...prev, leadId: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="messageId">Message ID (optional)</Label>
                          <Input
                            id="messageId"
                            placeholder="Enter message ID"
                            value={startContext.messageId}
                            onChange={(e) => setStartContext(prev => ({ ...prev, messageId: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select 
                            value={startContext.priority} 
                            onValueChange={(value) => setStartContext(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setStartDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleStartWorkflow}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Starting...' : 'Start Workflow'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}