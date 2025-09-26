

"use client";

import type { LibraryMessage } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video, AudioLines, File, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type ResponseCardProps = {
    message: LibraryMessage;
    onEdit: () => void;
    onDelete: () => void;
};

export function ResponseCard({ message, onEdit, onDelete }: ResponseCardProps) {
    const getIcon = () => {
        switch (message.type) {
            case 'text': return <FileText className="h-8 w-8 text-primary" />;
            case 'image': return <Image className="h-8 w-8 text-primary" />;
            case 'video': return <Video className="h-8 w-8 text-primary" />;
            case 'audio': return <AudioLines className="h-8 w-8 text-primary" />;
            case 'file': return <File className="h-8 w-8 text-primary" />;
            default: return <FileText className="h-8 w-8 text-primary" />;
        }
    };

    const contentPreview = () => {
        if (message.type === 'text' && message.content.text) {
            return message.content.text.body.substring(0, 100) + (message.content.text.body.length > 100 ? '...' : '');
        }
        if (message.content.media?.url) {
            return message.content.media.url.split('/').pop()?.split('?')[0] || 'Arquivo de mídia';
        }
        return 'Conteúdo multimídia';
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
                <div className="mb-4">{getIcon()}</div>
                <p className="text-sm text-muted-foreground break-all italic">"{contentPreview()}"</p>
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

    