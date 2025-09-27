

"use client";

import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Settings, Trash2, Zap, PlusCircle } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';

export function CustomNode({ data, selected, id: nodeId }: NodeProps<{ 
  label: string, 
  icon: React.ReactNode, 
  color: string, 
  type: string,
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
  onDelete: () => void,
  onQuickAdd: () => void,
}>) {
  
  const { getEdges } = useReactFlow();

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

  return (
    <div className="relative group">
      {!isMainTrigger && <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />}
      
      {data.type === 'conditional' ? (
        <>
            {(data.conditions || []).map((cond: any, index: number) => (
                <Handle
                    key={cond.id}
                    type="source"
                    position={Position.Right}
                    id={cond.id}
                    style={{ top: `${(index + 1) * 30}px`, background: '#555' }}
                />
            ))}
             <Handle
                type="source"
                position={Position.Bottom}
                id="else"
                style={{ background: '#555' }}
            />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      )}
      
      <Card className={cn(
        "border-l-4 hover:shadow-lg transition-shadow min-w-[250px]",
        selected ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent',
        isMainTrigger ? 'bg-accent/10' : '',
        data.color
      )}>
        <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
          <div className="p-1.5 rounded-md bg-muted">
            {isMainTrigger ? <Zap/> : data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
        </CardHeader>
        
        {isMainTrigger && data.triggerKeywords && data.triggerKeywords.length > 0 ? (
            <CardContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground space-y-2">
                <div className="space-y-1">
                    <span className="font-medium mr-2">Gatilhos:</span>
                    {data.triggerKeywords.map((kw, index) => 
                        <div key={index} className="flex justify-between items-center text-xs">
                            <Badge variant="secondary">{kw.value}</Badge>
                            <Badge variant="outline">{getMatchTypeLabel(kw.matchType)}</Badge>
                        </div>
                    )}
                </div>
            </CardContent>
        ) : !isMainTrigger && (
             <CardContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground">
              <Badge variant="secondary" className="w-full justify-center truncate">{contentPreview()}</Badge>
            </CardContent>
        )}
        
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
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                onClick={data.onQuickAdd}
            >
                <PlusCircle className="h-4 w-4"/>
                <span className="sr-only">Adicionar Tarefa</span>
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
    </div>
  );
}
