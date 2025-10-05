

"use client";

import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Pencil, Settings, Trash2, Zap, PlusCircle, GitBranch, MessageSquare, Video, File, Music, List, MessageCircle as MessageIcon } from 'lucide-react';
import { LibraryMessage } from '@/lib/types';
import React from 'react';
import Image from 'next/image';

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
  libraryMessages: LibraryMessage[],
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
    const message = data.libraryMessages?.find(m => m.id === data.messageId);
    
    if (data.type === 'delay') {
        return <p className="p-2 text-center text-lg font-bold">{data.delaySeconds || 0}s</p>;
    }

    if (!message) {
      return <div className="text-center text-xs p-2 italic text-muted-foreground">Nenhuma mensagem selecionada</div>;
    }

    switch (message.type) {
        case 'text':
            return <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{message.content.text?.body || '[Texto vazio]'}</p>;
        case 'image':
            const imageUrl = message.content.image?.url || message.content.media?.url;
            if (imageUrl) {
                return (
                    <div className="flex justify-center p-2">
                         <div className="relative w-32 h-32">
                            <Image src={imageUrl} alt="Pré-visualização da imagem" layout="fill" objectFit="cover" className="rounded-md" />
                        </div>
                    </div>
                );
            }
            return <p className="text-sm p-2 italic text-muted-foreground">[Imagem sem URL]</p>;
        case 'video':
            return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><Video className="h-4 w-4" /> <span>Vídeo: {message.content.media?.caption || message.content.media?.filename || 'Arquivo de vídeo'}</span></div>;
        case 'audio':
            if (message.content.media?.url) {
                return (
                    <div className="p-2 bg-muted rounded-md">
                        <audio controls className="w-full h-8">
                            <source src={message.content.media.url} type={message.content.media.mime_type} />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                );
            }
            return <p className="text-sm p-2 italic text-muted-foreground">[Áudio sem URL]</p>;
        case 'file':
             return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><File className="h-4 w-4" /> <span>Documento: {message.content.media?.filename || 'Arquivo'}</span></div>;
        
        case 'interactive':
            const interactive = message.content.interactive;
            if (!interactive) return <p className="text-sm p-2 italic text-muted-foreground">[Mensagem interativa vazia]</p>;

            return (
                 <div className="space-y-2 bg-muted p-2 rounded-md">
                    {interactive.header?.text && <p className="text-xs font-bold border-b pb-1 mb-1">{interactive.header.text}</p>}
                    <p className="text-xs">{interactive.body.text}</p>
                    {interactive.footer?.text && <p className="text-xs text-muted-foreground pt-1 border-t mt-1">{interactive.footer.text}</p>}
                    
                    {interactive.action?.buttons && (
                        <div className="flex flex-col gap-1 pt-1">
                           {interactive.action.buttons.map(button => (
                               <div key={button.reply.id} className="text-center text-blue-600 bg-background py-1 px-2 rounded-md text-xs border">
                                   {button.reply.title}
                               </div>
                           ))}
                        </div>
                    )}
                     {interactive.action?.sections && (
                        <div className="pt-1 space-y-2">
                             <div className="text-center text-blue-600 bg-background py-1.5 px-2 rounded-md text-xs font-semibold border flex items-center justify-center gap-1">
                                <List className="h-3 w-3" />
                                {interactive.action.button}
                            </div>
                            {interactive.action.sections.map((section, sIndex) => (
                                <div key={sIndex}>
                                    {section.title && <p className="text-xs font-semibold uppercase text-muted-foreground">{section.title}</p>}
                                    {section.rows?.map((row, rIndex) => (
                                        <div key={rIndex} className="text-xs py-1.5 border-b last:border-b-0">
                                            <p className="font-medium">{row.title}</p>
                                            {row.description && <p className="text-muted-foreground">{row.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );

        default:
             return <p className="text-sm p-2 italic text-muted-foreground">{`[${message.type.charAt(0).toUpperCase() + message.type.slice(1)}]`}</p>;
    }
  };
  
  const isDeletable = data.isDeletable !== false;
  const isTriggerType = data.type === 'keywordTrigger' || data.type === 'waitForResponse';

  const getVerticalHandlePosition = (index: number) => {
    const headerHeight = 44; 
    const contentPaddingTop = 8;
    const itemHeight = 60; // Adjusted for better spacing
    const itemSpacing = 8;
    const topOffset = headerHeight + contentPaddingTop + (index * (itemHeight + itemSpacing)) + (itemHeight / 2);
    return `${topOffset}px`;
  };

  const hasKeywords = data.triggerKeywords && data.triggerKeywords.length > 0;
  
  const colorClass = (data.color || 'text-gray-500').replace('text-', 'bg-').replace('-500', '-500/20');


  return (
    <div className="relative group">
      {!isTriggerType && <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" style={{ zIndex: 10 }} />}
      
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
      
      {(data.type !== 'conditional' && data.type !== 'endFlow') && (
          <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" style={{ zIndex: 10 }} />
      )}
      
      <Card 
        className={cn(
            "bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-xl w-[280px]",
            isTriggerType && 'w-[320px] !border-4 bg-yellow-500/10',
            isTriggerType && !selected && 'animate-pulse-glow',
            isTriggerType && selected && 'animate-pulse-glow-strong',
            selected && 'ring-2 ring-white ring-offset-2 !border-transparent'
        )} 
        style={{ borderColor: isTriggerType ? 'hsl(40 50% 50% / 0.4)' : (selected ? undefined : data.color) }}
    >
        <CardHeader className={cn("flex flex-row items-center gap-3 p-3 text-card-foreground rounded-t-lg border-t-4", !isTriggerType && 'border-t-transparent')} style={{ borderColor: isTriggerType ? 'transparent' : data.color }}>
           <div className={cn("p-1 rounded-md", colorClass)}>
            {React.cloneElement(data.icon as React.ReactElement, {
                className: cn((data.icon as React.ReactElement).props.className, data.color),
            })}
          </div>
          <CardTitle className={cn("font-semibold text-sm", data.color)}>
              {data.customLabel || data.label}
          </CardTitle>
          {isTriggerType && (
              <Badge variant="outline" className="absolute top-2 right-2 text-xs font-bold text-yellow-500 border-yellow-500 animate-blink">INPUT</Badge>
          )}
        </CardHeader>
        
        {isTriggerType ? (
             <CardContent className="px-4 pb-4 pt-2 text-center text-muted-foreground min-h-[80px] flex flex-col items-center justify-center">
                {hasKeywords ? (
                    <div className="space-y-2 text-left w-full">
                        <span className="font-medium mr-2 text-foreground mb-1 block">Gatilhos:</span>
                        {data.triggerKeywords?.map((kw, index) =>
                            <div key={index} className="flex justify-between items-center text-xs">
                                <Badge variant="secondary">{kw.value}</Badge>
                                <Badge variant="outline">{getMatchTypeLabel(kw.matchType)}</Badge>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                         <p className="text-sm font-semibold text-foreground">Configure os gatilhos</p>
                         <p className="text-xs">Use o ícone de configurações para definir as palavras-chave que iniciam a conversa.</p>
                    </>
                )}
            </CardContent>
        ) : data.type !== 'conditional' && data.type !== 'endFlow' ? (
             <CardContent className="px-3 pb-3 pt-2 text-xs text-muted-foreground min-h-[40px]">
              {contentPreview()}
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
                <Pencil className="h-4 w-4"/>
                <span className="sr-only">Configurar Tarefa</span>
            </Button>
            {data.type !== 'conditional' && data.type !== 'endFlow' && (
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
