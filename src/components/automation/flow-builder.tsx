"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant
} from 'reactflow';
import { CustomNode } from './custom-node';

import 'reactflow/dist/style.css';

const nodeTypes = {
  custom: CustomNode,
};


type FlowBuilderProps = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (params: Edge | Connection) => void;
};

export function FlowBuilder({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: FlowBuilderProps) {

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes.map(node => ({ ...node, type: 'custom' }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: '#9ca3af' } }}
      >
        <Controls />
        <MiniMap style={{ height: 80, width: 120 }} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
