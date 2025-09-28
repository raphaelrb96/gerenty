
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

const formSchema = z.object({
  whatsAppBusinessAccountId: z.string().min(10, "ID da Conta do WhatsApp Business é obrigatório."),
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
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        whatsAppBusinessAccountId: "", 
        phoneNumberId: "", 
        accessToken: "",
        metaAppSecret: "" 
    },
  });

  useEffect(() => {
    // Real-time listener for integration status
    const unsub = onSnapshot(doc(db, `companies/${company.id}/integrations`, "whatsapp"), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as WhatsAppIntegration;
            setIntegration(data);
            form.reset({
                whatsAppBusinessAccountId: data.whatsAppBusinessAccountId || "",
                phoneNumberId: data.phoneNumberId || "",
                accessToken: "******************", // Mask saved token
                metaAppSecret: "******************"
            });
        } else {
            setIntegration(null);
            form.reset();
        }
    });
    return () => unsub();
  }, [company.id, form]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência!" });
  };
  
  const getStatusContent = () => {
    if (!integration) {
      return { icon: <XCircle className="h-5 w-5 text-destructive" />, title: "Não Conectado", description: "Insira suas credenciais para começar.", variant: "destructive" as const };
    }
    switch (integration.status) {
      case 'connected':
        return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, title: "Conectado", description: "A integração com o WhatsApp está ativa.", variant: "default" as const };
      case 'error':
        return { icon: <AlertCircle className="h-5 w-5 text-destructive" />, title: "Erro na Conexão", description: integration.error || "Verifique suas credenciais e tente novamente.", variant: "destructive" as const };
      default:
        return { icon: <XCircle className="h-5 w-5 text-destructive" />, title: "Desconectado", description: "A integração não está ativa.", variant: "destructive" as const };
    }
  };

  const statusContent = getStatusContent();

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
        if (!user) throw new Error("Usuário não autenticado.");

        await saveWhatsAppCredentials(values);
        toast({ title: "Credenciais salvas!", description: "Validando a conexão com a API do WhatsApp..." });
    } catch (error: any) {
        console.error("Error saving credentials:", error);
        toast({ variant: "destructive", title: "Erro ao Salvar", description: error.message || "Não foi possível salvar as credenciais." });
    } finally {
        setIsLoading(false);
    }
  };
  
   const handleTestConnection = async () => {
      setIsTesting(true);
      try {
          if (!user) throw new Error("Usuário não autenticado.");
          
          const testPhone = prompt("Digite um número de telefone para teste (formato internacional, ex: 5511999999999):");
          if (!testPhone) {
              setIsTesting(false);
              return;
          }

          const result = await sendTestMessage(testPhone);
          toast({ title: "Teste Enviado!", description: `Mensagem de teste enviada para ${result.recipient}. ID: ${result.messageId}` });

      } catch (error: any) {
          toast({ variant: "destructive", title: "Erro no Teste", description: error.message || "Não foi possível enviar a mensagem de teste." });
      } finally {
          setIsTesting(false);
      }
   }

  return (
    <div className="space-y-6">
        <Alert variant={statusContent.variant}>
            <div className="flex items-center gap-3">
                {statusContent.icon}
                <div>
                    <AlertTitle>{statusContent.title}</AlertTitle>
                    <AlertDescription>{statusContent.description}</AlertDescription>
                </div>
            </div>
        </Alert>
    
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> Guia de Configuração Completo</CardTitle>
                <CardDescription>Siga estes passos para obter e configurar suas credenciais da API Cloud do WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-0">
                        <AccordionTrigger>Visão Geral e Pré-requisitos</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-muted-foreground pt-2">
                             <p>A API Cloud do WhatsApp, hospedada pela Meta, permite que empresas de médio e grande porte se comuniquem com clientes em escala.</p>
                             <p className="font-semibold text-foreground">Antes de começar, você precisará de:</p>
                             <ul className="list-disc list-inside space-y-1">
                                <li>Uma conta do Facebook e uma conta no <a href="https://business.facebook.com/overview" target="_blank" rel="noopener noreferrer" className="text-primary underline">Gerenciador de Negócios da Meta</a>.</li>
                                <li>Um número de telefone que não esteja vinculado a outra conta do WhatsApp (pessoal ou Business App).</li>
                             </ul>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Passo 1: Criar um App na Meta for Developers</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-muted-foreground pt-2">
                             <ol className="list-decimal list-inside space-y-2">
                                <li>Acesse o site <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers</a> e faça login.</li>
                                <li>Clique em <strong>"Criar Aplicativo"</strong> (ou "Create App").</li>
                                <li>Selecione o tipo de aplicativo <strong>"Business"</strong> (ou "Empresarial") e clique em "Avançar".</li>
                                <li>Dê um nome ao seu aplicativo (ex: "App de Atendimento Gerenty") e verifique se seu e-mail e conta empresarial estão corretos.</li>
                                <li>Clique em <strong>"Criar Aplicativo"</strong>. Você será redirecionado para o painel do seu novo app.</li>
                             </ol>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-2">
                        <AccordionTrigger>Passo 2: Configurar o produto "WhatsApp"</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-muted-foreground pt-2">
                             <ol className="list-decimal list-inside space-y-2">
                                <li>No painel do seu app, role para baixo até encontrar "WhatsApp" e clique em <strong>"Configurar"</strong>.</li>
                                <li>Na tela seguinte, você precisará vincular sua Conta Empresarial da Meta. Selecione-a no menu suspenso.</li>
                                <li>Clique em <strong>"Continuar"</strong>. O WhatsApp irá criar uma conta de teste para você.</li>
                             </ol>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Passo 3: Obter suas Credenciais</AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground pt-4">
                            <p>Agora, no painel do seu aplicativo Meta, vá para o menu lateral: <strong>WhatsApp {'>'} Configuração da API</strong>. Aqui você encontrará tudo o que precisa:</p>
                             <div className="p-3 border rounded-md">
                                <p className="font-semibold text-foreground">1. ID da Conta do WhatsApp Business</p>
                                <p>Na seção "Enviar e receber mensagens", você verá o campo <strong>"ID da conta do WhatsApp Business"</strong>. Copie este valor.</p>
                            </div>
                            <div className="p-3 border rounded-md">
                                <p className="font-semibold text-foreground">2. ID do Número de Telefone</p>
                                <p>Logo abaixo do campo anterior, você verá o <strong>"ID do número de telefone"</strong>. Copie este valor.</p>
                            </div>
                             <div className="p-3 border rounded-md">
                                <p className="font-semibold text-foreground">3. Token de Acesso</p>
                                <p>Na mesma seção, há um campo chamado <strong>"Token de acesso temporário"</strong>. Copie este token. <strong>Atenção:</strong> Este token expira em 24 horas. Para produção, você deve gerar um <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-accounts#--access-token" target="_blank" rel="noopener noreferrer" className="text-primary underline">token de acesso permanente</a>.</p>
                            </div>
                             <div className="p-3 border rounded-md">
                                <p className="font-semibold text-foreground">4. Meta App Secret (Token de Verificação)</p>
                                <p>No menu lateral esquerdo, vá para <strong>Configurações do aplicativo {'>'} Básico</strong>. Você verá o campo <strong>"Segredo do aplicativo"</strong> (App Secret). Clique em "Mostrar" e copie este valor. Este será o seu token para verificar o webhook.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Passo 4: Configurando o Webhook</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-muted-foreground pt-2">
                            <p>O Webhook permite que o WhatsApp nos envie as mensagens em tempo real.</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Volte para a seção <strong>WhatsApp {'>'} Configuração da API</strong> no painel da Meta.</li>
                                <li>Encontre a seção "Webhooks" e clique em <strong>"Editar"</strong>.</li>
                                <li>No campo "URL de Retorno de Chamada", cole a <strong>URL de Webhook</strong> abaixo.</li>
                                <li>No campo "Token de verificação do webhook", cole o seu <strong>"Meta App Secret"</strong> que você obteve no passo anterior.</li>
                                <li>Clique em <strong>"Verificar e salvar"</strong>.</li>
                                <li>Após salvar, em "Campos de webhook", clique em "Gerenciar" e assine os eventos `messages` e `message_template_status`.</li>
                            </ol>
                            <div className="space-y-2 pt-4">
                                <Label htmlFor="webhook-url">Sua URL de Webhook (clique para copiar)</Label>
                                <div className="flex gap-2">
                                    <Input id="webhook-url" value={integration?.webhookUrl || "Salve as credenciais para gerar"} readOnly className="cursor-pointer" onClick={() => copyToClipboard(integration?.webhookUrl || "")}/>
                                    <Button type="button" size="icon" onClick={() => copyToClipboard(integration?.webhookUrl || "")} disabled={!integration?.webhookUrl}><Copy className="h-4 w-4" /></Button>
                                </div>
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
                        <CardDescription>Insira as informações obtidas no painel da Meta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="whatsAppBusinessAccountId" render={({ field }) => (<FormItem><FormLabel>ID da Conta do WhatsApp Business</FormLabel><FormControl><Input placeholder="109876543210987" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="phoneNumberId" render={({ field }) => (<FormItem><FormLabel>ID do Telefone</FormLabel><FormControl><Input placeholder="123456789012345" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="metaAppSecret" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meta App Secret (Token de Verificação)</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showSecret ? "text" : "password"} placeholder="Seu token secreto do webhook" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowSecret(!showSecret)}>
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="accessToken" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Token de Acesso da API</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showToken ? "text" : "password"} placeholder="EAAD..." {...field} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowToken(!showToken)}>
                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button type="button" variant="outline" onClick={handleTestConnection} disabled={integration?.status !== 'connected' || isTesting}>
                             {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <TestTube2 className="mr-2 h-4 w-4" />
                            Enviar Teste
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar e Validar
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
