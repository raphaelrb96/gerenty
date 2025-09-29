

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
import { Loader2, PlusCircle, Trash2, Link, Phone, MessageSquare } from "lucide-react";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { useCompany } from "@/context/company-context";

type TemplateFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  template: MessageTemplate | null;
};

const buttonSchema = z.object({
    type: z.enum(['URL', 'PHONE_NUMBER', 'QUICK_REPLY']),
    text: z.string().min(1, "Texto do botão é obrigatório"),
    url: z.string().url("URL inválida").optional(),
    phone_number: z.string().optional(),
});

const componentSchema = z.object({
    type: z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
    format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    text: z.string().optional(),
    buttons: z.array(buttonSchema).optional(),
});

const formSchema = z.object({
  name: z.string().min(2, "Nome do template é obrigatório.").regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas, números e underscores."),
  language: z.string().min(2, "Idioma é obrigatório (ex: pt_BR)."),
  category: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']),
  components: z.array(componentSchema).min(1, "O template deve ter pelo menos um corpo (BODY)."),
});

type FormValues = z.infer<typeof formSchema>;

export function TemplateForm({ isOpen, onClose, onFinished, template }: TemplateFormProps) {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      language: "pt_BR",
      category: "UTILITY",
      components: [{ type: 'BODY', text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });
  
  const buttonsComponentIndex = fields.findIndex(f => f.type === 'BUTTONS');

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
      control: form.control,
      name: `components.${buttonsComponentIndex}.buttons` as any
  });

  React.useEffect(() => {
    if (template && isOpen) {
      form.reset({
        name: template.name,
        language: template.language,
        category: template.category.toUpperCase() as any,
        components: template.components.length > 0 ? template.components : [{ type: 'BODY', text: '' }],
      });
    } else if (!template && isOpen) {
      form.reset({
        name: "",
        language: "pt_BR",
        category: "UTILITY",
        components: [{ type: 'BODY', text: '' }],
      });
    }
  }, [template, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    if (!activeCompany) {
        toast({ variant: 'destructive', title: 'Nenhuma empresa selecionada.' });
        return;
    }
    setIsSaving(true);
    try {
      if (template) {
        await updateTemplate(activeCompany.id, template.id, values as any);
        toast({ title: "Template atualizado com sucesso!" });
      } else {
        await addTemplate(activeCompany.id, values as any);
        toast({ title: "Template criado com sucesso!" });
      }
      onFinished();
      onClose();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({ variant: "destructive", title: "Erro ao salvar template.", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComponent = (type: 'HEADER' | 'FOOTER' | 'BUTTONS') => {
      if (fields.some(f => f.type === type)) return;
      
      if (type === 'BUTTONS') {
          append({ type, buttons: [] });
      } else {
           append({ type, format: type === 'HEADER' ? 'TEXT' : undefined, text: '' });
      }
  }

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
                <Card>
                    <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="ex: boas_vindas" {...field} disabled={!!template} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="language" render={({ field }) => (<FormItem><FormLabel>Idioma</FormLabel><FormControl><Input placeholder="pt_BR" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="MARKETING">Marketing</SelectItem><SelectItem value="UTILITY">Utilidade</SelectItem><SelectItem value="AUTHENTICATION">Autenticação</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
                
                <h4 className="text-lg font-semibold">Componentes</h4>
                
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        const componentType = form.watch(`components.${index}.type`);
                        const headerFormat = form.watch(`components.${index}.format`);
                        
                        return (
                            <Card key={field.id}>
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                    <CardTitle className="text-base">{componentType}</CardTitle>
                                    {componentType !== 'BODY' && <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>}
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-4">
                                   {componentType === 'HEADER' && (
                                       <div className="space-y-4">
                                            <FormField control={form.control} name={`components.${index}.format`} render={({ field }) => (
                                                <FormItem><FormLabel>Formato do Cabeçalho</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="TEXT">Texto</SelectItem><SelectItem value="IMAGE">Imagem</SelectItem><SelectItem value="VIDEO">Vídeo</SelectItem><SelectItem value="DOCUMENT">Documento</SelectItem></SelectContent></Select></FormItem>
                                            )}/>
                                            {headerFormat === 'TEXT' && (
                                                <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Texto do Cabeçalho</FormLabel><FormControl><Input placeholder="Use {{1}} para variáveis" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                            )}
                                            {headerFormat !== 'TEXT' && (
                                                <div className="text-sm p-4 bg-muted rounded-md text-center text-muted-foreground">A mídia será adicionada no momento do envio.</div>
                                            )}
                                       </div>
                                   )}
                                   {componentType === 'BODY' && (
                                       <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Corpo da Mensagem</FormLabel><FormControl><Textarea placeholder="O corpo da sua mensagem... Use {{1}} para variáveis." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                   )}
                                   {componentType === 'FOOTER' && (
                                       <FormField control={form.control} name={`components.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Texto do Rodapé</FormLabel><FormControl><Input placeholder="Texto curto de rodapé" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                   )}
                                   {componentType === 'BUTTONS' && (
                                       <div className="space-y-4">
                                           {buttonFields.map((buttonField, buttonIndex) => (
                                               <div key={buttonField.id} className="p-3 border rounded-md space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-medium text-sm">Botão {buttonIndex + 1}</p>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeButton(buttonIndex)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                    <FormField control={form.control} name={`components.${buttonsComponentIndex}.buttons.${buttonIndex}.type`} render={({ field }) => (
                                                        <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="QUICK_REPLY">Resposta Rápida</SelectItem><SelectItem value="URL">Link (URL)</SelectItem><SelectItem value="PHONE_NUMBER">Ligar</SelectItem></SelectContent></Select></FormItem>
                                                    )}/>
                                                     <FormField control={form.control} name={`components.${buttonsComponentIndex}.buttons.${buttonIndex}.text`} render={({ field }) => (<FormItem><FormLabel>Texto do Botão</FormLabel><FormControl><Input placeholder="Ex: Saber Mais" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                     
                                                     {form.watch(`components.${buttonsComponentIndex}.buttons.${buttonIndex}.type`) === 'URL' &&
                                                        <FormField control={form.control} name={`components.${buttonsComponentIndex}.buttons.${buttonIndex}.url`} render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                                     }
                                                     {form.watch(`components.${buttonsComponentIndex}.buttons.${buttonIndex}.type`) === 'PHONE_NUMBER' &&
                                                        <FormField control={form.control} name={`components.${buttonsComponentIndex}.buttons.${buttonIndex}.phone_number`} render={({ field }) => (<FormItem><FormLabel>Número de Telefone</FormLabel><FormControl><Input placeholder="+5511999999999" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                                     }
                                               </div>
                                           ))}
                                           {buttonFields.length < 3 && (
                                               <Button type="button" variant="outline" size="sm" onClick={() => appendButton({ type: 'QUICK_REPLY', text: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Botão</Button>
                                           )}
                                       </div>
                                   )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                 <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent('HEADER')}><PlusCircle className="mr-2 h-4 w-4" />Cabeçalho</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent('FOOTER')}><PlusCircle className="mr-2 h-4 w-4" />Rodapé</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddComponent('BUTTONS')}><PlusCircle className="mr-2 h-4 w-4" />Botões</Button>
                 </div>

              </div>
            </ScrollArea>
            <SheetFooter className="px-6 py-4 border-t mt-auto">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {template ? 'Salvar Alterações' : 'Criar Template'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
