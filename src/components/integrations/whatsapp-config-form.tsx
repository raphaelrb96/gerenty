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
        if (!integration || integration.status !== 'connected') {
            toast({
                variant: "destructive",
                title: "Integração não configurada",
                description: "Configure e valide a integração primeiro."
            });
            return;
        }

        setIsTesting(true);
        try {
            const testPhone = prompt("Digite um número de telefone para teste (formato internacional, ex: 5511999999999):");

            if (!testPhone) {
                setIsTesting(false);
                return;
            }

            // Validação básica do número
            if (!testPhone.match(/^\d{10,15}$/)) {
                toast({
                    variant: "destructive",
                    title: "Número inválido",
                    description: "Use apenas números no formato internacional (ex: 5511999999999)."
                });
                return;
            }

            const result = await sendTestMessage(company.id, testPhone);

            toast({
                title: "Teste Enviado!",
                description: `Mensagem enviada para ${testPhone}. ID: ${result.messageId}`,
                variant: "default"
            });

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

    const webhookUrl = integration?.webhookUrl || "https://us-central1-your-project.cloudfunctions.net/whatsappWebhookListener/" + company.id;

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
                            onClick={handleTestConnection}
                            disabled={isTesting}
                        >
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <TestTube2 className="mr-2 h-4 w-4" />
                            Testar
                        </Button>
                    )}
                </div>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Guia de Configuração
                    </CardTitle>
                    <CardDescription>
                        Configure a integração com a API Oficial do WhatsApp Business
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Onde encontrar as credenciais</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-3">
                                    <p className="font-semibold">No painel do Meta for Developers:</p>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li><strong>WhatsApp {'>'} Configuração da API</strong> - Encontre o ID da Conta e ID do Telefone</li>
                                        <li><strong>Configurações {'>'} Básico</strong> - Encontre o App Secret</li>
                                        <li><strong>WhatsApp {'>'} Configuração da API</strong> - Token de Acesso</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Configuração do Webhook</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p className="text-muted-foreground">
                                    Após salvar as credenciais, use a URL abaixo para configurar o webhook no painel da Meta:
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="webhook-url">URL do Webhook</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="webhook-url"
                                            value={webhookUrl}
                                            readOnly
                                            className="flex-1 font-mono text-sm"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={() => copyToClipboard(webhookUrl)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        No token de verificação, use o mesmo "Meta App Secret" informado no formulário
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
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
                                                <FormLabel>Meta App Secret</FormLabel>
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
                                                <FormLabel>Token de Acesso</FormLabel>
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
                                disabled={isLoading}
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
