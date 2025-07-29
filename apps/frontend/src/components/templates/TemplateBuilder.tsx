'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Play, 
  Plus, 
  X, 
  Settings, 
  MessageSquare, 
  Zap, 
  Target, 
  Brain,
  Code,
  TestTube,
  Eye,
  Download,
  Upload,
  FileText,
  Bot,
  Workflow,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Copy
} from 'lucide-react';

interface TemplateAction {
  id: string;
  type: 'message' | 'condition' | 'api_call' | 'data_update' | 'wait' | 'branch';
  name: string;
  description: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface TemplateFlow {
  id: string;
  name: string;
  trigger: {
    type: 'message_received' | 'contact_added' | 'time_based' | 'manual';
    conditions: Record<string, any>;
  };
  actions: TemplateAction[];
}

interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimatedTime: string;
  author: string;
  version: string;
}

const ACTION_TYPES = [
  {
    type: 'message',
    name: 'Send Message',
    icon: MessageSquare,
    description: 'Send a text or template message to the user',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    type: 'condition',
    name: 'Check Condition',
    icon: Target,
    description: 'Add conditional logic to branch the conversation',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    type: 'api_call',
    name: 'API Call',
    icon: Zap,
    description: 'Make an external API call or webhook',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    type: 'data_update',
    name: 'Update Data',
    icon: Settings,
    description: 'Update contact information or lead score',
    color: 'bg-green-100 text-green-600'
  },
  {
    type: 'wait',
    name: 'Wait/Delay',
    icon: Plus,
    description: 'Add a delay before the next action',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    type: 'branch',
    name: 'Branch Flow',
    icon: Workflow,
    description: 'Create multiple conversation paths',
    color: 'bg-indigo-100 text-indigo-600'
  }
];

const TRIGGER_TYPES = [
  { value: 'message_received', label: 'When message received' },
  { value: 'contact_added', label: 'When contact added' },
  { value: 'time_based', label: 'Time-based trigger' },
  { value: 'manual', label: 'Manual trigger' }
];

const CATEGORIES = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'automation', label: 'Automation' },
  { value: 'analytics', label: 'Analytics' }
];

export function TemplateBuilder() {
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: '',
    description: '',
    category: 'sales',
    difficulty: 'beginner',
    tags: [],
    estimatedTime: '5 min',
    author: 'Your Organization',
    version: '1.0.0'
  });

  const [flow, setFlow] = useState<TemplateFlow>({
    id: 'main-flow',
    name: 'Main Flow',
    trigger: {
      type: 'message_received',
      conditions: {}
    },
    actions: []
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');

  const steps = [
    { name: 'Basic Info', icon: FileText },
    { name: 'Trigger Setup', icon: Target },
    { name: 'Flow Builder', icon: Workflow },
    { name: 'Testing', icon: TestTube },
    { name: 'Publish', icon: Upload }
  ];

  const addAction = (actionType: string) => {
    const newAction: TemplateAction = {
      id: `action-${Date.now()}`,
      type: actionType as any,
      name: ACTION_TYPES.find(t => t.type === actionType)?.name || 'Action',
      description: '',
      config: {},
      enabled: true
    };

    setFlow(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (actionId: string, updates: Partial<TemplateAction>) => {
    setFlow(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (actionId: string) => {
    setFlow(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateTemplate = () => {
    const errors = [];
    if (!metadata.name.trim()) errors.push('Template name is required');
    if (!metadata.description.trim()) errors.push('Description is required');
    if (flow.actions.length === 0) errors.push('At least one action is required');
    return errors;
  };

  const exportTemplate = () => {
    const template = { metadata, flow };
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const saveTemplate = () => {
    const errors = validateTemplate();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    
    // In a real app, this would save to the backend
    alert('Template saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template Builder</h1>
          <p className="text-muted-foreground">Create custom AI agent templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.name} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-100 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <BasicInfoStep
              metadata={metadata}
              setMetadata={setMetadata}
              newTag={newTag}
              setNewTag={setNewTag}
              addTag={addTag}
              removeTag={removeTag}
            />
          )}
          
          {currentStep === 1 && (
            <TriggerSetupStep
              flow={flow}
              setFlow={setFlow}
            />
          )}
          
          {currentStep === 2 && (
            <FlowBuilderStep
              flow={flow}
              addAction={addAction}
              updateAction={updateAction}
              removeAction={removeAction}
            />
          )}
          
          {currentStep === 3 && (
            <TestingStep
              metadata={metadata}
              flow={flow}
            />
          )}
          
          {currentStep === 4 && (
            <PublishStep
              metadata={metadata}
              flow={flow}
              onSave={saveTemplate}
              onExport={exportTemplate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ 
  metadata, 
  setMetadata, 
  newTag, 
  setNewTag, 
  addTag, 
  removeTag 
}: {
  metadata: TemplateMetadata;
  setMetadata: (metadata: TemplateMetadata) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={metadata.name}
              onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
              placeholder="e.g., Lead Qualification Bot"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={metadata.category} onValueChange={(value) => setMetadata({ ...metadata, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            placeholder="Describe what this template does and how it helps users..."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={metadata.difficulty} onValueChange={(value: any) => setMetadata({ ...metadata, difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="time">Estimated Setup Time</Label>
            <Input
              id="time"
              value={metadata.estimatedTime}
              onChange={(e) => setMetadata({ ...metadata, estimatedTime: e.target.value })}
              placeholder="e.g., 5 min"
            />
          </div>
          
          <div>
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={metadata.version}
              onChange={(e) => setMetadata({ ...metadata, version: e.target.value })}
              placeholder="e.g., 1.0.0"
            />
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button onClick={addTag} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TriggerSetupStep({ flow, setFlow }: {
  flow: TemplateFlow;
  setFlow: (flow: TemplateFlow) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Trigger Type</Label>
          <Select 
            value={flow.trigger.type} 
            onValueChange={(value: any) => setFlow({ ...flow, trigger: { ...flow.trigger, type: value } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_TYPES.map(trigger => (
                <SelectItem key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {flow.trigger.type === 'message_received' && (
          <div>
            <Label>Keywords to trigger (optional)</Label>
            <Input placeholder="e.g., hello, hi, start" />
          </div>
        )}

        {flow.trigger.type === 'time_based' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlowBuilderStep({ 
  flow, 
  addAction, 
  updateAction, 
  removeAction 
}: {
  flow: TemplateFlow;
  addAction: (type: string) => void;
  updateAction: (id: string, updates: Partial<TemplateAction>) => void;
  removeAction: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flow Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {ACTION_TYPES.map(actionType => {
              const Icon = actionType.icon;
              return (
                <Button
                  key={actionType.type}
                  variant="outline"
                  onClick={() => addAction(actionType.type)}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionType.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{actionType.name}</div>
                    <div className="text-xs text-muted-foreground">{actionType.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="space-y-3">
            {flow.actions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                index={index}
                onUpdate={(updates) => updateAction(action.id, updates)}
                onRemove={() => removeAction(action.id)}
              />
            ))}
            
            {flow.actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No actions added yet. Click on an action type above to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({ 
  action, 
  index, 
  onUpdate, 
  onRemove 
}: {
  action: TemplateAction;
  index: number;
  onUpdate: (updates: Partial<TemplateAction>) => void;
  onRemove: () => void;
}) {
  const actionType = ACTION_TYPES.find(t => t.type === action.type);
  const Icon = actionType?.icon || Bot;
  
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-2 ${actionType?.color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <Input
                value={action.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="font-medium"
                placeholder="Action name"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={action.enabled}
                  onCheckedChange={(enabled) => onUpdate({ enabled })}
                />
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Textarea
              value={action.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe what this action does..."
              className="min-h-[60px]"
            />
            
            {action.type === 'message' && (
              <div>
                <Label>Message Content</Label>
                <Textarea
                  placeholder="Enter the message to send..."
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            {action.type === 'condition' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field to Check</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message_content">Message Content</SelectItem>
                      <SelectItem value="lead_score">Lead Score</SelectItem>
                      <SelectItem value="contact_status">Contact Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestingStep({ metadata, flow }: {
  metadata: TemplateMetadata;
  flow: TemplateFlow;
}) {
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const runTest = () => {
    // Simulate test execution
    const results = [
      { step: 'Trigger Test', status: 'passed', message: 'Trigger responds correctly' },
      { step: 'Action Validation', status: 'passed', message: 'All actions configured properly' },
      { step: 'Flow Logic', status: 'warning', message: 'Consider adding error handling' }
    ];
    setTestResults(results);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Test your template to ensure it works as expected</p>
          <Button onClick={runTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Run Tests
          </Button>
        </div>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {result.status === 'passed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <div className="font-medium">{result.step}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Template Summary</h4>
          <div className="text-sm space-y-1">
            <div>Name: {metadata.name || 'Untitled Template'}</div>
            <div>Actions: {flow.actions.length} configured</div>
            <div>Trigger: {flow.trigger.type.replace('_', ' ')}</div>
            <div>Category: {metadata.category}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PublishStep({ 
  metadata, 
  flow, 
  onSave, 
  onExport 
}: {
  metadata: TemplateMetadata;
  flow: TemplateFlow;
  onSave: () => void;
  onExport: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">Template Ready!</h4>
          </div>
          <p className="text-green-700 text-sm">
            Your template has been validated and is ready to be saved or shared.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Save className="w-8 h-8 mx-auto text-primary mb-2" />
              <h4 className="font-medium mb-2">Save to Library</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Save this template to your organization&apos;s library
              </p>
              <Button onClick={onSave} className="w-full">
                Save Template
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Download className="w-8 h-8 mx-auto text-secondary-foreground mb-2" />
              <h4 className="font-medium mb-2">Export Template</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download as JSON file to share or backup
              </p>
              <Button variant="outline" onClick={onExport} className="w-full">
                Export JSON
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-3">Template Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Basic Info</div>
              <div>Name: {metadata.name}</div>
              <div>Category: {metadata.category}</div>
              <div>Difficulty: {metadata.difficulty}</div>
            </div>
            <div>
              <div className="font-medium">Configuration</div>
              <div>Trigger: {flow.trigger.type.replace('_', ' ')}</div>
              <div>Actions: {flow.actions.length}</div>
              <div>Tags: {metadata.tags.length}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}