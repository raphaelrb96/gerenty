
"use client";

import type { MessageTemplate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Eye } from "lucide-react";

type TemplateCardProps = {
    template: MessageTemplate;
    onViewDetails: () => void;
};

export function TemplateCard({ template, onViewDetails }: TemplateCardProps) {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-600/20 text-green-700';
            case 'pending': return 'bg-yellow-600/20 text-yellow-700';
            case 'rejected': return 'bg-red-600/20 text-red-700';
            default: return 'bg-gray-500/20 text-gray-700';
        }
    };
    
    const getCategoryVariant = (category: string) => {
        switch (category) {
            case 'marketing': return 'bg-blue-600/20 text-blue-700';
            case 'utility': return 'bg-indigo-600/20 text-indigo-700';
            default: return 'outline';
        }
    }

    const bodyComponent = template.components.find(c => c.type === 'BODY');
    const previewText = bodyComponent?.text?.substring(0, 100) + (bodyComponent?.text && bodyComponent.text.length > 100 ? '...' : '');

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        {template.name}
                    </CardTitle>
                    <Badge variant="secondary" className={getStatusVariant(template.status)}>{template.status}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className={getCategoryVariant(template.category)}>{template.category}</Badge>
                    <Badge variant="outline">{template.language.toUpperCase()}</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md h-full">
                    <p className="italic">{previewText || "Este template não possui um corpo de texto para pré-visualização."}</p>
                </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" className="w-full" onClick={onViewDetails}>
                   <Eye className="mr-2 h-4 w-4" />
                   Ver Detalhes
                </Button>
            </CardFooter>
        </Card>
    );
}
