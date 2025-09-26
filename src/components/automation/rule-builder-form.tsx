
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Zap, MessageSquare, PlusCircle, Trash2, Filter } from "lucide-react";
import { Separator } from "../ui/separator";

const conditionSchema = z.object({
    field: z.string().min(1),
    operator: z.enum(['==', '!=', '>', '<', 'contains', 'not-contains']),
    value: z.string().min(1),
});

const formSchema = z.object({
  name: z.string().min(2, "O nome da regra é obrigatório."),
  trigger: z.string().min(1, "É obrigatório selecionar um gatilho."),
  conditions: z.array(conditionSchema).optional(),
  action: z.string().min(1, "É obrigatório selecionar uma ação."),
  templateId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const triggers = [
    // Pedidos
    { value: "order.created", label: "Pedido Criado" },
    { value: "order.paid", label: "Pedido Pago (Pagamento Aprovado)" },
    { value: "order.status.updated", label: "Status do Pedido Atualizado" },
    { value: "order.shipped", label: "Pedido Enviado" },
    { value: "order.cancelled", label: "Pedido Cancelado" },
    // CRM
    { value: "customer.created", label: "Novo Cliente Cadastrado" },
    { value: "customer.tag.added", label: "Tag Adicionada ao Cliente" },
    { value: "customer.tag.removed", label: "Tag Removida do Cliente" },
    { value: "cart.abandoned", label: "Carrinho Abandonado" },
    // Financeiro
    { value: "payment.received", label: "Pagamento Recebido" },
];

const actions = [
    // Comunicação
    { value: "sendMessage", label: "Enviar Mensagem (WhatsApp)" },
    // CRM
    { value: "addTag", label: "Adicionar Tag ao Cliente" },
    { value: "removeTag", label: "Remover Tag do Cliente" },
    { value: "moveCustomerToStage", label: "Mover Cliente para Etapa do CRM" },
    // Interno
    { value: "updateOrderStatus", label: "Atualizar Status do Pedido" },
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
    defaultValues: { name: "", trigger: "", action: "", templateId: "", conditions: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditions",
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
            conditions: values.conditions || [],
            action: values.action,
            templateId: values.templateId,
            isActive: true,
        };

        await addRule(ruleData as any); // Cast because of the complex type from server
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
                     <CardDescription>Dê um nome para sua regra para facilitar a identificação.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Regra</FormLabel><FormControl><Input placeholder="Ex: Enviar pesquisa de satisfação após entrega" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> SE (Gatilho)</CardTitle>
                    <CardDescription>Escolha o evento que irá iniciar esta automação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="trigger" render={({ field }) => (<FormItem><FormLabel>Quando isto acontecer...</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um evento..." /></SelectTrigger></FormControl><SelectContent>{triggers.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                     
                     <Separator />

                     <div>
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="font-medium flex items-center gap-2"><Filter className="h-4 w-4"/> E se... (Condições Opcionais)</h4>
                           <Button type="button" size="sm" variant="outline" onClick={() => append({ field: '', operator: '==', value: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Filtro</Button>
                        </div>
                         <CardDescription className="mb-4">Adicione filtros para tornar sua automação mais específica. A ação só será executada se todas as condições forem verdadeiras.</CardDescription>
                        <div className="space-y-4">
                           {fields.map((item, index) => (
                             <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 border rounded-md">
                               <FormField control={form.control} name={`conditions.${index}.field`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Campo</FormLabel><FormControl><Input placeholder="ex: total" {...field} /></FormControl></FormItem>)}/>
                               <FormField control={form.control} name={`conditions.${index}.operator`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Operador</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="==">For igual a</SelectItem><SelectItem value="!=">For diferente de</SelectItem><SelectItem value=">">For maior que</SelectItem><SelectItem value="<">For menor que</SelectItem><SelectItem value="contains">Contiver</SelectItem></SelectContent></Select></FormItem>)}/>
                               <FormField control={form.control} name={`conditions.${index}.value`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Valor</FormLabel><FormControl><Input placeholder="ex: 500" {...field} /></FormControl></FormItem>)}/>
                               <Button type="button" variant="ghost" size="icon" className="text-destructive md:col-span-1" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                             </div>
                           ))}
                        </div>
                     </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-500" /> ENTÃO (Ação)</CardTitle>
                    <CardDescription>Escolha o que deve acontecer quando o gatilho for disparado.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <FormField control={form.control} name="action" render={({ field }) => (<FormItem><FormLabel>Execute esta ação</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma ação..." /></SelectTrigger></FormControl><SelectContent>{actions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    
                    {watchedAction === 'sendMessage' && (
                        <FormField control={form.control} name="templateId" render={({ field }) => (<FormItem><FormLabel>Selecione o Template a ser enviado</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Escolha um template de mensagem..." /></SelectTrigger></FormControl><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.language.toUpperCase()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}
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
