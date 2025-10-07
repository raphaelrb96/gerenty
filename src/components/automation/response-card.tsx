

"use client";

import type { LibraryMessage } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video, AudioLines, File as FileIcon, MoreVertical, Pencil, Trash2, List } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import React from 'react';

type ResponseCardProps = {
    message: LibraryMessage;
    onEdit: () => void;
    onDelete: () => void;
};

export function ResponseCard({ message, onEdit, onDelete }: ResponseCardProps) {
    
    const contentPreview = () => {
        if (!message.content) {
            return <div className="text-center text-xs p-2 italic text-muted-foreground">Conteúdo não definido</div>;
        }

        switch (message.type) {
            case 'text':
                return <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap text-left">{message.content.text?.body || '[Texto vazio]'}</p>;
            case 'image':
                const imageUrl = message.content.image?.url || message.content.media?.url;
                if (imageUrl) {
                    return (
                        <div className="relative w-full aspect-video">
                            <Image src={imageUrl} alt="Pré-visualização" layout="fill" objectFit="cover" className="rounded-md" />
                        </div>
                    );
                }
                return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><Image className="h-4 w-4" /> <span>Imagem</span></div>;
            case 'video':
                return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><Video className="h-4 w-4" /> <span>Vídeo: {message.content.media?.caption || message.content.media?.filename || 'Arquivo de vídeo'}</span></div>;
            case 'audio':
                if (message.content.media?.url) {
                    return (
                        <div className="p-2 bg-muted rounded-md w-full">
                            <audio controls src={message.content.media.url} className="w-full h-8" />
                        </div>
                    );
                }
                 return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><AudioLines className="h-4 w-4" /> <span>Áudio</span></div>;
            case 'file':
                return <div className="p-2 bg-muted rounded-md text-xs flex items-center gap-2"><FileIcon className="h-4 w-4" /> <span>Documento: {message.content.media?.filename || 'Arquivo'}</span></div>;
            
            case 'interactive':
                const interactive = message.content.interactive;
                if (!interactive) return <p className="text-sm p-2 italic text-muted-foreground">[Mensagem interativa vazia]</p>;

                return (
                    <div className="space-y-2 bg-muted p-2 rounded-md text-left w-full">
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
                             <div className="pt-1">
                                <div className="text-center text-blue-600 bg-background py-1.5 px-2 rounded-md text-xs font-semibold border flex items-center justify-center gap-1">
                                    <List className="h-3 w-3" />
                                    {interactive.action.button}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return <p className="text-sm p-2 italic text-muted-foreground">{`[${message.type?.charAt(0).toUpperCase() + message.type?.slice(1)}]`}</p>;
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{message.name}</CardTitle>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4">
                {contentPreview()}
            </CardContent>
            <CardFooter className="p-2">
                 <Button variant="outline" className="w-full" onClick={onEdit}>
                   <Pencil className="mr-2 h-4 w-4" />
                   Editar
                </Button>
            </CardFooter>
        </Card>
    );
}
