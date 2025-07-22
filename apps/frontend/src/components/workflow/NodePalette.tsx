'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  WORKFLOW_NODE_DEFINITIONS, 
  WorkflowNodeDefinition, 
  NodeCategory,
  WorkflowNodeType 
} from '@/types/workflow-types';
import { useUserProgressStore } from '@/stores/userProgress';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onNodeDrop: (type: WorkflowNodeType, position: { x: number; y: number }) => void;
  className?: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  triggers: { label: 'Triggers', icon: '⚡', color: 'bg-green-100 text-green-800' },
  actions: { label: 'Actions', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  conditions: { label: 'Conditions', icon: '🔀', color: 'bg-yellow-100 text-yellow-800' },
  utilities: { label: 'Utilities', icon: '🛠️', color: 'bg-gray-100 text-gray-800' }
};

export function NodePalette({ onNodeDrop, className }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['triggers', 'actions', 'conditions'])
  );
  const canAccessFeature = useUserProgressStore(state => state.canAccessFeature);

  // Group nodes by category
  const nodesByCategory = React.useMemo(() => {
    const categories: Record<string, WorkflowNodeDefinition[]> = {
      triggers: [],
      actions: [],
      conditions: [],
      utilities: []
    };

    Object.values(WORKFLOW_NODE_DEFINITIONS).forEach(nodeDef => {
      // Check if user has access to this node type
      const hasAccess = (nodeDef.requiredPermissions || []).length === 0 || 
        (nodeDef.requiredPermissions || []).some(permission => canAccessFeature(permission as any));
      
      if (hasAccess && (nodeDef.isAvailable !== false)) {
        categories[nodeDef.category].push(nodeDef);
      }
    });

    return categories;
  }, [canAccessFeature]);

  // Filter nodes based on search
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm.trim()) return nodesByCategory;

    const filtered: Record<string, WorkflowNodeDefinition[]> = {
      triggers: [],
      actions: [],
      conditions: [],
      utilities: []
    };

    Object.entries(nodesByCategory).forEach(([category, nodes]) => {
      filtered[category] = nodes.filter(node =>
        (node.label || node.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    return filtered;
  }, [nodesByCategory, searchTerm]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragEnd = (result: any) => {
    // Handle dragging from palette to canvas
    if (!result.destination) return;
    
    const { draggableId } = result;
    const nodeType = draggableId as WorkflowNodeType;
    
    // The actual drop position will be handled by the canvas component
    console.log('Node dragged from palette:', nodeType);
  };

  return (
    <div className={cn('w-80 bg-white border-r border-gray-200 flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Workflow Nodes</h3>
          <Badge variant="outline" className="text-xs">
            {Object.values(filteredCategories).flat().length} nodes
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-2 space-y-2">
            {Object.entries(CATEGORY_CONFIG).map(([categoryKey, categoryConfig]) => {
              const category = categoryKey;
              const nodes = filteredCategories[category] || [];
              const isExpanded = expandedCategories.has(category);
              
              if (nodes.length === 0) return null;

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryConfig.icon}</span>
                        <span className="text-sm">{categoryConfig.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {nodes.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Droppable droppableId={`category-${category}`} isDropDisabled>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-1 ml-4"
                        >
                          {nodes.map((node, index) => (
                            <Draggable
                              key={node.type || node.name}
                              draggableId={node.type || node.name}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    'group relative cursor-grab active:cursor-grabbing',
                                    'border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors',
                                    'hover:border-gray-300 hover:shadow-sm',
                                    snapshot.isDragging && 'shadow-lg rotate-2 scale-105'
                                  )}
                                  style={{
                                    ...provided.draggableProps.style,
                                    borderLeftColor: node.color,
                                    borderLeftWidth: '4px'
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-medium"
                                      style={{ backgroundColor: node.color }}
                                    >
                                      <node.icon size={16} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm text-gray-900 truncate">
                                          {node.label || node.name}
                                        </h4>
                                        {(node.requiredPermissions || []).length > 0 && (
                                          <Badge variant="outline" className="text-xs ml-2">
                                            Pro
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {node.description}
                                      </p>
                                      
                                      {/* Node connections preview */}
                                      <div className="flex items-center gap-2 mt-2">
                                        {(node.inputs || []).length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                            <span className="text-xs text-gray-400">
                                              {(node.inputs || []).length} in
                                            </span>
                                          </div>
                                        )}
                                        {(node.outputs || []).length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-400" />
                                            <span className="text-xs text-gray-400">
                                              {(node.outputs || []).length} out
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Drag indicator */}
                                  {snapshot.isDragging && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg border-2 border-blue-500 border-dashed" />
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            Drag nodes to the canvas to build your workflow
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-gray-500">Input</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-gray-500">Output</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for locked nodes (future enhancement)
function LockedNodeCard({ node }: { node: WorkflowNodeDefinition }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50 opacity-60">
      <div className="flex items-start gap-3">
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-medium opacity-50"
          style={{ backgroundColor: node.color }}
        >
          <node.icon size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-600 truncate">
              {node.label || node.name}
            </h4>
            <Badge variant="outline" className="text-xs">
              Locked
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {node.description}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Requires: {(node.requiredPermissions || []).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NodePalette;