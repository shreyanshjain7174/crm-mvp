'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  ArrowRight,
  Bot,
  Workflow,
  Zap,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Layers,
  MessageSquare,
  Mail,
  Database,
  Code,
  Brain,
  Users,
  Target,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai' | 'transform' | 'integration';
  engine: 'n8n' | 'langgraph' | 'hybrid';
  name: string;
  description?: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status?: 'idle' | 'running' | 'completed' | 'error';
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface WorkflowDefinition {
  id?: string;
  name: string;
  description: string;
  type: 'n8n' | 'langgraph' | 'hybrid';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffType: 'fixed' | 'exponential';
      delay: number;
    };
    errorHandling: 'continue' | 'stop' | 'retry';
  };
}

const NODE_TYPES = {
  trigger: {
    n8n: [
      { type: 'webhook', name: 'Webhook', icon: Zap, description: 'HTTP webhook trigger' },
      { type: 'schedule', name: 'Schedule', icon: Clock, description: 'Time-based trigger' },
      { type: 'manual', name: 'Manual', icon: Play, description: 'Manual execution' }
    ],
    langgraph: [
      { type: 'chat', name: 'Chat Message', icon: MessageSquare, description: 'Chat-based trigger' },
      { type: 'event', name: 'Event', icon: Activity, description: 'System event trigger' }
    ]
  },
  action: {
    n8n: [
      { type: 'email', name: 'Send Email', icon: Mail, description: 'Send email notification' },
      { type: 'http', name: 'HTTP Request', icon: Workflow, description: 'Make HTTP request' },
      { type: 'database', name: 'Database', icon: Database, description: 'Database operation' }
    ],
    langgraph: [
      { type: 'llm', name: 'LLM Call', icon: Brain, description: 'Large Language Model' },
      { type: 'tool', name: 'Tool', icon: Code, description: 'Function/tool execution' }
    ]
  },
  condition: {
    n8n: [
      { type: 'if', name: 'If/Else', icon: GitBranch, description: 'Conditional branching' },
      { type: 'filter', name: 'Filter', icon: Filter, description: 'Data filtering' }
    ],
    langgraph: [
      { type: 'router', name: 'Router', icon: Target, description: 'AI-powered routing' },
      { type: 'classifier', name: 'Classifier', icon: Layers, description: 'Content classification' }
    ]
  }
};

export function HybridWorkflowBuilder() {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    name: 'New Workflow',
    description: '',
    type: 'hybrid',
    nodes: [],
    edges: [],
    settings: {
      timeout: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffType: 'exponential',
        delay: 1000
      },
      errorHandling: 'stop'
    }
  });

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const addNode = useCallback((nodeType: any, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType.category,
      engine: nodeType.engine,
      name: nodeType.name,
      description: nodeType.description,
      position,
      config: {},
      inputs: nodeType.category === 'trigger' ? [] : ['input'],
      outputs: ['output'],
      status: 'idle'
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    }));
  }, []);

  const connectNodes = useCallback((sourceId: string, targetId: string) => {
    const newEdge: WorkflowEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: sourceId,
      target: targetId
    };

    setWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - canvasOffset.x,
      y: e.clientY - rect.top - canvasOffset.y
    };

    addNode(draggedNodeType, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, canvasOffset, addNode]);

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(['Starting workflow execution...']);

    try {
      // Simulate workflow execution
      for (let i = 0; i < workflow.nodes.length; i++) {
        const node = workflow.nodes[i];
        
        // Update node status
        updateNode(node.id, { status: 'running' });
        setExecutionLogs(prev => [...prev, `Executing ${node.name}...`]);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Update node status
        updateNode(node.id, { status: 'completed' });
        setExecutionLogs(prev => [...prev, `${node.name} completed successfully`]);
      }

      setExecutionLogs(prev => [...prev, 'Workflow execution completed!']);
    } catch (error) {
      setExecutionLogs(prev => [...prev, `Execution failed: ${error}`]);
    } finally {
      setIsExecuting(false);
      // Reset node statuses after a delay
      setTimeout(() => {
        workflow.nodes.forEach(node => {
          updateNode(node.id, { status: 'idle' });
        });
      }, 3000);
    }
  };

  const saveWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workflow,
          triggers: workflow.nodes.filter(n => n.type === 'trigger'),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWorkflow(prev => ({ ...prev, id: result.workflow.id }));
        alert('Workflow saved successfully!');
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      alert('Failed to save workflow: ' + error);
    }
  };

  const getNodeIcon = (node: WorkflowNode) => {
    switch (node.type) {
      case 'trigger': return Clock;
      case 'action': return node.engine === 'langgraph' ? Brain : Workflow;
      case 'condition': return GitBranch;
      case 'ai': return Brain;
      case 'transform': return Code;
      case 'integration': return Layers;
      default: return Activity;
    }
  };

  const getNodeColor = (node: WorkflowNode) => {
    switch (node.engine) {
      case 'n8n': return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'langgraph': return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'hybrid': return 'bg-gradient-to-r from-blue-100 to-purple-100 border-indigo-300 text-indigo-900';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'border-yellow-400 bg-yellow-50';
      case 'completed': return 'border-green-400 bg-green-50';
      case 'error': return 'border-red-400 bg-red-50';
      default: return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              value={workflow.name}
              onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus:ring-0"
              placeholder="Workflow Name"
            />
            <Badge variant="outline" className="capitalize">
              {workflow.type}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={executeWorkflow}
              disabled={isExecuting || workflow.nodes.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Running...' : 'Test Run'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveWorkflow}
              disabled={isExecuting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Workflow Settings</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Workflow Type</Label>
                    <Select
                      value={workflow.type}
                      onValueChange={(value: 'n8n' | 'langgraph' | 'hybrid') =>
                        setWorkflow(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="n8n">n8n (Business Logic)</SelectItem>
                        <SelectItem value="langgraph">LangGraph (AI Workflows)</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Best of Both)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={workflow.description}
                      onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this workflow does..."
                    />
                  </div>
                  
                  <div>
                    <Label>Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={workflow.settings.timeout / 1000}
                      onChange={(e) => setWorkflow(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          timeout: parseInt(e.target.value) * 1000
                        }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Error Handling</Label>
                    <Select
                      value={workflow.settings.errorHandling}
                      onValueChange={(value: 'continue' | 'stop' | 'retry') =>
                        setWorkflow(prev => ({
                          ...prev,
                          settings: { ...prev.settings, errorHandling: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stop">Stop on Error</SelectItem>
                        <SelectItem value="continue">Continue on Error</SelectItem>
                        <SelectItem value="retry">Retry on Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Components</h3>
          
          <Tabs defaultValue="triggers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="triggers" className="text-xs">Triggers</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
              <TabsTrigger value="logic" className="text-xs">Logic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="triggers" className="space-y-2 mt-4">
              {Object.entries(NODE_TYPES.trigger).map(([engine, nodes]) => (
                <div key={engine} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize text-muted-foreground">{engine}</h4>
                  {nodes.map(node => (
                    <motion.div
                      key={`${engine}-${node.type}`}
                      draggable
                      onDragStart={() => setDraggedNodeType({ ...node, engine, category: 'trigger' })}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-move border-2 border-dashed border-transparent hover:border-primary transition-colors",
                        engine === 'n8n' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-purple-50 hover:bg-purple-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <node.icon className="w-4 h-4" />
                      <div>
                        <div className="text-sm font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-2 mt-4">
              {Object.entries(NODE_TYPES.action).map(([engine, nodes]) => (
                <div key={engine} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize text-muted-foreground">{engine}</h4>
                  {nodes.map(node => (
                    <motion.div
                      key={`${engine}-${node.type}`}
                      draggable
                      onDragStart={() => setDraggedNodeType({ ...node, engine, category: 'action' })}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-move border-2 border-dashed border-transparent hover:border-primary transition-colors",
                        engine === 'n8n' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-purple-50 hover:bg-purple-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <node.icon className="w-4 h-4" />
                      <div>
                        <div className="text-sm font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="logic" className="space-y-2 mt-4">
              {Object.entries(NODE_TYPES.condition).map(([engine, nodes]) => (
                <div key={engine} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize text-muted-foreground">{engine}</h4>
                  {nodes.map(node => (
                    <motion.div
                      key={`${engine}-${node.type}`}
                      draggable
                      onDragStart={() => setDraggedNodeType({ ...node, engine, category: 'condition' })}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-move border-2 border-dashed border-transparent hover:border-primary transition-colors",
                        engine === 'n8n' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-purple-50 hover:bg-purple-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <node.icon className="w-4 h-4" />
                      <div>
                        <div className="text-sm font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-grid-pattern">
          <div
            ref={canvasRef}
            className="w-full h-full overflow-auto"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="min-w-[2000px] min-h-[2000px] relative">
              {/* Nodes */}
              {workflow.nodes.map(node => {
                const Icon = getNodeIcon(node);
                return (
                  <motion.div
                    key={node.id}
                    className={cn(
                      "absolute w-48 p-3 rounded-lg border-2 cursor-pointer shadow-sm",
                      getNodeColor(node),
                      getStatusColor(node.status),
                      selectedNode?.id === node.id && "ring-2 ring-primary"
                    )}
                    style={{
                      left: node.position.x,
                      top: node.position.y
                    }}
                    onClick={() => setSelectedNode(node)}
                    onDoubleClick={() => setIsConfigOpen(true)}
                    drag
                    dragMomentum={false}
                    onDrag={(_, info) => {
                      updateNode(node.id, {
                        position: {
                          x: node.position.x + info.delta.x,
                          y: node.position.y + info.delta.y
                        }
                      });
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileDrag={{ scale: 1.05 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{node.name}</span>
                      {node.status === 'running' && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                      {node.status === 'completed' && (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      )}
                      {node.status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {node.description || `${node.engine} ${node.type}`}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {node.engine}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Edges */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {workflow.edges.map(edge => {
                  const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                  const targetNode = workflow.nodes.find(n => n.id === edge.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  const startX = sourceNode.position.x + 192; // Node width
                  const startY = sourceNode.position.y + 40;  // Node height / 2
                  const endX = targetNode.position.x;
                  const endY = targetNode.position.y + 40;
                  
                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${startX} ${startY} Q ${startX + 50} ${startY} ${startX + 50} ${(startY + endY) / 2} Q ${startX + 50} ${endY} ${endX} ${endY}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-muted-foreground"
                        markerEnd="url(#arrowhead)"
                      />
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="currentColor"
                            className="text-muted-foreground"
                          />
                        </marker>
                      </defs>
                    </g>
                  );
                })}
              </svg>

              {/* Empty State */}
              {workflow.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Building Your Workflow</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag components from the left panel to begin
                    </p>
                    <Badge variant="outline">
                      Supports both n8n and LangGraph
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Execution Logs */}
        {(isExecuting || executionLogs.length > 0) && (
          <div className="w-80 border-l border-border bg-card p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Execution Logs
            </h3>
            
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {executionLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm p-2 bg-muted rounded"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedNode?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNode && (
            <div className="space-y-4">
              <div>
                <Label>Node Name</Label>
                <Input
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedNode.description || ''}
                  onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                  placeholder="Describe what this node does..."
                />
              </div>
              
              <div>
                <Label>Engine</Label>
                <Select
                  value={selectedNode.engine}
                  onValueChange={(value: 'n8n' | 'langgraph') =>
                    updateNode(selectedNode.id, { engine: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n8n">n8n (Business Logic)</SelectItem>
                    <SelectItem value="langgraph">LangGraph (AI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Configuration specific to node type and engine */}
              {selectedNode.engine === 'langgraph' && selectedNode.type === 'action' && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">AI Configuration</h4>
                  
                  <div>
                    <Label>Model</Label>
                    <Select defaultValue="gpt-4">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>System Prompt</Label>
                    <Textarea
                      placeholder="You are a helpful AI assistant..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Temperature</Label>
                    <Input type="number" min="0" max="2" step="0.1" defaultValue="0.7" />
                  </div>
                </div>
              )}
              
              {selectedNode.engine === 'n8n' && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium">n8n Configuration</h4>
                  
                  {selectedNode.type === 'action' && (
                    <div>
                      <Label>HTTP Method</Label>
                      <Select defaultValue="POST">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}