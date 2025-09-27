

"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Settings, Trash2, Zap } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';

export function CustomNode({ data, selected }: NodeProps<{ 
  label: string, 
  icon: React.ReactNode, 
  color: string, 
  triggerKeywords?: string[],
  triggerType?: string,
  triggerMatchType?: string,
  messageId?: string,
  isDeletable?: boolean,
  isMainTrigger?: boolean,
  onConfigure: () => void,
  onDelete: () => void 
}>) {
  
  const getMatchTypeLabel = (matchType?: string) => {
    switch (matchType) {
      case 'exact': return 'Exata';
      case 'contains': return 'Contém';
      case 'starts_with': return 'Começa com';
      case 'regex': return 'Regex';
      default: return 'N/A';
    }
  }

  const contentPreview = () => {
    if (data.type === 'keywordTrigger') {
      return data.triggerKeywords && data.triggerKeywords.length > 0
        ? `"${data.triggerKeywords[0]}"...` 
        : <span className="italic">Nenhuma palavra-chave</span>;
    }
    if (data.type === 'message') {
      return data.messageId ? `ID: ...${data.messageId.slice(-4)}` : <span className="italic">Nenhuma mensagem</span>;
    }
    return 'Nenhuma configuração';
  };
  
  const isDeletable = data.isDeletable !== false;
  
  const isMainTrigger = data.isMainTrigger === true;

  if (isMainTrigger) {
    return (
      <div className="relative group min-w-[280px]">
        <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" isConnectable={false} />
        <Card className={cn(
          "border-l-4 hover:shadow-lg transition-shadow bg-accent/10",
          selected ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent',
          data.color
        )}>
          <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
            <div className="p-1.5 rounded-md bg-yellow-500/20 text-yellow-600">
              <Zap />
            </div>
            <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground space-y-2">
              <div className="flex flex-wrap gap-1">
                  <span className="font-medium mr-2">Gatilhos:</span>
                  {(data.triggerKeywords && data.triggerKeywords.length > 0) ? (
                    data.triggerKeywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)
                  ) : (
                    <Badge variant="outline">Nenhum</Badge>
                  )}
              </div>
              <div className="flex justify-between items-center">
                  <span className="font-medium">Correspondência:</span>
                  <Badge variant="outline">{getMatchTypeLabel(data.triggerMatchType)}</Badge>
              </div>
          </CardContent>
          <CardFooter className="p-2 border-t bg-muted/50 flex justify-end gap-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={data.onConfigure}
            >
                <Settings className="h-4 w-4"/>
                <span className="sr-only">Configurar Tarefa</span>
            </Button>
          </CardFooter>
        </Card>
        <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      </div>
    )
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Card className={cn(
        "border-l-4 hover:shadow-lg transition-shadow",
        selected ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent',
        data.color
      )}>
        <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
          <div className="p-1.5 rounded-md bg-muted">
            {data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground">
          <Badge variant="secondary" className="w-full justify-center truncate">{contentPreview()}</Badge>
        </CardContent>
        <CardFooter className="p-2 border-t bg-muted/50 flex justify-end gap-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={data.onConfigure}
            >
                <Settings className="h-4 w-4"/>
                <span className="sr-only">Configurar Tarefa</span>
            </Button>
            {isDeletable && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={data.onDelete}
                >
                    <Trash2 className="h-4 w-4"/>
                    <span className="sr-only">Excluir Tarefa</span>
                </Button>
            )}
        </CardFooter>
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  );
}
