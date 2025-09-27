

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
  triggerKeywords?: { value: string; matchType: string }[],
  triggerType?: string,
  messageId?: string,
  actionType?: string,
  captureVariable?: string,
  delaySeconds?: number,
  transferTo?: string,
  conditions?: any[],
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
    switch (data.type) {
        case 'message':
            return data.messageId ? `ID: ...${data.messageId.slice(-4)}` : <span className="italic">Nenhuma mensagem</span>;
        case 'internalAction':
            return data.actionType ? `Ação: ${data.actionType}` : <span className="italic">Nenhuma ação</span>;
        case 'captureData':
            return data.captureVariable ? `Variável: ${data.captureVariable}` : <span className="italic">Nenhuma variável</span>;
        case 'delay':
            return data.delaySeconds ? `Aguardar: ${data.delaySeconds}s` : <span className="italic">Sem atraso</span>;
        case 'transfer':
            return data.transferTo ? `Para: ${data.transferTo}`: <span className="italic">Ninguém selecionado</span>
        case 'conditional':
             return data.conditions?.length ? `${data.conditions.length} condição(ões)` : <span className="italic">Nenhuma condição</span>;
        default:
            return 'Nenhuma configuração';
    }
  };
  
  const isDeletable = data.isDeletable !== false;
  
  const isMainTrigger = data.isMainTrigger === true;

  if (isMainTrigger) {
    return (
      <div className="relative group min-w-[280px]">
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
              <div className="space-y-1">
                  <span className="font-medium mr-2">Gatilhos:</span>
                  {(data.triggerKeywords && data.triggerKeywords.length > 0) ? (
                    data.triggerKeywords.map((kw, index) => 
                        <div key={index} className="flex justify-between items-center text-xs">
                            <Badge variant="secondary">{kw.value}</Badge>
                            <Badge variant="outline">{getMatchTypeLabel(kw.matchType)}</Badge>
                        </div>
                    )
                  ) : (
                    <Badge variant="outline" className="w-full justify-center">Nenhum gatilho definido</Badge>
                  )}
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
      {!isMainTrigger && <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />}
      <Card className={cn(
        "border-l-4 hover:shadow-lg transition-shadow min-w-[250px]",
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
