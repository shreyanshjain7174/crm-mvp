import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowBuilderState,
  WorkflowNodeType,
  WorkflowValidationResult,
  WorkflowValidationError,
  WorkflowValidationWarning,
  WORKFLOW_NODE_DEFINITIONS
} from '@/types/workflow-types';

interface WorkflowBuilderStore extends WorkflowBuilderState {
  // Actions
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (updates: Partial<Workflow>) => void;
  
  // Node management
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Edge management
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => void;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  selectEdge: (edgeId: string | null) => void;
  
  // Canvas controls
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setMode: (mode: 'edit' | 'view' | 'debug') => void;
  toggleMinimap: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Workflow operations
  validateWorkflow: () => WorkflowValidationResult;
  saveWorkflow: () => Promise<void>;
  publishWorkflow: () => Promise<void>;
  executeWorkflow: (triggerData?: any) => Promise<void>;
  stopExecution: () => Promise<void>;
  
  // Utility functions
  getNodeById: (nodeId: string) => WorkflowNode | undefined;
  getEdgeById: (edgeId: string) => WorkflowEdge | undefined;
  getConnectedNodes: (nodeId: string) => { incoming: WorkflowNode[]; outgoing: WorkflowNode[] };
  canConnect: (sourceId: string, targetId: string) => boolean;
  fitToScreen: () => void;
  centerWorkflow: () => void;
  
  // Undo/Redo
  history: Workflow[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const createEmptyWorkflow = (): Workflow => ({
  id: uuidv4(),
  name: 'Untitled Workflow',
  description: '',
  businessId: '',
  status: 'draft',
  nodes: [],
  edges: [],
  variables: [],
  triggers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
  isTemplate: false,
  category: 'general',
  tags: []
});

export const useWorkflowBuilderStore = create<WorkflowBuilderStore>((set, get) => ({
  // Initial state
  workflow: createEmptyWorkflow(),
  selectedNodeId: null,
  selectedEdgeId: null,
  isExecuting: false,
  executionId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  mode: 'edit',
  showMinimap: true,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  history: [],
  historyIndex: -1,

  // Workflow management
  setWorkflow: (workflow) => {
    set({ 
      workflow,
      selectedNodeId: null,
      selectedEdgeId: null,
      history: [workflow],
      historyIndex: 0
    });
  },

  updateWorkflow: (updates) => {
    const state = get();
    const updatedWorkflow = { 
      ...state.workflow, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    // Add to history
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(updatedWorkflow);
    
    set({ 
      workflow: updatedWorkflow,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  // Node management
  addNode: (type, position) => {
    const state = get();
    const definition = WORKFLOW_NODE_DEFINITIONS[type];
    
    const newNode: WorkflowNode = {
      id: uuidv4(),
      type,
      position,
      data: {
        label: definition.label,
        description: definition.description,
        config: { ...definition.defaultConfig },
        icon: definition.icon,
        color: definition.color
      },
      inputs: [...definition.inputs],
      outputs: [...definition.outputs]
    };

    get().updateWorkflow({
      nodes: [...state.workflow.nodes, newNode]
    });
    
    // Auto-select the new node
    set({ selectedNodeId: newNode.id });
  },

  updateNode: (nodeId, updates) => {
    const state = get();
    const nodes = state.workflow.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    
    get().updateWorkflow({ nodes });
  },

  deleteNode: (nodeId) => {
    const state = get();
    const nodes = state.workflow.nodes.filter(node => node.id !== nodeId);
    const edges = state.workflow.edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    );
    
    get().updateWorkflow({ nodes, edges });
    
    // Clear selection if deleted node was selected
    if (state.selectedNodeId === nodeId) {
      set({ selectedNodeId: null });
    }
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const originalNode = state.workflow.nodes.find(node => node.id === nodeId);
    
    if (originalNode) {
      const duplicatedNode: WorkflowNode = {
        ...originalNode,
        id: uuidv4(),
        position: {
          x: originalNode.position.x + 50,
          y: originalNode.position.y + 50
        }
      };
      
      get().updateWorkflow({
        nodes: [...state.workflow.nodes, duplicatedNode]
      });
      
      set({ selectedNodeId: duplicatedNode.id });
    }
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },

  // Edge management
  addEdge: (edgeData) => {
    const state = get();
    const newEdge: WorkflowEdge = {
      ...edgeData,
      id: uuidv4()
    };

    // Check if connection is valid
    if (get().canConnect(edgeData.source, edgeData.target)) {
      get().updateWorkflow({
        edges: [...state.workflow.edges, newEdge]
      });
    }
  },

  updateEdge: (edgeId, updates) => {
    const state = get();
    const edges = state.workflow.edges.map(edge => 
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );
    
    get().updateWorkflow({ edges });
  },

  deleteEdge: (edgeId) => {
    const state = get();
    const edges = state.workflow.edges.filter(edge => edge.id !== edgeId);
    
    get().updateWorkflow({ edges });
    
    if (state.selectedEdgeId === edgeId) {
      set({ selectedEdgeId: null });
    }
  },

  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },

  // Canvas controls
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 3)) }),
  
  setPanOffset: (panOffset) => set({ panOffset }),
  
  setMode: (mode) => set({ mode }),
  
  toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
  
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  
  setGridSize: (gridSize) => set({ gridSize }),

  // Workflow operations
  validateWorkflow: () => {
    const state = get();
    const { nodes, edges } = state.workflow;
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    // Check for trigger nodes
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push({
        id: uuidv4(),
        type: 'missing-trigger',
        message: 'Workflow must have at least one trigger node'
      });
    }

    // Check for disconnected nodes
    nodes.forEach(node => {
      if (node.type !== 'trigger') {
        const hasIncomingEdge = edges.some(edge => edge.target === node.id);
        if (!hasIncomingEdge) {
          errors.push({
            id: uuidv4(),
            type: 'disconnected-node',
            nodeId: node.id,
            message: `Node "${node.data.label}" is not connected to any input`
          });
        }
      }
      
      if (node.type !== 'end') {
        const hasOutgoingEdge = edges.some(edge => edge.source === node.id);
        if (!hasOutgoingEdge) {
          warnings.push({
            id: uuidv4(),
            type: 'unused-node',
            nodeId: node.id,
            message: `Node "${node.data.label}" has no outgoing connections`
          });
        }
      }
    });

    // Check for circular dependencies
    const detectCycles = (nodeId: string, visited: Set<string>, path: Set<string>): boolean => {
      if (path.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      path.add(nodeId);
      
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (detectCycles(edge.target, visited, path)) {
          return true;
        }
      }
      
      path.delete(nodeId);
      return false;
    };

    const visited = new Set<string>();
    for (const node of nodes) {
      if (detectCycles(node.id, visited, new Set())) {
        errors.push({
          id: uuidv4(),
          type: 'circular-dependency',
          nodeId: node.id,
          message: 'Circular dependency detected in workflow'
        });
        break;
      }
    }

    // Check for end nodes
    const endNodes = nodes.filter(node => node.type === 'end');
    if (endNodes.length === 0 && nodes.length > 1) {
      warnings.push({
        id: uuidv4(),
        type: 'missing-end',
        message: 'Consider adding an end node to clearly mark workflow completion'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  saveWorkflow: async () => {
    const state = get();
    // TODO: Implement API call to save workflow
    console.log('Saving workflow:', state.workflow);
  },

  publishWorkflow: async () => {
    const state = get();
    const validation = get().validateWorkflow();
    
    if (!validation.isValid) {
      throw new Error('Cannot publish workflow with validation errors');
    }
    
    get().updateWorkflow({ status: 'active' });
    // TODO: Implement API call to publish workflow
    console.log('Publishing workflow:', state.workflow);
  },

  executeWorkflow: async (triggerData = {}) => {
    const state = get();
    const validation = get().validateWorkflow();
    
    if (!validation.isValid) {
      throw new Error('Cannot execute workflow with validation errors');
    }
    
    set({ isExecuting: true, executionId: uuidv4() });
    
    try {
      // TODO: Implement workflow execution
      console.log('Executing workflow with trigger data:', triggerData);
      
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } finally {
      set({ isExecuting: false, executionId: null });
    }
  },

  stopExecution: async () => {
    const state = get();
    if (state.executionId) {
      // TODO: Implement execution stopping
      console.log('Stopping execution:', state.executionId);
      set({ isExecuting: false, executionId: null });
    }
  },

  // Utility functions
  getNodeById: (nodeId) => {
    const state = get();
    return state.workflow.nodes.find(node => node.id === nodeId);
  },

  getEdgeById: (edgeId) => {
    const state = get();
    return state.workflow.edges.find(edge => edge.id === edgeId);
  },

  getConnectedNodes: (nodeId) => {
    const state = get();
    const { nodes, edges } = state.workflow;
    
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    
    const incoming = incomingEdges
      .map(edge => nodes.find(node => node.id === edge.source))
      .filter(Boolean) as WorkflowNode[];
      
    const outgoing = outgoingEdges
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(Boolean) as WorkflowNode[];
    
    return { incoming, outgoing };
  },

  canConnect: (sourceId, targetId) => {
    const state = get();
    const { edges } = state.workflow;
    
    // Prevent self-connections
    if (sourceId === targetId) return false;
    
    // Prevent duplicate connections
    const existingConnection = edges.find(edge => 
      edge.source === sourceId && edge.target === targetId
    );
    if (existingConnection) return false;
    
    // Check for circular dependencies
    const wouldCreateCycle = (start: string, current: string, visited: Set<string>): boolean => {
      if (current === start && visited.size > 0) return true;
      if (visited.has(current)) return false;
      
      visited.add(current);
      const outgoingEdges = edges.filter(edge => edge.source === current);
      
      for (const edge of outgoingEdges) {
        if (wouldCreateCycle(start, edge.target, new Set(visited))) {
          return true;
        }
      }
      
      return false;
    };
    
    if (wouldCreateCycle(sourceId, targetId, new Set())) {
      return false;
    }
    
    return true;
  },

  fitToScreen: () => {
    // TODO: Implement fit to screen logic
    console.log('Fitting workflow to screen');
  },

  centerWorkflow: () => {
    // TODO: Implement center workflow logic
    console.log('Centering workflow');
  },

  // Undo/Redo
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        workflow: state.history[newIndex],
        historyIndex: newIndex,
        selectedNodeId: null,
        selectedEdgeId: null
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        workflow: state.history[newIndex],
        historyIndex: newIndex,
        selectedNodeId: null,
        selectedEdgeId: null
      });
    }
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  }
}));