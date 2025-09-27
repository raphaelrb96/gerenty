
"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Settings } from 'lucide-react';

export function CustomNode({ data, selected }: NodeProps<{ 
  label: string, 
  icon: React.ReactNode, 
  color: string, 
  triggerKeyword?: string, 
  messageId?: string,
  onConfigure: () => void 
}>) {
  
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
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Card className={cn(
        "border-2 hover:shadow-lg transition-shadow",
        selected ? 'border-primary ring-2 ring-primary/50' : data.color
      )}>
        <CardHeader className="flex flex-row items-center gap-3 p-3">
          <div className="p-1.5 rounded-md bg-muted">
            {data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground">
          <Badge variant="secondary" className="w-full justify-center truncate">{contentPreview()}</Badge>
        </CardContent>
      </Card>
      <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={data.onConfigure}
      >
          <Settings className="h-4 w-4"/>
          <span className="sr-only">Configurar Tarefa</span>
      </Button>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  );
}
