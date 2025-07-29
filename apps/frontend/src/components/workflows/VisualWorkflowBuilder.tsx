'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  Zap, 
  MessageSquare, 
  Clock, 
  Filter,
  Target,
  Users,
  Mail,
  Phone,
  Database,
  GitBranch,
  ArrowRight,
  Circle,
  Square,
  Diamond,
  Hexagon,
  Triangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Workflow node types
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'webhook';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
  };
  inputs: string[];
  outputs: string[];
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
}

interface VisualWorkflowBuilderProps {
  workflow?: WorkflowData;
  onSave?: (workflow: WorkflowData) => void;
  onTest?: (workflow: WorkflowData) => void;
  className?: string;
}

// Node palette items
const NODE_TEMPLATES = {
  trigger: [
    {
      type: 'trigger',
      subtype: 'new_lead',
      label: 'New Lead',
      description: 'Triggers when a new lead is created',
      icon: Users,
      color: 'bg-blue-500',
      config: { source: 'any' }
    },
    {
      type: 'trigger',
      subtype: 'message_received',
      label: 'Message Received',
      description: 'Triggers when a message is received',
      icon: MessageSquare,
      color: 'bg-green-500',
      config: { platform: 'whatsapp' }
    },
    {
      type: 'trigger',
      subtype: 'time_based',
      label: 'Schedule',
      description: 'Triggers at specific times',
      icon: Clock,
      color: 'bg-purple-500',
      config: { schedule: 'daily' }
    }
  ],
  condition: [
    {
      type: 'condition',
      subtype: 'if_then',
      label: 'If/Then',
      description: 'Conditional logic branch',
      icon: GitBranch,
      color: 'bg-orange-500',
      config: { condition: 'equals', value: '' }
    },
    {
      type: 'condition',
      subtype: 'filter',
      label: 'Filter',
      description: 'Filter data based on criteria',
      icon: Filter,
      color: 'bg-yellow-500',
      config: { field: '', operator: 'equals', value: '' }
    }
  ],
  action: [
    {
      type: 'action',
      subtype: 'send_message',
      label: 'Send Message',
      description: 'Send WhatsApp message',
      icon: MessageSquare,
      color: 'bg-blue-600',
      config: { template: '', platform: 'whatsapp' }
    },
    {
      type: 'action',
      subtype: 'update_lead',
      label: 'Update Lead',
      description: 'Update lead information',
      icon: Database,
      color: 'bg-indigo-600',
      config: { field: 'status', value: '' }
    },
    {
      type: 'action',
      subtype: 'create_task',
      label: 'Create Task',
      description: 'Create follow-up task',
      icon: Target,
      color: 'bg-red-600',
      config: { title: '', assignee: '', dueDate: '' }
    }
  ],
  utility: [
    {
      type: 'delay',
      subtype: 'wait',
      label: 'Wait',
      description: 'Add time delay',
      icon: Clock,
      color: 'bg-gray-500',
      config: { duration: 1, unit: 'hours' }
    },
    {
      type: 'webhook',
      subtype: 'http_request',
      label: 'HTTP Request',
      description: 'Make external API call',
      icon: Zap,
      color: 'bg-cyan-600',
      config: { url: '', method: 'POST', headers: {} }
    }
  ]
};

export function VisualWorkflowBuilder({ 
  workflow, 
  onSave, 
  onTest, 
  className 
}: VisualWorkflowBuilderProps) {
  const [workflowData, setWorkflowData] = useState<WorkflowData>(
    workflow || {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      nodes: [],
      connections: [],
      isActive: false
    }
  );

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ nodeType: any; offset: { x: number; y: number } } | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; handle: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle canvas drop
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragging.offset.x;
    const y = event.clientY - rect.top - dragging.offset.y;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: dragging.nodeType.type,
      position: { x, y },
      data: {
        label: dragging.nodeType.label,
        description: dragging.nodeType.description,
        config: { ...dragging.nodeType.config }
      },
      inputs: dragging.nodeType.type === 'trigger' ? [] : ['input'],
      outputs: ['output']
    };

    setWorkflowData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setDragging(null);
  }, [dragging]);

  // Handle node selection
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  // Handle node deletion
  const deleteNode = (nodeId: string) => {
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.source !== nodeId && conn.target !== nodeId
      )
    }));
    setSelectedNode(null);
  };

  // Handle node configuration update
  const updateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      )
    }));
  };

  // Render node palette
  const renderNodePalette = () => (
    <div className="w-80 bg-gray-50 border-r overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold mb-4">Node Palette</h3>
        
        {Object.entries(NODE_TEMPLATES).map(([category, nodes]) => (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </h4>
            <div className="space-y-2">
              {nodes.map((nodeTemplate, index) => {
                const Icon = nodeTemplate.icon;
                return (
                  <div
                    key={`${category}-${index}`}
                    draggable
                    onDragStart={(e) => {
                      setDragging({
                        nodeType: nodeTemplate,
                        offset: { x: 60, y: 20 }
                      });
                    }}
                    className="flex items-center p-3 bg-white rounded border cursor-grab hover:shadow-md transition-shadow"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded flex items-center justify-center mr-3",
                      nodeTemplate.color
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{nodeTemplate.label}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {nodeTemplate.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render workflow canvas
  const renderCanvas = () => (
    <div 
      ref={canvasRef}
      className="flex-1 relative bg-gray-100 overflow-hidden"
      onDrop={handleCanvasDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Nodes */}
      {workflowData.nodes.map((node) => (
        <WorkflowNodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          onClick={() => handleNodeClick(node.id)}
          onDelete={() => deleteNode(node.id)}
          onConfigChange={(config) => updateNodeConfig(node.id, config)}
        />
      ))}

      {/* Connections */}
      <svg className="absolute inset-0 pointer-events-none">
        {workflowData.connections.map((connection) => {
          const sourceNode = workflowData.nodes.find(n => n.id === connection.source);
          const targetNode = workflowData.nodes.find(n => n.id === connection.target);
          
          if (!sourceNode || !targetNode) return null;

          const startX = sourceNode.position.x + 120;
          const startY = sourceNode.position.y + 40;
          const endX = targetNode.position.x;
          const endY = targetNode.position.y + 40;

          return (
            <line
              key={connection.id}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#6366f1"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6366f1"
            />
          </marker>
        </defs>
      </svg>

      {/* Empty state */}
      {workflowData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
            <p className="text-sm">
              Drag nodes from the palette to create your automation workflow
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Render properties panel
  const renderPropertiesPanel = () => {
    const selectedNodeData = workflowData.nodes.find(n => n.id === selectedNode);
    
    return (
      <div className="w-80 bg-white border-l overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Properties</h3>
          
          {selectedNodeData ? (
            <NodePropertiesEditor
              node={selectedNodeData}
              onChange={(config) => updateNodeConfig(selectedNodeData.id, config)}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a node to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Input
            value={workflowData.name}
            onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
            className="font-semibold"
            placeholder="Workflow Name"
          />
          <Badge variant={workflowData.isActive ? "default" : "secondary"}>
            {workflowData.isActive ? "Active" : "Draft"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onTest?.(workflowData)}
          >
            <Play className="w-4 h-4 mr-2" />
            Test
          </Button>
          <Button 
            size="sm"
            onClick={() => onSave?.(workflowData)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {renderNodePalette()}
        {renderCanvas()}
        {renderPropertiesPanel()}
      </div>
    </div>
  );
}

// Individual workflow node component
interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onConfigChange: (config: Record<string, any>) => void;
}

function WorkflowNodeComponent({ 
  node, 
  isSelected, 
  onClick, 
  onDelete, 
  onConfigChange 
}: WorkflowNodeComponentProps) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return Target;
      case 'condition': return GitBranch;
      case 'action': return Zap;
      case 'delay': return Clock;
      case 'webhook': return Database;
      default: return Circle;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'border-blue-500 bg-blue-50';
      case 'condition': return 'border-orange-500 bg-orange-50';
      case 'action': return 'border-green-500 bg-green-50';
      case 'delay': return 'border-gray-500 bg-gray-50';
      case 'webhook': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const Icon = getNodeIcon(node.type);

  return (
    <div
      className={cn(
        "absolute w-40 p-3 rounded-lg border-2 cursor-pointer transition-all",
        getNodeColor(node.type),
        isSelected ? "ring-2 ring-indigo-500 shadow-lg" : "shadow-sm hover:shadow-md"
      )}
      style={{
        left: node.position.x,
        top: node.position.y
      }}
      onClick={onClick}
    >
      {/* Input connection point */}
      {node.inputs.length > 0 && (
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full" />
      )}
      
      {/* Output connection point */}
      {node.outputs.length > 0 && (
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full" />
      )}

      <div className="flex items-center space-x-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm truncate">{node.data.label}</span>
      </div>
      
      {node.data.description && (
        <p className="text-xs text-gray-600 truncate">{node.data.description}</p>
      )}

      {/* Delete button (only show when selected) */}
      {isSelected && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute -top-2 -right-2 w-6 h-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// Node properties editor
interface NodePropertiesEditorProps {
  node: WorkflowNode;
  onChange: (config: Record<string, any>) => void;
}

function NodePropertiesEditor({ node, onChange }: NodePropertiesEditorProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ [key]: value });
  };

  const renderConfigField = (key: string, value: any, label: string, type: string = 'text') => {
    switch (type) {
      case 'select':
        return (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={value}
              onValueChange={(newValue) => updateConfig(key, newValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Textarea
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          </div>
        );
      
      default:
        return (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type={type}
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">{node.data.label}</h4>
        <p className="text-sm text-gray-600">{node.data.description}</p>
      </div>

      <div className="space-y-4">
        {Object.entries(node.data.config).map(([key, value]) => {
          // Customize field rendering based on node type and key
          if (key === 'template') {
            return renderConfigField(key, value, 'Message Template', 'textarea');
          }
          if (key === 'schedule') {
            return renderConfigField(key, value, 'Schedule', 'select');
          }
          if (key === 'duration') {
            return renderConfigField(key, value, 'Duration', 'number');
          }
          
          return renderConfigField(key, value, key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        })}
      </div>
    </div>
  );
}