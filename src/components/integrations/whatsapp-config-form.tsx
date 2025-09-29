
// src/components/integrations/WhatsAppConfigForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { Company, WhatsAppIntegration } from "@/lib/types";
import { saveWhatsAppCredentials, sendTestMessage } from "@/services/integration-service";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Copy, CheckCircle, AlertCircle, XCircle, Info, TestTube2, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Schema atualizado para corresponder ao back-end
const formSchema = z.object({
    whatsAppBusinessId: z.string().min(10, "ID da Conta do WhatsApp Business é obrigatório."),
    phoneNumberId: z.string().min(10, "ID do Telefone é obrigatório."),
    accessToken: z.string().min(20, "Token de Acesso é obrigatório."),
    metaAppSecret: z.string().min(10, "Meta App Secret é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

export function WhatsAppConfigForm({ company }: { company: Company }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
    const { user } = useAuth();
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testPhoneNumber, setTestPhoneNumber] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            whatsAppBusinessId: "",
            phoneNumberId: "",
            accessToken: "",
            metaAppSecret: ""
        },
    });

    useEffect(() => {
        if (!company?.id) return;

        // Real-time listener para o status da integração
        const unsub = onSnapshot(
            doc(db, 'companies', company.id, 'integrations', 'whatsapp'),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as WhatsAppIntegration;
                    setIntegration(data);

                    // Preenche o formulário apenas com os dados não sensíveis
                    form.reset({
                        whatsAppBusinessId: data.whatsAppId || "",
                        phoneNumberId: data.phoneNumberId || "",
                        // Não preenchemos accessToken e metaAppSecret pois estão no Secret Manager
                        accessToken: "",
                        metaAppSecret: ""
                    });
                } else {
                    setIntegration(null);
                    form.reset({
                        whatsAppBusinessId: "",
                        phoneNumberId: "",
                        accessToken: "",
                        metaAppSecret: ""
                    });
                }
            },
            (error) => {
                console.error("Error listening to integration:", error);
                toast({
                    variant: "destructive",
                    title: "Erro de conexão",
                    description: "Não foi possível carregar os dados da integração."
                });
            }
        );

        return () => unsub();
    }, [company.id, form, toast]);

    useEffect(() => {
        if (integration) {
            setIsEditing(false); // Por padrão, não mostra os campos sensíveis
            form.reset({
                whatsAppBusinessId: integration.whatsAppId || "",
                phoneNumberId: integration.phoneNumberId || "",
                accessToken: "", // Sempre vazio para segurança
                metaAppSecret: "" // Sempre vazio para segurança
            });
        } else {
            setIsEditing(true); // Se não há integração, permite edição completa
            form.reset();
        }
    }, [integration, form]);

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado!",
            description: "URL copiada para a área de transferência."
        });
    };

    const getStatusContent = () => {
        if (!integration) {
            return {
                icon: <XCircle className="h-5 w-5 text-destructive" />,
                title: "Não Configurado",
                description: "Configure as credenciais para conectar com o WhatsApp Business API.",
                variant: "destructive" as const
            };
        }

        switch (integration.status) {
            case 'connected':
                return {
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    title: "Conectado",
                    description: "A integração com o WhatsApp está ativa e funcionando.",
                    variant: "default" as const
                };
            case 'error':
                return {
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
                    title: "Erro na Conexão",
                    description: integration.error || "Erro na integração. Verifique as credenciais.",
                    variant: "destructive" as const
                };
            case 'disconnected':
                return {
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                    title: "Desconectado",
                    description: "A integração foi desconectada.",
                    variant: "destructive" as const
                };
            default:
                return {
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                    title: "Desconhecido",
                    description: "Status desconhecido.",
                    variant: "destructive" as const
                };
        }
    };

    const statusContent = getStatusContent();

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
          const result = await saveWhatsAppCredentials(company.id, values);
          
          toast({ 
            title: "Sucesso!", 
            description: result.message,
            variant: "default"
          });
      
          // Se é uma edição, volta para o modo de visualização
          if (integration) {
            setIsEditing(false);
          }
      
        } catch (error: any) {
          console.error("Error saving credentials:", error);
          toast({ 
            variant: "destructive", 
            title: "Erro ao Salvar", 
            description: error.message || "Não foi possível salvar as credenciais." 
          });
        } finally {
          setIsLoading(false);
        }
      };

    const handleTestConnection = async () => {
        if (!testPhoneNumber) {
             toast({ variant: "destructive", title: "Campo obrigatório", description: "Por favor, insira um número de telefone." });
             return;
        }
        
        // Validação básica do número
        if (!testPhoneNumber.match(/^\d{10,15}$/)) {
            toast({
                variant: "destructive",
                title: "Número inválido",
                description: "Use apenas números no formato internacional (ex: 5511999999999)."
            });
            return;
        }
        
        setIsTesting(true);
        try {
            const result = await sendTestMessage(company.id, testPhoneNumber);
            toast({
                title: "Teste Enviado!",
                description: `Mensagem enviada para ${testPhoneNumber}. ID: ${result.messageId}`,
                variant: "default"
            });
            setIsTestModalOpen(false); // Fecha o modal em caso de sucesso
            setTestPhoneNumber(""); // Limpa o campo
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no Teste",
                description: error.message || "Não foi possível enviar a mensagem de teste."
            });
        } finally {
            setIsTesting(false);
        }
    };
    
    const webhookUrl = integration?.webhookUrl;

    return (
        <div className="space-y-6">
            <Alert variant={statusContent.variant}>
                <div className="flex items-center gap-3">
                    {statusContent.icon}
                    <div className="flex-1">
                        <AlertTitle>{statusContent.title}</AlertTitle>
                        <AlertDescription>{statusContent.description}</AlertDescription>
                    </div>
                    {integration?.status === 'connected' && (
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTestModalOpen(true)}
                            disabled={isTesting}
                        >
                            <TestTube2 className="mr-2 h-4 w-4" />
                            Testar
                        </Button>
                    )}
                </div>
            </Alert>
            
            <AlertDialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enviar Mensagem de Teste</AlertDialogTitle>
                        <AlertDialogDescription>
                            Digite um número de telefone completo com código do país para enviar uma mensagem de teste do modelo 'hello_world'.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="test-phone-number">Número de Telefone</Label>
                        <Input 
                            id="test-phone-number" 
                            placeholder="Ex: 5511999999999"
                            value={testPhoneNumber}
                            onChange={(e) => setTestPhoneNumber(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTestConnection} disabled={isTesting}>
                             {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Enviar Teste
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Guia Completo de Configuração
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Passo 1: Criar sua Conta de Negócios</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Para usar a API do WhatsApp, você precisa de uma Conta de Negócios da Meta (antigo Facebook). Se você já tem uma, pode pular para o próximo passo.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Acesse o <a href="https://business.facebook.com/overview" target="_blank" rel="noopener noreferrer" className="text-primary underline">Gerenciador de Negócios da Meta <ExternalLink className="inline h-3 w-3"/></a>.</li>
                                    <li>Clique em "Criar conta" e siga as instruções para configurar sua empresa.</li>
                                    <li>É crucial que sua empresa seja verificada pela Meta para ter acesso completo aos recursos da API.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Passo 2: Criar um Aplicativo de Desenvolvedor</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Toda a comunicação com o WhatsApp é feita através de um "Aplicativo" no painel de desenvolvedores da Meta.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Vá para <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers <ExternalLink className="inline h-3 w-3"/></a> e faça login.</li>
                                    <li>Clique em "Criar aplicativo" e selecione o tipo "Negócios".</li>
                                    <li>Dê um nome para seu aplicativo (ex: "Atendimento Gerenty") e associe-o à sua Conta de Negócios criada no Passo 1.</li>
                                    <li>Dentro do painel do seu novo aplicativo, encontre o produto "WhatsApp" e clique em "Configurar".</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        
                         <AccordionItem value="item-3">
                            <AccordionTrigger>Passo 3: Configurar um Número de Telefone</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Agora você precisa adicionar um número de telefone que será usado para enviar e receber mensagens.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>No painel do seu aplicativo, vá para a seção <span className="font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API</span>.</li>
                                    <li>Você pode usar um número de teste fornecido pela Meta para desenvolvimento ou clicar em "Adicionar número de telefone" para registrar um número seu.</li>
                                    <li><strong>Importante:</strong> O número que você registrar não pode estar sendo usado em uma conta normal ou Business do WhatsApp no seu celular. Ele será dedicado à API.</li>
                                    <li>Siga os passos de verificação do número por SMS ou chamada de voz.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Passo 4: Obter suas Credenciais</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Com tudo configurado, agora você precisa copiar as credenciais e colá-las no formulário abaixo.</p>
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li><b>ID da Conta do WhatsApp Business:</b> Na tela <span className="font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API</span>, você encontrará este ID no topo.</li>
                                    <li><b>ID do Número de Telefone:</b> Na mesma tela, na seção "Enviar e receber mensagens", copie o ID do número de telefone que você configurou.</li>
                                    <li><b>Token de Acesso Permanente:</b> Na mesma seção, clique em "Gerar token". <strong>Importante:</strong> Você deve gerar um token de acesso permanente, pois o token temporário expira em 24 horas.</li>
                                    <li><b>Meta App Secret (Segredo do Aplicativo):</b> No menu lateral esquerdo, vá para <span className="font-mono text-xs bg-muted p-1 rounded">Configurações do aplicativo {'>'} Básico</span>. Clique em "Mostrar" ao lado de "Segredo do Aplicativo" e copie o valor.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger>Passo 5: Configurar o Webhook</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p className="text-muted-foreground">O Webhook é o "endereço" para onde o WhatsApp enviará as mensagens que seus clientes mandarem.</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Primeiro, preencha e salve as 4 credenciais do passo anterior neste formulário. A URL do Webhook será gerada automaticamente.</li>
                                    <li>Volte ao painel da Meta, em <span className="font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API</span> e clique em "Editar" na seção de Webhooks.</li>
                                    <li>Cole a URL de Webhook fornecida abaixo no campo "URL de Retorno de Chamada".</li>
                                    <li>No campo "Token de Verificação", cole o seu <strong>Meta App Secret</strong> (a mesma credencial do campo "Segredo do Aplicativo" deste formulário).</li>
                                    <li>Clique em "Verificar e Salvar". Se tudo estiver correto, uma mensagem de sucesso aparecerá.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>URL de Webhook</CardTitle>
                    <CardDescription>Use esta URL no painel da Meta para receber mensagens.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input id="webhook-url" value={webhookUrl || 'Salve as credenciais para gerar a URL'} readOnly className="flex-1 font-mono text-sm" />
                        <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(webhookUrl || '')} disabled={!webhookUrl}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Credenciais da API</CardTitle>
                            <CardDescription>
                                Insira as credenciais obtidas no painel da Meta for Developers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Campos sempre visíveis */}
                            <FormField
                                control={form.control}
                                name="whatsAppBusinessId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID da Conta do WhatsApp Business</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456789012345"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phoneNumberId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID do Número de Telefone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456789012345"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Botão para mostrar/ocultar campos sensíveis */}
                            {integration && !isEditing && (
                                <Alert>
                                    <AlertDescription className="flex items-center justify-between">
                                        <span>Credenciais sensíveis estão ocultas por segurança</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Alterar Credenciais
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Campos sensíveis - mostrados apenas quando editando */}
                            {(isEditing || !integration) && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="metaAppSecret"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta App Secret (Segredo do Aplicativo)</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showSecret ? "text" : "password"}
                                                            placeholder="abc123def456..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                        onClick={() => setShowSecret(!showSecret)}
                                                    >
                                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="accessToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Token de Acesso Permanente</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showToken ? "text" : "password"}
                                                            placeholder="EAAD..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-4">
                            <div className="flex gap-2">
                                {isEditing && integration && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || (integration && !isEditing)}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {integration ? (isEditing ? 'Atualizar Credenciais' : 'Credenciais Salvas') : 'Salvar Credenciais'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
