
"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';

import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { 
    id: '1', 
    type: 'input', 
    data: { label: 'Gatilho: Palavra-Chave', type: 'keywordTrigger' }, 
    position: { x: 250, y: 5 } 
  },
  { 
    id: '2', 
    data: { label: 'Enviar Mensagem de Boas-Vindas', type: 'message' }, 
    position: { x: 250, y: 125 } 
  },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2', animated: true }];

type FlowBuilderProps = {
    onNodeClick: (node: Node) => void;
};

export function FlowBuilder({ onNodeClick }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onNodeClick(node);
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
