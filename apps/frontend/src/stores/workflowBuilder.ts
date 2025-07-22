import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowBuilderState,
  WorkflowNodeType,
  WorkflowValidationResult,
  WORKFLOW_NODE_DEFINITIONS
} from '@/types/workflow-types';

interface WorkflowBuilderStore extends WorkflowBuilderState {
  // Actions
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (updates: Partial<Workflow>) => void;
  
  // Node management
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }, workflowId?: string) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  clearSelection: () => void;
  
  // Edge management
  addEdge: (sourceId: string, targetId: string, workflowId?: string) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Workflow management
  clearWorkflow: () => void;
  validateWorkflow: () => WorkflowValidationResult;
  
  // Drag and drop
  setDraggedNodeType: (nodeType: WorkflowNodeType | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useWorkflowStore = create<WorkflowBuilderStore>((set, get) => ({
  // State
  workflow: {
    id: '',
    name: 'Untitled Workflow',
    description: '',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    isTemplate: false,
    category: 'custom',
    tags: [],
    metadata: {}
  },
  nodes: [],
  edges: [],
  selectedNode: null,
  draggedNodeType: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  canUndo: false,
  canRedo: false,

  // Actions
  setWorkflow: (workflow) => set({ workflow }),
  
  updateWorkflow: (updates) => set((state) => ({
    workflow: { ...state.workflow, ...updates, updatedAt: new Date() }
  })),

  addNode: (type, position, workflowId) => {
    const definition = WORKFLOW_NODE_DEFINITIONS[type];
    const newNode: WorkflowNode = {
      id: uuidv4(),
      type,
      position,
      workflowId: workflowId || get().workflow.id,
      data: {
        name: definition.name,
        description: definition.description,
        config: {},
        status: 'idle'
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode
    }));
  },

  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    )
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== nodeId),
    selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
  })),

  selectNode: (nodeId) => set((state) => ({
    selectedNode: state.nodes.find(node => node.id === nodeId) || null
  })),

  clearSelection: () => set({ selectedNode: null }),

  addEdge: (sourceId, targetId, workflowId) => {
    const newEdge: WorkflowEdge = {
      id: uuidv4(),
      source: sourceId,
      target: targetId,
      sourceHandle: 'output',
      targetHandle: 'input',
      workflowId: workflowId || get().workflow.id
    };

    set((state) => ({
      edges: [...state.edges, newEdge]
    }));
  },

  deleteEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== edgeId)
  })),

  clearWorkflow: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    history: [],
    historyIndex: -1,
    canUndo: false,
    canRedo: false
  }),

  validateWorkflow: () => {
    const { nodes, edges } = get();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for trigger nodes
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && nodes.length > 1
    );

    if (disconnectedNodes.length > 0) {
      warnings.push(`${disconnectedNodes.length} nodes are not connected`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  setDraggedNodeType: (nodeType) => set({ draggedNodeType: nodeType }),

  undo: () => {
    const state = get();
    if (state.canUndo && state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1];
      set({
        ...previousState,
        historyIndex: state.historyIndex - 1,
        canUndo: state.historyIndex > 1,
        canRedo: true
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.canRedo && state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        ...nextState,
        historyIndex: state.historyIndex + 1,
        canUndo: true,
        canRedo: state.historyIndex < state.history.length - 2
      });
    }
  }
}));