
"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Send, Loader2, AlertCircle } from "lucide-react";
import type { MessageTemplate } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type TemplateMessageSelectorProps = {
    templates: MessageTemplate[];
    onSendTemplate: (templateName: string, type: 'template') => Promise<void>;
    isSending: boolean;
};

export function TemplateMessageSelector({ templates, onSendTemplate, isSending }: TemplateMessageSelectorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");

    if (templates.length === 0) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nenhum Template Encontrado</AlertTitle>
                <AlertDescription>
                    A janela de 24 horas para conversa livre expirou. Você precisa criar e aprovar templates de mensagem no painel da Meta para iniciar uma nova conversa.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um template para enviar..." />
                </SelectTrigger>
                <SelectContent>
                    {templates.map(template => (
                        <SelectItem key={template.id} value={template.name}>
                            {template.name} ({template.language.toUpperCase()})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button 
                size="icon" 
                onClick={() => onSendTemplate(selectedTemplate, 'template')} 
                disabled={isSending || !selectedTemplate}
            >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    );
}
