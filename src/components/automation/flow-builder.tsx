
"use client";

import React from 'react';
import ReactFlow, {
  Controls,
  Background,
  OnNodesChange,
  OnEdgesChange,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ProOptions
} from 'reactflow';
import { CustomNode } from './custom-node';
import { CustomEdge } from './custom-edge';
import { LibraryMessage } from '@/lib/types';

import 'reactflow/dist/style.css';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const proOptions: ProOptions = { hideAttribution: true };

type FlowBuilderProps = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (params: Edge | Connection) => void;
    onEdgesDelete: (edges: Edge[]) => void;
    libraryMessages: LibraryMessage[];
};

export function FlowBuilder({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onEdgesDelete, libraryMessages }: FlowBuilderProps) {

  const edgesWithCustomType = edges.map(edge => ({
    ...edge,
    type: 'custom',
    data: {
      ...edge.data,
      onDelete: () => onEdgesDelete([edge]), // Pass the delete handler
    }
  }));

  const nodesWithMessages = nodes.map(node => ({
      ...node,
      data: {
          ...node.data,
          libraryMessages, // Pass libraryMessages to each node
      },
  }));


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodesWithMessages.map(node => ({ ...node, type: 'custom' }))}
        edges={edgesWithCustomType}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.8 }}
        defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: '#9ca3af' } }}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={proOptions}
        minZoom={0.1}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}
