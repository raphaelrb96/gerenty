
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle, LayoutGrid } from "lucide-react";
import type { MessageTemplate } from "@/lib/types";
import { getTemplatesByUser } from "@/services/template-service";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { TemplateCard } from "@/components/automation/template-card";
import { TemplatePreviewModal } from "@/components/automation/template-preview-modal";
import { EmptyState } from "@/components/common/empty-state";

export default function AutomationPage() {
  const { effectiveOwnerId } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    if (effectiveOwnerId) {
      const fetchTemplates = async () => {
        setLoading(true);
        try {
          const userTemplates = await getTemplatesByUser(effectiveOwnerId);
          setTemplates(userTemplates);
        } catch (error) {
          toast({ variant: "destructive", title: "Erro ao buscar templates" });
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [effectiveOwnerId, toast]);

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
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-headline">Biblioteca de Templates</h2>
            <Button variant="outline" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Template
            </Button>
        </div>
        
        {loading ? (
            <LoadingSpinner />
        ) : templates.length === 0 ? (
            <EmptyState
                icon={<LayoutGrid className="h-16 w-16" />}
                title="Nenhum template encontrado"
                description="Comece criando seus modelos de mensagem para automatizar a comunicação."
                action={<Button disabled>Criar primeiro template</Button>}
            />
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onViewDetails={() => setSelectedTemplate(template)}
                    />
                ))}
            </div>
        )}
       
      </div>
      
      <TemplatePreviewModal 
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </div>
  );
}
