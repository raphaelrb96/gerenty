
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle } from "lucide-react";

export default function AutomationPage() {

  const templates = [
    { name: 'confirmacao_pedido', category: 'utility', status: 'approved' },
    { name: 'atualizacao_envio', category: 'utility', status: 'approved' },
    { name: 'carrinho_abandonado', category: 'marketing', status: 'approved' },
    { name: 'pesquisa_satisfacao', category: 'marketing', status: 'pending' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Automação e Modelos"
        description="Crie fluxos de trabalho e gerencie seus modelos de mensagem do WhatsApp."
      />

      <Card>
        <CardHeader>
          <CardTitle>Construtor de Regras</CardTitle>
          <CardDescription>Crie regras no formato "Se (gatilho), então (ação)" para automatizar tarefas.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground py-8">Funcionalidade do construtor de regras em breve.</p>
        </CardContent>
        <CardFooter>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Regra de Automação
            </Button>
        </CardFooter>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Biblioteca de Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
                <Card key={template.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            {template.name}
                        </CardTitle>
                        <CardDescription>
                           Categoria: <span className="capitalize">{template.category}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                           Pré-visualização do template em breve.
                        </p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" disabled>
                           Ver Detalhes
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>

    </div>
  );
}
