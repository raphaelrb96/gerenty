
"use client";

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  EdgeProps,
} from 'reactflow';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps & { data?: { onDelete: () => void } }) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    if (data?.onDelete) {
      data.onDelete();
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn("nodrag nopan transition-opacity", selected ? "opacity-100" : "opacity-0")}
        >
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={onEdgeClick}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
