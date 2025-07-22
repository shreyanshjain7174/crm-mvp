'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  Clock,
  Link,
  ExternalLink
} from 'lucide-react';
import { WorkflowNode, WORKFLOW_NODE_DEFINITIONS } from '@/types/workflow-types';
import { cn } from '@/lib/utils';

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  isSelected: boolean;
  isDragging: boolean;
  isReadOnly?: boolean;
  onSelect: () => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onUpdate: (updates: Partial<WorkflowNode['data']>) => void;
  onDelete: () => void;
}

export function WorkflowNodeComponent({
  node,
  isSelected,
  isDragging,
  isReadOnly = false,
  onSelect,
  onConnect,
  onUpdate,
  onDelete
}: WorkflowNodeComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const definition = WORKFLOW_NODE_DEFINITIONS[node.type];
  const IconComponent = definition.icon;

  const handleNameChange = useCallback((newName: string) => {
    onUpdate({ name: newName });
    setIsEditing(false);
  }, [onUpdate]);

  const handleConfigChange = useCallback((key: string, value: any) => {
    onUpdate({
      config: {
        ...node.data.config,
        [key]: value
      }
    });
  }, [node.data.config, onUpdate]);

  const getStatusColor = () => {
    switch (node.data.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      case 'waiting':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (node.data.status) {
      case 'running':
        return <Play className="w-3 h-3 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      case 'waiting':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        'min-w-[200px] max-w-[280px] cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:scale-105',
        isSelected && 'ring-2 ring-blue-500 shadow-lg',
        isDragging && 'opacity-75 rotate-3 scale-110',
        getStatusColor()
      )}
      onClick={onSelect}
    >
      {/* Connection Points */}
      {!isReadOnly && (
        <>
          {/* Input Connection Point */}
          {node.type !== 'trigger' && (
            <div 
              className="absolute -left-2 top-6 w-4 h-4 bg-gray-300 rounded-full border-2 border-white cursor-crosshair hover:bg-blue-500 transition-colors"
              title="Input connection"
            />
          )}
          
          {/* Output Connection Point */}
          {node.type !== 'end' && (
            <div 
              className={cn(
                "absolute -right-2 top-6 w-4 h-4 rounded-full border-2 border-white cursor-crosshair transition-colors",
                isConnecting ? "bg-blue-500" : "bg-gray-300 hover:bg-blue-500"
              )}
              title="Output connection"
              onClick={(e) => {
                e.stopPropagation();
                setIsConnecting(!isConnecting);
              }}
            />
          )}
        </>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-md",
              definition.color || "bg-gray-100"
            )}>
              <IconComponent className="w-4 h-4" />
            </div>
            
            {isEditing ? (
              <Input
                value={node.data.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleNameChange((e.target as HTMLInputElement).value);
                  }
                }}
                className="h-6 text-sm font-medium"
                autoFocus
              />
            ) : (
              <h3 
                className="text-sm font-medium truncate cursor-text"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) setIsEditing(true);
                }}
              >
                {node.data.name}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-1">
            {getStatusIcon()}
            
            {!isReadOnly && isSelected && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open config panel
                  }}
                >
                  <Settings className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {definition.category}
          </Badge>
          
          {node.data.executionTime && (
            <span className="text-xs text-gray-500">
              {node.data.executionTime}ms
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {node.data.description || definition.description}
        </p>

        {/* Quick Config */}
        {isSelected && !isReadOnly && (
          <div className="space-y-2 border-t pt-3">
            {definition.configSchema?.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                {field.type === 'text' && (
                  <Input
                    value={node.data.config?.[field.key] || ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-7 text-xs"
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={node.data.config?.[field.key] || ''}
                    onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                    placeholder={field.placeholder}
                    className="h-7 text-xs"
                  />
                )}
                {field.type === 'select' && (
                  <select
                    value={node.data.config?.[field.key] || ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    className="w-full h-7 text-xs border border-gray-300 rounded px-2"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Node Outputs */}
        {definition.outputs && definition.outputs.length > 0 && (
          <div className="mt-3 space-y-1">
            <Label className="text-xs text-gray-500">Outputs:</Label>
            {definition.outputs.map((output, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-600">{output.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Execution Stats */}
        {node.data.stats && (
          <div className="mt-3 flex justify-between text-xs text-gray-500">
            <span>Runs: {node.data.stats.executions}</span>
            <span>Success: {node.data.stats.successRate}%</span>
          </div>
        )}
      </CardContent>

      {/* Connection Mode Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Link className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <p className="text-xs text-blue-800">Click target node</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setIsConnecting(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}