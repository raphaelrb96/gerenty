
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
} from 'reactflow';

import 'reactflow/dist/style.css';

type FlowBuilderProps = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
};

export function FlowBuilder({ nodes, edges, onNodesChange, onEdgesChange }: FlowBuilderProps) {

  const onConnect = useCallback(
    (params: Edge | Connection) => {
        // This logic will be handled by the parent component's onEdgesChange
    },
    [],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap style={{ height: 80, width: 120 }} />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
