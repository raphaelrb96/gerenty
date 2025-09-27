
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
};

export function FlowBuilder({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onEdgesDelete }: FlowBuilderProps) {

  const edgesWithCustomType = edges.map(edge => ({
    ...edge,
    type: 'custom',
    data: {
      ...edge.data,
      onDelete: () => onEdgesDelete([edge]), // Pass the delete handler
    }
  }));


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes.map(node => ({ ...node, type: 'custom' }))}
        edges={edgesWithCustomType}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: '#9ca3af' } }}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={proOptions}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
