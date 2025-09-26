
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { addTemplate, updateTemplate } from "@/services/template-service";
import type { MessageTemplate } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type TemplateFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  template: MessageTemplate | null;
};

const buttonSchema = z.object({
    type: z.enum(['PHONE_NUMBER', 'URL', 'QUICK_REPLY']),
    text: z.string().min(1, "Texto do botão é obrigatório"),
    url: z.string().optional(),
    phone_number: z.string().optional(),
});

const componentSchema = z.object({
    type: z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
    format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    text: z.string().optional(),
    buttons: z.array(buttonSchema).optional(),
});

const formSchema = z.object({
  name: z.string().min(2, "Nome do template é obrigatório."),
  language: z.string().min(2, "Idioma é obrigatório (ex: pt_BR)."),
  category: z.enum(['marketing', 'utility', 'authentication']),
  components: z.array(componentSchema).min(1, "O template deve ter pelo menos um corpo (BODY)."),
});

type FormValues = z.infer<typeof formSchema>;

export function TemplateForm({ isOpen, onClose, onFinished, template }: TemplateFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      language: "pt_BR",
      category: "utility",
      components: [{ type: 'BODY', text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  React.useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components,
      });
    } else {
      form.reset({
        name: "",
        language: "pt_BR",
        category: "utility",
        components: [{ type: 'BODY', text: '' }],
      });
    }
  }, [template, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      if (template) {
        await updateTemplate(template.id, values);
        toast({ title: "Template atualizado com sucesso!" });
      } else {
        await addTemplate(values as any);
        toast({ title: "Template criado com sucesso!" });
      }
      onFinished();
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ variant: "destructive", title: "Erro ao salvar template." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{template ? "Editar Template" : "Criar Novo Template"}</SheetTitle>
          <SheetDescription>Configure as mensagens que serão enviadas para seus clientes.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="ex: boas_vindas" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="language" render={({ field }) => (<FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="pt_BR" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="utility">Utilidade</SelectItem><SelectItem value="authentication">Autenticação</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                
                <Separator />
                <h4 className="text-lg font-semibold">Componentes</h4>
                
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        const componentType = form.watch(`components.${index}.type`);
                        return (
                            <Card key={field.id}>
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                    <CardTitle className="text-base">{componentType}</CardTitle>
                                    {componentType !== 'BODY' && <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>}
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                   {componentType === 'HEADER' && (
                                       <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Texto do Cabeçalho</FormLabel><FormControl><Input placeholder="Use {{1}} para variáveis" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                   )}
                                   {componentType === 'BODY' && (
                                       <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Corpo da Mensagem</FormLabel><FormControl><Textarea placeholder="O corpo da sua mensagem... Use {{1}} para variáveis." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                   )}
                                   {componentType === 'FOOTER' && (
                                       <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Texto do Rodapé</FormLabel><FormControl><Input placeholder="Texto curto de rodapé" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                   )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                 <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'HEADER', text: '' })}><PlusCircle className="mr-2 h-4 w-4" />Cabeçalho</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'FOOTER', text: '' })}><PlusCircle className="mr-2 h-4 w-4" />Rodapé</Button>
                 </div>

              </div>
            </ScrollArea>
            <SheetFooter className="px-6 py-4 border-t mt-auto">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Template
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
