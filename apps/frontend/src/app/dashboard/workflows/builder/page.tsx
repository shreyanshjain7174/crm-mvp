'use client';

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  Controls,
  MiniMap,
  Background,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Play,
  Square,
  ArrowLeft,
  Settings,
  Plus,
  Zap,
  MessageSquare,
  Clock,
  Target,
  CheckCircle,
  Filter,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// Custom Node Components
const TriggerNode = ({ data, id }: { data: any; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-blue-50 border-2 border-blue-200 min-w-[150px] group relative">
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-blue-600 border-2 border-white hover:bg-blue-700 transition-colors"
        style={{ right: '-8px' }}
      />
      
      <button
        onClick={deleteNode}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-blue-600" />
        <div className="font-bold text-sm text-blue-900">Trigger</div>
      </div>
      <div className="text-xs text-blue-700">{data.label}</div>
    </div>
  );
};

const ActionNode = ({ data, id }: { data: any; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-green-50 border-2 border-green-200 min-w-[150px] group relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-green-600 border-2 border-white hover:bg-green-700 transition-colors"
        style={{ left: '-8px' }}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-green-600 border-2 border-white hover:bg-green-700 transition-colors"
        style={{ right: '-8px' }}
      />
      
      <button
        onClick={deleteNode}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <div className="font-bold text-sm text-green-900">Action</div>
      </div>
      <div className="text-xs text-green-700">{data.label}</div>
    </div>
  );
};

const ConditionNode = ({ data, id }: { data: any; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-purple-50 border-2 border-purple-200 min-w-[150px] group relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-purple-600 border-2 border-white hover:bg-purple-700 transition-colors"
        style={{ left: '-8px' }}
      />
      
      {/* Output Handles for Yes/No branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="w-4 h-4 bg-green-500 border-2 border-white hover:bg-green-600 transition-colors"
        style={{ left: '30%', bottom: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-4 h-4 bg-red-500 border-2 border-white hover:bg-red-600 transition-colors"
        style={{ left: '70%', bottom: '-8px' }}
      />
      
      <button
        onClick={deleteNode}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-purple-600" />
        <div className="font-bold text-sm text-purple-900">Condition</div>
      </div>
      <div className="text-xs text-purple-700">{data.label}</div>
      <div className="flex justify-between mt-2 text-xs text-purple-600">
        <span>Yes</span>
        <span>No</span>
      </div>
    </div>
  );
};

const DelayNode = ({ data, id }: { data: any; id: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  
  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-orange-50 border-2 border-orange-200 min-w-[150px] group relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-orange-600 border-2 border-white hover:bg-orange-700 transition-colors"
        style={{ left: '-8px' }}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-orange-600 border-2 border-white hover:bg-orange-700 transition-colors"
        style={{ right: '-8px' }}
      />
      
      <button
        onClick={deleteNode}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-orange-600" />
        <div className="font-bold text-sm text-orange-900">Delay</div>
      </div>
      <div className="text-xs text-orange-700">{data.label}</div>
    </div>
  );
};

// Node Types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#6366f1',
  },
  style: {
    stroke: '#6366f1',
    strokeWidth: 2,
  },
};

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 25 },
    data: { label: 'Contact Added' },
  },
];

const initialEdges: Edge[] = [];

// Component Palette
const ComponentPalette = () => {
  const nodeTemplates = [
    { type: 'trigger', label: 'New Contact', icon: Zap, color: 'text-blue-600' },
    { type: 'trigger', label: 'Message Received', icon: MessageSquare, color: 'text-blue-600' },
    { type: 'action', label: 'Send Message', icon: MessageSquare, color: 'text-green-600' },
    { type: 'action', label: 'Update Status', icon: Target, color: 'text-green-600' },
    { type: 'condition', label: 'If/Then', icon: Filter, color: 'text-purple-600' },
    { type: 'delay', label: 'Wait', icon: Clock, color: 'text-orange-600' },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="w-64 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeTemplates.map((template, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
            draggable
            onDragStart={(event) => onDragStart(event, template.type, template.label)}
          >
            <template.icon className={`h-4 w-4 ${template.color}`} />
            <span className="text-sm font-medium">{template.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

function WorkflowBuilderContent() {
  const router = useRouter();
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      // Determine edge color based on source handle
      let edgeColor = '#6366f1'; // Default purple
      
      if (params.sourceHandle === 'yes') {
        edgeColor = '#10b981'; // Green for Yes
      } else if (params.sourceHandle === 'no') {
        edgeColor = '#ef4444'; // Red for No
      }
      
      // Add styled edge with arrow marker
      const newEdge = {
        ...params,
        id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(newEdge as Edge, eds));
    },
    [setEdges]
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    // Ensure we have a valid connection object
    if (!connection.source || !connection.target) {
      return false;
    }
    
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }
    
    // Add more validation rules here as needed
    return true;
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Get the canvas element bounds
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      
      // Calculate the position relative to the ReactFlow canvas
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode: Node = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const handleSave = async () => {
    try {
      console.log('Saving workflow:', { nodes, edges, name: workflowName });
      
      const result = await apiClient.saveWorkflowFromBuilder({
        name: workflowName,
        description: `Visual workflow created with ${nodes.length} nodes`,
        nodes: nodes,
        edges: edges
      });

      console.log('Workflow saved successfully:', result);
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(`Error saving workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRun = async () => {
    if (isRunning) {
      setIsRunning(false);
      console.log('Stopping workflow');
      return;
    }

    try {
      setIsRunning(true);
      console.log('Running workflow test');
      
      // First save the workflow
      await handleSave();
      
      // Then trigger a test execution
      const result = await apiClient.triggerWorkflowEvent('manual', {
        data: {
          testExecution: true,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          timestamp: new Date().toISOString()
        },
        source: 'workflow-builder'
      });

      console.log('Workflow test triggered:', result);
      alert('Workflow test execution started!');
      
      // Stop running after a brief delay
      setTimeout(() => {
        setIsRunning(false);
      }, 3000);
    } catch (error) {
      console.error('Error running workflow:', error);
      alert('Error running workflow. Please try again.');
      setIsRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{workflowName}</h1>
            <p className="text-sm text-gray-500">Visual Workflow Builder</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isRunning ? "destructive" : "secondary"}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
            <Settings className="h-4 w-4 mr-2" />
            {showHelp ? 'Hide Help' : 'Show Help'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button 
            size="sm" 
            onClick={handleRun}
            className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Component Palette */}
        <div className="w-64 p-4 bg-white border-r">
          <ComponentPalette />
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={'smoothstep' as any}
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            attributionPosition="bottom-right"
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Panel position="top-left">
              {showHelp && (
                <div className="bg-white p-3 rounded-lg shadow-md border max-w-sm relative">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <h4 className="font-semibold text-sm mb-2">How to build workflows:</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Drag components from the left panel to add nodes</li>
                    <li>• Click and drag from the colored dots (handles) to connect nodes</li>
                    <li>• Hover over a handle to see it enlarge for easier connection</li>
                    <li>• Hover over nodes to see the delete button (×)</li>
                    <li>• Condition nodes have green (Yes) and red (No) outputs</li>
                    <li>• Connections are animated to show data flow</li>
                  </ul>
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}