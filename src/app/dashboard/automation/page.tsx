

"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle, LayoutGrid, Building, Library, Workflow, Pencil, MoreVertical, Trash2 } from "lucide-react";
import type { MessageTemplate, LibraryMessage, AutomationRule, Flow } from "@/lib/types";
import { getTemplatesByCompany, deleteTemplate } from "@/services/template-service";
import { getLibraryMessagesByCompany, deleteLibraryMessage } from "@/services/library-message-service";
import { getFlowsByCompany, deleteFlow } from "@/services/flow-service";
import { useCompany } from "@/context/company-context";
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
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseLibraryForm } from "@/components/automation/response-library-form";
import { ResponseCard } from "@/components/automation/response-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function AutomationRulesTab() {
    const [rules, setRules] = useState<AutomationRule[]>([]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Construtor de Regras de Automação</CardTitle>
                <CardDescription>Crie regras no formato "Se (gatilho), então (ação)" para automatizar tarefas.</CardDescription>
            </CardHeader>
            <CardContent>
                {rules.length === 0 ? (
                    <EmptyState
                        icon={<Bot className="h-16 w-16" />}
                        title="Nenhuma regra de automação criada"
                        description="Comece a automatizar suas tarefas criando sua primeira regra."
                        action={<Button asChild><Link href="/dashboard/automation/rules/new"><PlusCircle className="mr-2 h-4 w-4" />Criar Primeira Regra</Link></Button>}
                    />
                ) : (
                    <div>{/* Placeholder for rules list */}</div>
                )}
            </CardContent>
             <CardFooter>
                <Button asChild>
                    <Link href="/dashboard/automation/rules/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Regra de Automação
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function FlowBuilderTab() {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);

    const fetchFlows = () => {
        if (activeCompany) {
            setLoading(true);
            getFlowsByCompany(activeCompany.id)
                .then(setFlows)
                .catch(() => toast({ variant: "destructive", title: "Erro ao buscar fluxos" }))
                .finally(() => setLoading(false));
        }
    }
    
    useEffect(() => {
        fetchFlows();
    }, [activeCompany, toast]);

    const handleDeleteFlow = async () => {
        if (!flowToDelete) return;
        try {
            await deleteFlow(flowToDelete.id);
            toast({ title: "Fluxo excluído com sucesso!" });
            fetchFlows(); // Refresh list
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir fluxo." });
        } finally {
            setFlowToDelete(null);
        }
    };
    
    if (loading) return <LoadingSpinner />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fluxos de Conversa</CardTitle>
                <CardDescription>Crie e gerencie fluxos de conversa interativos para o WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
                 {flows.length === 0 ? (
                    <EmptyState
                        icon={<Workflow className="h-16 w-16" />}
                        title="Nenhum fluxo de conversa criado"
                        description="Automatize o atendimento ao cliente criando fluxos de conversa baseados em palavras-chave."
                        action={<Button asChild><Link href="/dashboard/automation/flows/new"><PlusCircle className="mr-2 h-4 w-4" />Criar Primeiro Fluxo</Link></Button>}
                    />
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flows.map(flow => (
                            <Card key={flow.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{flow.name}</CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild><Link href={`/dashboard/automation/flows/edit/${flow.id}`}><Pencil className="mr-2 h-4 w-4" />Editar</Link></DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setFlowToDelete(flow)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription>Status: {flow.status}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">
                                        Última atualização: {flow.updatedAt ? new Date(flow.updatedAt as any).toLocaleDateString() : 'N/A'}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full" variant="outline">
                                        <Link href={`/dashboard/automation/flows/edit/${flow.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar Fluxo
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                     </div>
                 )}
            </CardContent>
            <CardFooter>
                <Button asChild>
                    <Link href="/dashboard/automation/flows/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Fluxo de Conversa
                    </Link>
                </Button>
            </CardFooter>

            <AlertDialog open={!!flowToDelete} onOpenChange={() => setFlowToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Fluxo?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Tem certeza de que deseja excluir o fluxo "{flowToDelete?.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFlow} className="bg-destructive hover:bg-destructive/90">
                           Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}


function TemplatesTab() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<MessageTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);

  const fetchTemplates = async () => {
    if (activeCompany) {
      setLoading(true);
      try {
        const companyTemplates = await getTemplatesByCompany(activeCompany.id);
        setTemplates(companyTemplates);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao buscar templates" });
      } finally {
        setLoading(false);
      }
    } else {
      setTemplates([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeCompany]);

  const handleOpenForm = (template: MessageTemplate | null = null) => {
    setTemplateToEdit(template);
    setIsFormOpen(true);
  }

  const handleDelete = async () => {
    if (!templateToDelete || !activeCompany) return;
    try {
        await deleteTemplate(activeCompany.id, templateToDelete.id);
        toast({ title: "Template excluído com sucesso!" });
        fetchTemplates();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao excluir template" });
    } finally {
        setTemplateToDelete(null);
    }
  }
  
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-headline">Biblioteca de Templates</h2>
                <Button variant="outline" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Template
                </Button>
            </div>
            
            {templates.length === 0 ? (
                <EmptyState
                    icon={<LayoutGrid className="h-16 w-16" />}
                    title="Nenhum template encontrado"
                    description="Comece criando seus modelos de mensagem para iniciar conversas com clientes."
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
    )
}

function LibraryTab() {
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const [messages, setMessages] = useState<LibraryMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [messageToEdit, setMessageToEdit] = useState<LibraryMessage | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<LibraryMessage | null>(null);

    const fetchMessages = async () => {
        if (activeCompany) {
            setLoading(true);
            try {
                const companyMessages = await getLibraryMessagesByCompany(activeCompany.id);
                setMessages(companyMessages);
            } catch (error) {
                toast({ variant: "destructive", title: "Erro ao buscar respostas" });
            } finally {
                setLoading(false);
            }
        } else {
            setMessages([]);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [activeCompany]);

    const handleOpenForm = (message: LibraryMessage | null = null) => {
        setMessageToEdit(message);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!messageToDelete || !activeCompany) return;
        try {
            await deleteLibraryMessage(activeCompany.id, messageToDelete.id);
            toast({ title: "Resposta excluída com sucesso!" });
            fetchMessages();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir resposta" });
        } finally {
            setMessageToDelete(null);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-headline">Biblioteca de Respostas</h2>
                <Button variant="outline" onClick={() => handleOpenForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Resposta
                </Button>
            </div>
            
             {messages.length === 0 ? (
                <EmptyState
                    icon={<Library className="h-16 w-16" />}
                    title="Nenhuma resposta encontrada"
                    description="Crie respostas rápidas com texto, imagens, vídeos e arquivos para usar em suas automações."
                    action={<Button onClick={() => handleOpenForm(null)}>Criar primeira resposta</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {messages.map(message => (
                        <ResponseCard
                            key={message.id}
                            message={message}
                            onEdit={() => handleOpenForm(message)}
                            onDelete={() => setMessageToDelete(message)}
                        />
                    ))}
                </div>
            )}

            <ResponseLibraryForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onFinished={fetchMessages}
                message={messageToEdit}
            />
            
            <AlertDialog open={!!messageToDelete} onOpenChange={(isOpen) => !isOpen && setMessageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a resposta "{messageToDelete?.name}".
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

function FlowsManagementTab() {
  return (
    <div className="space-y-6 mt-6">
      <FlowBuilderTab />
      <AutomationRulesTab />
      <LibraryTab />
    </div>
  );
}


export default function AutomationPage() {
  const { activeCompany, loading } = useCompany();

  if (loading) {
      return <LoadingSpinner />;
  }

  if (!activeCompany) {
    return (
        <div className="flex items-center justify-center h-full">
            <EmptyState
                icon={<Building className="h-16 w-16" />}
                title="Nenhuma empresa selecionada"
                description="Por favor, selecione uma empresa para gerenciar as automações e templates."
                action={<Button asChild><Link href="/dashboard/companies">Gerenciar Empresas</Link></Button>}
            />
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Automação e Modelos"
        description="Crie fluxos de trabalho, gerencie modelos de mensagem e respostas rápidas."
      />
      
      <Tabs defaultValue="flows">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flows"><Workflow className="mr-2 h-4 w-4" />Fluxos de Conversa</TabsTrigger>
            <TabsTrigger value="templates"><LayoutGrid className="mr-2 h-4 w-4" />Modelos de Mensagem</TabsTrigger>
        </TabsList>
        <TabsContent value="flows">
             <FlowsManagementTab />
        </TabsContent>
        <TabsContent value="templates">
            <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    