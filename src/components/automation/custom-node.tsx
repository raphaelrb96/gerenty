

"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Settings, Trash2, Zap, PlusCircle, GitBranch } from 'lucide-react';

export function CustomNode({ data, selected }: NodeProps<{ 
  label: string, 
  customLabel?: string,
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
  onConfigure: () => void,
  onDelete: () => void,
  onQuickAdd: (sourceHandle?: string) => void,
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
  const isMainTrigger = !isDeletable;

  const getVerticalHandlePosition = (index: number) => {
    const headerHeight = 44; 
    const contentPaddingTop = 8;
    const itemHeight = 60; // Adjusted for better spacing
    const itemSpacing = 8;
    const topOffset = headerHeight + contentPaddingTop + (index * (itemHeight + itemSpacing)) + (itemHeight / 2);
    return `${topOffset}px`;
  };

  const hasKeywords = data.triggerKeywords && data.triggerKeywords.length > 0;

  return (
    <div className="relative group">
      {!isMainTrigger && <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" style={{ zIndex: 10 }} />}
      
      {data.type === 'conditional' && (
        <>
            {(data.conditions || []).map((cond: any, index: number) => (
                <Handle
                    key={cond.id}
                    type="source"
                    position={Position.Right}
                    id={cond.id}
                    style={{ top: getVerticalHandlePosition(index), right: '-0.75rem', zIndex: 10 }}
                    className="!bg-cyan-500 !w-3 !h-3"
                />
            ))}
             <Handle
                key="else-handle"
                type="source"
                position={Position.Right}
                id="else"
                style={{ top: getVerticalHandlePosition(data.conditions?.length || 0), right: '-0.75rem', zIndex: 10 }}
                className="!bg-gray-500 !w-3 !h-3"
            />
        </>
      )}
      
      {data.type !== 'conditional' && data.type !== 'keywordTrigger' && (
          <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" style={{ zIndex: 10 }} />
      )}
      
      <Card className={cn(
        "border-t-4 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-xl",
        isMainTrigger ? 'w-[320px]' : 'w-[280px]',
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
        data.color
      )}>
        <CardHeader className="flex flex-row items-center gap-3 p-3 text-card-foreground rounded-t-md">
           <div className="p-1 rounded-md">
            {data.icon}
          </div>
          <CardTitle className="text-sm font-semibold">{data.customLabel || data.label}</CardTitle>
        </CardHeader>
        
        {isMainTrigger && hasKeywords ? (
            <CardContent className="px-3 pb-3 pt-2 text-xs text-muted-foreground space-y-2 min-h-[60px]">
                <div className="text-center p-2 rounded-md bg-muted">
                    <span className="font-semibold text-lg text-foreground">{data.triggerKeywords?.length}</span>
                    <p className="text-xs">Gatilho(s) configurado(s)</p>
                </div>
            </CardContent>
        ) : isMainTrigger && !hasKeywords ? (
            <CardContent className="px-4 pb-4 pt-2 text-center text-muted-foreground min-h-[80px] flex flex-col items-center justify-center">
                <Zap className="h-6 w-6 mb-2 text-yellow-500"/>
                <p className="text-sm font-semibold text-foreground">Gatilho Inicial</p>
                <p className="text-xs text-white">Configure as palavras-chave que iniciam esta conversa clicando no ícone de configurações.</p>
            </CardContent>
        ) : !isMainTrigger && data.type !== 'conditional' ? (
             <CardContent className="px-3 pb-3 pt-2 text-xs text-muted-foreground min-h-[40px]">
              <Badge variant="secondary" className="w-full justify-center truncate">{contentPreview()}</Badge>
            </CardContent>
        ) : data.type === 'conditional' && (
            <CardContent className="px-3 pb-3 pt-2 space-y-2">
                 {(data.conditions || []).map((cond: any, index: number) => (
                    <div key={cond.id} className="text-xs p-2 bg-muted rounded-md flex justify-between items-center relative">
                        <span>Se <strong>{`{{${cond.variable || '...'}}}`}</strong> {cond.operator} <strong>{cond.value || '...'}</strong></span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => data.onQuickAdd(cond.id)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                ))}
                 <div className="text-xs p-3 bg-muted rounded-md flex justify-between items-center relative">
                    <div>
                      <span className="font-semibold">Fluxo Padrão</span>
                      <p className="text-xs text-muted-foreground">(Se nenhuma condição for válida)</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => data.onQuickAdd('else')}><PlusCircle className="h-4 w-4" /></Button>
                </div>
            </CardContent>
        )}
        
        <CardFooter className="p-2 border-t bg-muted/30 flex justify-end gap-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={data.onConfigure}
            >
                <Settings className="h-4 w-4"/>
                <span className="sr-only">Configurar Tarefa</span>
            </Button>
            {data.type !== 'conditional' && data.type !== 'keywordTrigger' && (
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => data.onQuickAdd()}
            >
                <PlusCircle className="h-4 w-4"/>
                <span className="sr-only">Adicionar Tarefa</span>
            </Button>
            )}
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
