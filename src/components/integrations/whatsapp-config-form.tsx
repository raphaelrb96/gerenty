
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { Company, WhatsAppIntegration } from "@/lib/types";
import { saveWhatsAppCredentials, getWhatsAppIntegration } from "@/services/integration-service";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Copy, CheckCircle, AlertCircle, XCircle, Info, TestTube2 } from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  wabaId: z.string().min(10, "ID da Conta do WhatsApp Business é obrigatório."),
  phoneId: z.string().min(10, "ID do Telefone é obrigatório."),
  accessToken: z.string().min(20, "Token de Acesso é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

export function WhatsAppConfigForm({ company }: { company: Company }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { wabaId: "", phoneId: "", accessToken: "" },
  });

  useEffect(() => {
    // Real-time listener for integration status
    const unsub = onSnapshot(doc(db, `companies/${company.id}/integrations`, "whatsapp"), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as WhatsAppIntegration;
            setIntegration(data);
            form.reset({
                wabaId: data.wabaId,
                phoneId: data.phoneId,
                accessToken: "******************" // Mask saved token
            });
        } else {
            setIntegration(null);
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
        return { icon: <AlertCircle className="h-5 w-5 text-destructive" />, title: "Erro na Conexão", description: integration.lastError || "Verifique suas credenciais e tente novamente.", variant: "destructive" as const };
      default:
        return { icon: <XCircle className="h-5 w-5 text-destructive" />, title: "Desconectado", description: "A integração não está ativa.", variant: "destructive" as const };
    }
  };

  const statusContent = getStatusContent();

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
        await saveWhatsAppCredentials(company.id, values);
        toast({ title: "Credenciais salvas com sucesso!", description: "Tentando validar a conexão..." });
    } catch (error) {
        console.error("Error saving credentials:", error);
        toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar as credenciais." });
    } finally {
        setIsLoading(false);
    }
  };
  
   const handleTestConnection = () => {
      toast({ title: "Função de teste ainda não implementada." });
      // Here you would call a cloud function like `sendTestMessage(company.id)`
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
                <CardTitle className="flex items-center gap-2"><Info /> Instruções e Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Para conectar o Gerenty ao WhatsApp, você precisa de uma conta na <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary underline">API Cloud da Meta</a>.</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Acesse o painel de desenvolvedores da Meta e selecione seu aplicativo.</li>
                    <li>No menu lateral, vá para "WhatsApp" &gt; "Configuração da API".</li>
                    <li>Copie o "ID do número de telefone" e o "ID da conta do WhatsApp Business" e cole-os nos campos abaixo.</li>
                    <li>Gere um "Token de acesso temporário" e cole-o no campo correspondente. (Para produção, use um Token de Acesso Permanente).</li>
                    <li>Na seção "Webhook", clique em "Editar". Cole a URL abaixo e insira o Token de Verificação.</li>
                </ol>
                <div className="space-y-2 pt-2">
                    <Label htmlFor="webhook-url">Sua URL de Webhook</Label>
                    <div className="flex gap-2">
                        <Input id="webhook-url" value={integration?.webhookUrl || "Salve as credenciais para gerar"} readOnly />
                        <Button type="button" size="icon" onClick={() => copyToClipboard(integration?.webhookUrl || "")} disabled={!integration?.webhookUrl}><Copy className="h-4 w-4" /></Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="webhook-token">Seu Token de Verificação do Webhook</Label>
                    <div className="flex gap-2">
                        <Input id="webhook-token" value={integration?.webhookVerifyToken || "Salve as credenciais para gerar"} readOnly />
                        <Button type="button" size="icon" onClick={() => copyToClipboard(integration?.webhookVerifyToken || "")} disabled={!integration?.webhookVerifyToken}><Copy className="h-4 w-4" /></Button>
                    </div>
                </div>
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
                        <FormField control={form.control} name="wabaId" render={({ field }) => (<FormItem><FormLabel>ID da Conta do WhatsApp Business</FormLabel><FormControl><Input placeholder="109876543210987" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="phoneId" render={({ field }) => (<FormItem><FormLabel>ID do Telefone</FormLabel><FormControl><Input placeholder="123456789012345" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="accessToken" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Token de Acesso</FormLabel>
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
                         <Button type="button" variant="outline" onClick={handleTestConnection} disabled={integration?.status !== 'connected'}>
                            <TestTube2 className="mr-2 h-4 w-4" />
                            Testar Conexão
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
