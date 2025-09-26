
"use client";

import type { MessageTemplate } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Link, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplatePreviewModalProps = {
    template: MessageTemplate | null;
    isOpen: boolean;
    onClose: () => void;
};

export function TemplatePreviewModal({ template, isOpen, onClose }: TemplatePreviewModalProps) {
    if (!template) return null;

    const header = template.components.find(c => c.type === 'HEADER');
    const body = template.components.find(c => c.type === 'BODY');
    const footer = template.components.find(c => c.type === 'FOOTER');
    const buttons = template.components.find(c => c.type === 'BUTTONS');
    
    const formatText = (text: string = "") => {
        const parts = text.split(/(\{\{\d+\}\})/g);
        return parts.map((part, index) => {
            if (part.match(/(\{\{\d+\}\})/)) {
                return <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-xs p-1 rounded">{part}</span>;
            }
            return part;
        });
    };

    const getButtonIcon = (type: string) => {
        switch(type) {
            case 'URL': return <Link className="mr-2 h-4 w-4" />;
            case 'PHONE_NUMBER': return <Phone className="mr-2 h-4 w-4" />;
            case 'QUICK_REPLY':
            default:
                return <MessageSquare className="mr-2 h-4 w-4" />;
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Preview: {template.name}</DialogTitle>
                    <DialogDescription>
                        Esta é uma simulação de como seu template será exibido no WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="bg-muted/50 p-4 rounded-lg flex justify-center">
                    <div className="w-full max-w-sm bg-background rounded-2xl border shadow-lg p-3 space-y-2">
                        {/* Header */}
                        {header?.format === 'IMAGE' && <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center text-muted-foreground text-sm"><span>[Imagem]</span></div>}
                        {header?.format === 'VIDEO' && <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center text-muted-foreground text-sm"><span>[Vídeo]</span></div>}
                        {header?.format === 'DOCUMENT' && <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center text-muted-foreground text-sm"><span>[Documento]</span></div>}
                        
                        <div className={cn("p-2", header?.format !== 'TEXT' && '-mt-2')}>
                            {header?.format === 'TEXT' && header.text && <p className="font-bold">{formatText(header.text)}</p>}

                            {/* Body */}
                            {body?.text && <p className="text-sm whitespace-pre-wrap">{formatText(body.text)}</p>}

                            {/* Footer */}
                            {footer?.text && <p className="text-xs text-muted-foreground pt-1">{formatText(footer.text)}</p>}
                        </div>
                        
                         {/* Buttons */}
                        {buttons && buttons.buttons && buttons.buttons.length > 0 && (
                            <div className="pt-2 border-t mt-2 space-y-1">
                                {buttons.buttons.map((button, index) => (
                                    <Button key={index} variant="outline" size="sm" className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/50">
                                        {getButtonIcon(button.type)}
                                        {button.text}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
