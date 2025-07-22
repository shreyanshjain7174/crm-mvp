'use client';

import React, { useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Play, Save, Settings, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowBuilder';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow-types';
import { WorkflowNodeComponent } from './WorkflowNodeComponent';
import { ConnectionLines } from './ConnectionLines';

interface WorkflowCanvasProps {
  workflowId: string;
  isReadOnly?: boolean;
  onSave?: () => void;
  onTest?: () => void;
}

export function WorkflowCanvas({ 
  workflowId, 
  isReadOnly = false, 
  onSave, 
  onTest 
}: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    selectedNode,
    draggedNodeType,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    selectNode,
    clearSelection,
    setDraggedNodeType,
    canUndo,
    canRedo,
    undo,
    redo
  } = useWorkflowStore();

  const workflowNodes = useMemo(() => 
    nodes.filter(node => node.workflowId === workflowId),
    [nodes, workflowId]
  );

  const workflowEdges = useMemo(() => 
    edges.filter(edge => 
      workflowNodes.some(node => node.id === edge.source) &&
      workflowNodes.some(node => node.id === edge.target)
    ),
    [edges, workflowNodes]
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Handle dropping from palette to canvas
    if (destination?.droppableId === 'workflow-canvas' && source.droppableId === 'node-palette') {
      const nodeType = draggableId as any;
      const position = {
        x: destination.index * 200 + 100, // Rough positioning
        y: Math.floor(destination.index / 4) * 150 + 100
      };
      
      addNode(nodeType, position, workflowId);
      setDraggedNodeType(null);
      return;
    }

    // Handle reordering nodes on canvas
    if (destination?.droppableId === 'workflow-canvas' && source.droppableId === 'workflow-canvas') {
      // For now, we don't reorder - nodes have fixed positions
      // In a full implementation, you'd update node positions here
      return;
    }
  }, [addNode, setDraggedNodeType, workflowId]);

  const handleNodeConnect = useCallback((sourceId: string, targetId: string) => {
    if (sourceId !== targetId) {
      addEdge(sourceId, targetId, workflowId);
    }
  }, [addEdge, workflowId]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    deleteNode(nodeId);
    // Clean up edges connected to deleted node
    workflowEdges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .forEach(edge => deleteEdge(edge.id));
  }, [deleteNode, deleteEdge, workflowEdges]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  }, [clearSelection]);

  const getGridBackground = () => ({
    backgroundImage: `
      linear-gradient(to right, #f1f5f9 1px, transparent 1px),
      linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px'
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Workflow Builder</h2>
          <Badge variant="outline" className="text-xs">
            {workflowNodes.length} nodes
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo || isReadOnly}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!canRedo || isReadOnly}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </Button>

          <div className="h-4 w-px bg-gray-300 mx-2" />

          {/* Actions */}
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={onTest}>
                <Play className="w-4 h-4 mr-1" />
                Test
              </Button>
            </>
          )}

          {selectedNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedNode && handleNodeDelete(selectedNode.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex">
          {/* Main Canvas Area */}
          <div className="flex-1 relative overflow-auto">
            <Droppable droppableId="workflow-canvas" type="WORKFLOW_NODE">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-full min-w-full relative ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  style={getGridBackground()}
                  onClick={handleCanvasClick}
                >
                  {/* Connection Lines */}
                  <ConnectionLines 
                    nodes={workflowNodes} 
                    edges={workflowEdges}
                    onDeleteEdge={deleteEdge}
                  />

                  {/* Workflow Nodes */}
                  {workflowNodes.map((node, index) => (
                    <Draggable
                      key={node.id}
                      draggableId={node.id}
                      index={index}
                      isDragDisabled={isReadOnly}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            position: 'absolute',
                            left: node.position.x,
                            top: node.position.y,
                            zIndex: snapshot.isDragging ? 1000 : 1
                          }}
                        >
                          <WorkflowNodeComponent
                            node={node}
                            isSelected={selectedNode?.id === node.id}
                            isDragging={snapshot.isDragging}
                            isReadOnly={isReadOnly}
                            onSelect={() => selectNode(node.id)}
                            onConnect={handleNodeConnect}
                            onUpdate={(updates) => updateNode(node.id, updates)}
                            onDelete={() => handleNodeDelete(node.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {/* Drop zone indicator */}
                  {snapshot.isDraggingOver && draggedNodeType && (
                    <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-blue-600 font-medium">
                        Drop to add {draggedNodeType} node
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {workflowNodes.length === 0 && !snapshot.isDraggingOver && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Card className="p-8 text-center border-dashed border-2">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-lg font-semibold mb-2">Start Building Your Workflow</h3>
                        <p className="text-gray-600 mb-4">
                          Drag nodes from the palette to create your automation workflow
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Plus className="w-4 h-4" />
                          Drag & drop to begin
                        </div>
                      </Card>
                    </div>
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Status Bar */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Nodes: {workflowNodes.length}</span>
          <span>Connections: {workflowEdges.length}</span>
          {selectedNode && (
            <span className="text-blue-600">
              Selected: {selectedNode.data.name || selectedNode.type}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Z</kbd>
          <span>Undo</span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Del</kbd>
          <span>Delete</span>
        </div>
      </div>
    </div>
  );
}