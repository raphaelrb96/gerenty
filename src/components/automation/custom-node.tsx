"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export function CustomNode({ data, selected }: NodeProps<{ label: string, icon: React.ReactNode, color: string, triggerKeyword?: string, messageId?: string }>) {
  
  const contentPreview = () => {
    if (data.type === 'keywordTrigger') {
      return data.triggerKeyword ? `"${data.triggerKeyword}"` : <span className="italic">Nenhuma palavra-chave</span>;
    }
    if (data.type === 'message') {
      return data.messageId ? `ID: ...${data.messageId.slice(-4)}` : <span className="italic">Nenhuma mensagem</span>;
    }
    return 'Nenhuma configuração';
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Card className={cn(
        "border-l-4",
        data.color,
        selected && "ring-2 ring-primary ring-offset-2 shadow-lg"
      )}>
        <CardHeader className="flex flex-row items-center gap-2 p-3">
          <div className="p-1.5 rounded-md bg-background/80">
            {data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
          <Badge variant="secondary" className="w-full justify-center truncate">{contentPreview()}</Badge>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </>
  );
}
