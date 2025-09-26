
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { addRule } from "@/services/rule-service";
import type { MessageTemplate } from "@/lib/types";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
import { getTemplatesByCompany } from "@/services/template-service";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Zap, MessageSquare } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "O nome da regra é obrigatório."),
  trigger: z.string().min(1, "É obrigatório selecionar um gatilho."),
  action: z.string().min(1, "É obrigatório selecionar uma ação."),
  templateId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const triggers = [
    { value: "order.created", label: "Pedido Criado" },
    { value: "order.paid", label: "Pedido Pago" },
    { value: "order.shipped", label: "Pedido Enviado" },
    { value: "customer.created", label: "Novo Cliente Cadastrado" },
];

const actions = [
    { value: "sendMessage", label: "Enviar Template de Mensagem" },
];


export function RuleBuilderForm() {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const { effectiveOwnerId } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [templates, setTemplates] = React.useState<MessageTemplate[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", trigger: "", action: "", templateId: "" },
  });

  const watchedAction = form.watch("action");

  React.useEffect(() => {
    if (activeCompany) {
      getTemplatesByCompany(activeCompany.id).then(setTemplates);
    }
  }, [activeCompany]);

  const onSubmit = async (values: FormValues) => {
    if (!activeCompany || !effectiveOwnerId) {
      toast({ variant: 'destructive', title: 'Nenhuma empresa selecionada.' });
      return;
    }
    
    if (values.action === 'sendMessage' && !values.templateId) {
        toast({ variant: 'destructive', title: 'Template obrigatório', description: 'Selecione um template para a ação de enviar mensagem.' });
        return;
    }
    
    setIsSaving(true);
    try {
        const ruleData = {
            companyId: activeCompany.id,
            ownerId: effectiveOwnerId,
            name: values.name,
            trigger: values.trigger,
            action: values.action,
            templateId: values.templateId,
            isActive: true,
        };

        await addRule(ruleData);
        toast({ title: "Regra de automação criada com sucesso!" });
        router.push("/dashboard/automation");
      
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({ variant: "destructive", title: "Erro ao salvar regra." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração da Regra</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Regra</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Boas-vindas para novos clientes" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> SE (Gatilho)</CardTitle>
                    <CardDescription>Escolha o evento que irá iniciar esta automação.</CardDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="trigger"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quando isto acontecer...</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um gatilho..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {triggers.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-500" /> ENTÃO (Ação)</CardTitle>
                    <CardDescription>Escolha o que deve acontecer quando o gatilho for disparado.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Execute esta ação...</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma ação..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {actions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {watchedAction === 'sendMessage' && (
                        <FormField
                            control={form.control}
                            name="templateId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selecione o Template</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Escolha um template de mensagem..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.language.toUpperCase()})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                 </CardContent>
            </Card>

            <CardFooter className="flex justify-end gap-2 p-0 pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Regra
                </Button>
            </CardFooter>
        </div>
      </form>
    </Form>
  );
}
