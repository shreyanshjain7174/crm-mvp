'use client';

import React, { useMemo } from 'react';
import { Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow-types';

interface ConnectionLinesProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onDeleteEdge: (edgeId: string) => void;
}

export function ConnectionLines({ nodes, edges, onDeleteEdge }: ConnectionLinesProps) {
  const connections = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;

      // Calculate connection points
      const sourceX = sourceNode.position.x + 200; // Node width
      const sourceY = sourceNode.position.y + 24; // Connection point height
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + 24;

      // Create curved path
      const midX = (sourceX + targetX) / 2;
      const controlPoint1X = sourceX + Math.abs(targetX - sourceX) / 3;
      const controlPoint2X = targetX - Math.abs(targetX - sourceX) / 3;

      const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY}, ${controlPoint2X} ${targetY}, ${targetX} ${targetY}`;

      return {
        ...edge,
        path,
        sourceX,
        sourceY,
        targetX,
        targetY,
        midX: (sourceX + targetX) / 2,
        midY: (sourceY + targetY) / 2
      };
    }).filter(Boolean);
  }, [nodes, edges]);

  const getConnectionColor = (status?: string) => {
    switch (status) {
      case 'active':
        return '#10B981'; // Green
      case 'error':
        return '#EF4444'; // Red
      case 'waiting':
        return '#F59E0B'; // Amber
      default:
        return '#6B7280'; // Gray
    }
  };

  const getConnectionWidth = (status?: string) => {
    return status === 'active' ? 3 : 2;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Arrow markers */}
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
            fill="#6B7280"
          />
        </marker>
        
        <marker
          id="arrowhead-active"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#10B981"
          />
        </marker>

        {/* Flow animation */}
        <circle id="flowDot" r="3" fill="#3B82F6">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </defs>

      {connections.map((connection) => {
        if (!connection) return null;

        const strokeColor = getConnectionColor(connection.status);
        const strokeWidth = getConnectionWidth(connection.status);
        const markerId = connection.status === 'active' ? 'arrowhead-active' : 'arrowhead';

        return (
          <g key={connection.id}>
            {/* Main connection line */}
            <path
              d={connection.path}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              markerEnd={`url(#${markerId})`}
              className="transition-all duration-300"
            />

            {/* Hover area for interaction */}
            <path
              d={connection.path}
              stroke="transparent"
              strokeWidth="12"
              fill="none"
              className="pointer-events-auto cursor-pointer hover:stroke-blue-200"
              onClick={() => onDeleteEdge(connection.id)}
            />

            {/* Flow animation for active connections */}
            {connection.status === 'active' && (
              <circle r="4" fill="#3B82F6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={connection.path}
                />
              </circle>
            )}

            {/* Connection label/status */}
            {connection.label && (
              <g>
                <rect
                  x={connection.midX - 30}
                  y={connection.midY - 8}
                  width="60"
                  height="16"
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth="1"
                  rx="8"
                  className="pointer-events-auto"
                />
                <text
                  x={connection.midX}
                  y={connection.midY + 3}
                  textAnchor="middle"
                  className="text-xs font-medium pointer-events-none"
                  fill={strokeColor}
                >
                  {connection.label}
                </text>
              </g>
            )}

            {/* Delete button on hover */}
            <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
              <circle
                cx={connection.midX}
                cy={connection.midY}
                r="12"
                fill="white"
                stroke="#EF4444"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => onDeleteEdge(connection.id)}
              />
              <Trash2 
                x={connection.midX - 6} 
                y={connection.midY - 6} 
                width="12" 
                height="12" 
                className="text-red-500 pointer-events-none" 
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}