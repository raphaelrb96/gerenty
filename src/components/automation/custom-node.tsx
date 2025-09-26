
"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

export function CustomNode({ data, selected }: NodeProps<{ label: string, icon: React.ReactNode, color: string }>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <Card className={cn(
        "border-2",
        data.color,
        selected && "ring-2 ring-primary ring-offset-2"
      )}>
        <CardHeader className="flex flex-row items-center gap-2 p-2 border-b">
          <div className="p-1 rounded-md bg-background/50">
            {data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs text-muted-foreground">
          <p>This is a custom node.</p>
          <p>More details can go here.</p>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </>
  );
}
