'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  ArrowRight,
  Keyboard,
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
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Move,
  RotateCcw
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
  
  // New viewport state for zoom and pan
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [dragConnection, setDragConnection] = useState<{ x: number; y: number } | null>(null);

  // Viewport control functions
  const zoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  }, []);

  const resetViewport = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, []);

  const fitToScreen = useCallback(() => {
    if (workflow.nodes.length === 0) {
      resetViewport();
      return;
    }

    const nodes = workflow.nodes;
    const bounds = {
      minX: Math.min(...nodes.map(n => n.position.x)),
      maxX: Math.max(...nodes.map(n => n.position.x + 192)), // node width
      minY: Math.min(...nodes.map(n => n.position.y)),
      maxY: Math.max(...nodes.map(n => n.position.y + 80)) // node height
    };

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;

    const scaleX = (canvasSize.width * 0.8) / width;
    const scaleY = (canvasSize.height * 0.8) / height;
    const scale = Math.min(scaleX, scaleY, 1);

    setViewport({
      x: (canvasSize.width / 2) - (centerX * scale),
      y: (canvasSize.height / 2) - (centerY * scale),
      zoom: scale
    });
  }, [workflow.nodes, canvasSize]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Canvas size observer
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (connectionMode && sourceNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragConnection({
        x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        y: (e.clientY - rect.top - viewport.y) / viewport.zoom
      });
    }
  }, [isPanning, lastPanPoint, connectionMode, sourceNode, viewport]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add global mouse event listeners for panning and connections
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDragConnection(null);
      if (connectionMode) {
        setConnectionMode(false);
        setSourceNode(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (connectionMode && sourceNode && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDragConnection({
          x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
          y: (e.clientY - rect.top - viewport.y) / viewport.zoom
        });
      }
    };

    if (isPanning || connectionMode) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      if (connectionMode) {
        document.addEventListener('mousemove', handleGlobalMouseMove);
      }
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isPanning, connectionMode, sourceNode, viewport]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewport(prev => {
        const newZoom = Math.min(Math.max(prev.zoom * delta, 0.1), 3);
        const zoomRatio = newZoom / prev.zoom;
        
        return {
          x: mouseX - (mouseX - prev.x) * zoomRatio,
          y: mouseY - (mouseY - prev.y) * zoomRatio,
          zoom: newZoom
        };
      });
    }
  }, []);

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
    // Check if connection already exists
    const existingEdge = workflow.edges.find(
      edge => edge.source === sourceId && edge.target === targetId
    );
    
    if (existingEdge || sourceId === targetId) {
      return; // Don't create duplicate connections or self-connections
    }

    const newEdge: WorkflowEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: sourceId,
      target: targetId
    };

    setWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
  }, [workflow.edges]);

  const handleConnectionStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionMode(true);
    setSourceNode(nodeId);
    
    // Initialize drag connection at the source node's output position
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const sourceNodeObj = workflow.nodes.find(n => n.id === nodeId);
      if (sourceNodeObj) {
        setDragConnection({
          x: (sourceNodeObj.position.x + 192), // Start at node's right edge
          y: (sourceNodeObj.position.y + 40)   // Center vertically
        });
      }
    }
  }, [workflow.nodes]);

  const handleConnectionEnd = useCallback((targetNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionMode && sourceNode && sourceNode !== targetNodeId) {
      connectNodes(sourceNode, targetNodeId);
    }
    setConnectionMode(false);
    setSourceNode(null);
    setDragConnection(null);
  }, [connectionMode, sourceNode, connectNodes]);

  const deleteEdge = useCallback((edgeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));
  }, []);

  // Keyboard shortcuts for delete and escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete: Delete or Backspace (when node is selected)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !connectionMode) {
        e.preventDefault();
        deleteNode(selectedNode.id);
        setSelectedNode(null);
      }
      // Escape: Cancel connection mode or deselect node
      else if (e.key === 'Escape') {
        if (connectionMode) {
          setConnectionMode(false);
          setSourceNode(null);
          setDragConnection(null);
        } else if (selectedNode) {
          setSelectedNode(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, connectionMode, deleteNode]);

  // Delete selected nodes function
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    }
  }, [selectedNode, deleteNode]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom
    };

    addNode(draggedNodeType, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, viewport, addNode]);

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
            
            {/* Delete Selected Node */}
            {selectedNode && (
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelectedNode}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete Selected Node (Delete/Backspace)"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Node
              </Button>
            )}
            
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
        <div className={cn(
          "flex-1 relative bg-grid-pattern overflow-hidden",
          isFullscreen && "fixed inset-0 z-50 bg-background"
        )}>
          {/* Viewport Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="bg-card border rounded-lg p-1 shadow-sm">
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={zoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={zoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={fitToScreen}
                  title="Fit to Screen"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={resetViewport}
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-1 shadow-sm">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Connection Mode Indicator */}
          {connectionMode && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm font-medium text-blue-800">
                🔗 Connection Mode Active
                <div className="text-xs text-blue-600 mt-1">
                  Click on a target node to connect • Press Escape to cancel
                </div>
              </div>
            </div>
          )}
          
          {/* Selected Node Indicator */}
          {selectedNode && !connectionMode && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-sm font-medium text-green-800">
                📋 {selectedNode.name} Selected
                <div className="text-xs text-green-600 mt-1">
                  Press Delete/Backspace to remove • Double-click to configure
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-card border rounded-lg p-2 text-xs text-muted-foreground max-w-xs">
              <div className="font-medium mb-1 flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                Shortcuts
              </div>
              <div className="space-y-0.5">
                <div><kbd className="bg-muted px-1 rounded text-xs">Del</kbd> Delete selected</div>
                <div><kbd className="bg-muted px-1 rounded text-xs">Esc</kbd> Cancel/Deselect</div>
                <div><kbd className="bg-muted px-1 rounded text-xs">Ctrl+Scroll</kbd> Zoom</div>
                <div><kbd className="bg-muted px-1 rounded text-xs">Alt+Drag</kbd> Pan</div>
              </div>
            </div>
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-card border rounded px-2 py-1 text-sm font-mono">
              {Math.round(viewport.zoom * 100)}%
            </div>
          </div>

          <div
            ref={canvasRef}
            className="w-full h-full overflow-hidden cursor-grab"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div 
              className="absolute inset-0"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: '0 0',
                width: '2000px',
                height: '2000px',
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)
                `,
                backgroundSize: '20px 20px',
              }}
            >
              {/* Nodes */}
              {workflow.nodes.map(node => {
                const Icon = getNodeIcon(node);
                return (
                  <motion.div
                    key={node.id}
                    className={cn(
                      "absolute w-48 p-3 rounded-lg border-2 cursor-pointer shadow-sm group",
                      getNodeColor(node),
                      getStatusColor(node.status),
                      selectedNode?.id === node.id && "ring-2 ring-primary",
                      connectionMode && sourceNode === node.id && "ring-2 ring-blue-400"
                    )}
                    style={{
                      left: node.position.x,
                      top: node.position.y
                    }}
                    onClick={(e) => {
                      if (connectionMode && sourceNode) {
                        handleConnectionEnd(node.id, e);
                      } else {
                        setSelectedNode(node);
                      }
                    }}
                    onDoubleClick={() => !connectionMode && setIsConfigOpen(true)}
                    drag={!connectionMode}
                    dragMomentum={false}
                    onDrag={(_, info) => {
                      if (!connectionMode) {
                        updateNode(node.id, {
                          position: {
                            x: node.position.x + info.delta.x / viewport.zoom,
                            y: node.position.y + info.delta.y / viewport.zoom
                          }
                        });
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent canvas panning when dragging nodes
                    whileHover={{ scale: connectionMode ? 1.0 : 1.02 }}
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
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            connectionMode && "opacity-100"
                          )}
                          onClick={(e) => {
                            if (!connectionMode) {
                              handleConnectionStart(node.id, e);
                            }
                          }}
                          title="Connect to another node"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          title="Delete node"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Connection Handles */}
                    {node.inputs && node.inputs.length > 0 && (
                      <div 
                        className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Input connection point"
                        onClick={(e) => connectionMode && handleConnectionEnd(node.id, e)}
                      />
                    )}
                    
                    {node.outputs && node.outputs.length > 0 && (
                      <div 
                        className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Output connection point"
                        onClick={(e) => handleConnectionStart(node.id, e)}
                      />
                    )}
                  </motion.div>
                );
              })}

              {/* Edges */}
              <svg className="absolute inset-0" style={{ zIndex: 1 }}>
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
                      fill="#64748b"
                    />
                  </marker>
                </defs>
                
                {/* Existing Edges */}
                {workflow.edges.map(edge => {
                  const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                  const targetNode = workflow.nodes.find(n => n.id === edge.target);
                  
                  if (!sourceNode || !targetNode) return null;
                  
                  const startX = sourceNode.position.x + 192; // Node width
                  const startY = sourceNode.position.y + 40;  // Node height / 2
                  const endX = targetNode.position.x;
                  const endY = targetNode.position.y + 40;
                  
                  // Create a curved path
                  const controlPointX = startX + Math.abs(endX - startX) / 2;
                  const pathData = `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
                  
                  return (
                    <g key={edge.id}>
                      <path
                        d={pathData}
                        stroke="#64748b"
                        strokeWidth="3"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="cursor-pointer hover:stroke-red-500 transition-colors"
                        onClick={() => deleteEdge(edge.id)}
                      />
                      {/* Invisible wider path for easier clicking */}
                      <path
                        d={pathData}
                        stroke="transparent"
                        strokeWidth="12"
                        fill="none"
                        className="cursor-pointer"
                        onClick={() => deleteEdge(edge.id)}
                      />
                    </g>
                  );
                })}
                
                {/* Drag Connection Line */}
                {connectionMode && sourceNode && dragConnection && (() => {
                  const srcNode = workflow.nodes.find(n => n.id === sourceNode);
                  if (!srcNode) return null;
                  
                  const startX = srcNode.position.x + 192;
                  const startY = srcNode.position.y + 40;
                  const endX = dragConnection.x;
                  const endY = dragConnection.y;
                  
                  const controlPointX = startX + Math.abs(endX - startX) / 2;
                  const pathData = `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
                  
                  return (
                    <g>
                      <defs>
                        <marker
                          id="drag-arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="#3b82f6"
                          />
                        </marker>
                        <style>
                          {`
                            @keyframes dash {
                              to {
                                stroke-dashoffset: -12;
                              }
                            }
                          `}
                        </style>
                      </defs>
                      <path
                        d={pathData}
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        fill="none"
                        markerEnd="url(#drag-arrowhead)"
                        className="animate-pulse"
                        style={{
                          animation: 'dash 1s linear infinite'
                        }}
                      />
                    </g>
                  );
                })()}
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
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline">
                        Supports both n8n and LangGraph
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-2">
                        <p>💡 Tips:</p>
                        <p>• Use Ctrl/Cmd + scroll to zoom</p>
                        <p>• Alt + drag or middle mouse to pan</p>
                        <p>• Use zoom controls on the right</p>
                        <p>• Hover over nodes to see connection handles</p>
                        <p>• Click → button or green handle to connect nodes</p>
                        <p>• Click on connections to delete them</p>
                        <p>• Press Delete key to remove selected nodes</p>
                        <p>• Press Escape to cancel actions</p>
                      </div>
                    </div>
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