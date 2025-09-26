
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle, LayoutGrid } from "lucide-react";
import type { MessageTemplate } from "@/lib/types";
import { getTemplatesByUser, deleteTemplate } from "@/services/template-service";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { TemplateCard } from "@/components/automation/template-card";
import { TemplatePreviewModal } from "@/components/automation/template-preview-modal";
import { EmptyState } from "@/components/common/empty-state";
import { TemplateForm } from "@/components/automation/template-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AutomationPage() {
  const { effectiveOwnerId } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<MessageTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);

  const fetchTemplates = async () => {
    if (effectiveOwnerId) {
      setLoading(true);
      try {
        const userTemplates = await getTemplatesByUser(effectiveOwnerId);
        setTemplates(userTemplates);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao buscar templates" });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [effectiveOwnerId, toast]);

  const handleOpenForm = (template: MessageTemplate | null = null) => {
    setTemplateToEdit(template);
    setIsFormOpen(true);
  }

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
        await deleteTemplate(templateToDelete.id);
        toast({ title: "Template excluído com sucesso!" });
        fetchTemplates();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao excluir template" });
    } finally {
        setTemplateToDelete(null);
    }
  }

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
            <Button variant="outline" onClick={() => handleOpenForm()}>
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
                action={<Button onClick={() => handleOpenForm()}>Criar primeiro template</Button>}
            />
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onViewDetails={() => setSelectedTemplate(template)}
                        onEdit={() => handleOpenForm(template)}
                        onDelete={() => setTemplateToDelete(template)}
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

      <TemplateForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onFinished={fetchTemplates}
        template={templateToEdit}
      />
      
      <AlertDialog open={!!templateToDelete} onOpenChange={(isOpen) => !isOpen && setTemplateToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o template "{templateToDelete?.name}".
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Confirmar Exclusão
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
