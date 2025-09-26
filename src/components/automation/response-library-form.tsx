

"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { addLibraryMessage, updateLibraryMessage } from "@/services/library-message-service";
import { uploadFile } from "@/services/storage-service";
import type { LibraryMessage, LibraryMessageType } from "@/lib/types";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UploadCloud, PlusCircle, Trash2 } from "lucide-react";
import { Label } from "../ui/label";
import { getProductsByUser, Product } from "@/services/product-service";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

type ResponseLibraryFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  message: LibraryMessage | null;
};

const formSchema = z.object({
  name: z.string().min(2, "O nome da resposta é obrigatório."),
  type: z.enum(['text', 'image', 'video', 'audio', 'file', 'location', 'interactive', 'product']),
  
  // text
  text_body: z.string().optional(),
  
  // media
  media_caption: z.string().optional(),
  
  // product
  product_catalog_id: z.string().optional(),
  product_section_id: z.string().optional(),
  product_retailer_id: z.string().optional(),

  // interactive
  interactive_type: z.enum(['button', 'list', 'product', 'product_list']).optional(),
  interactive_header_type: z.enum(['text', 'image', 'video', 'document']).optional(),
  interactive_header_text: z.string().optional(),
  interactive_body_text: z.string().optional(),
  interactive_footer_text: z.string().optional(),
  interactive_buttons: z.array(z.object({
    id: z.string().min(1, "ID do botão é obrigatório"),
    title: z.string().min(1, "Texto do botão é obrigatório"),
  })).optional(),

});

type FormValues = z.infer<typeof formSchema>;

export function ResponseLibraryForm({ isOpen, onClose, onFinished, message }: ResponseLibraryFormProps) {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const { effectiveOwnerId } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    if (effectiveOwnerId && isOpen) {
      getProductsByUser(effectiveOwnerId).then(setProducts);
    }
  }, [effectiveOwnerId, isOpen]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", type: "text", interactive_buttons: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "interactive_buttons",
  });

  const watchedType = form.watch('type');
  const isMediaType = ['image', 'video', 'audio', 'file'].includes(watchedType);

  React.useEffect(() => {
    setFileToUpload(null);
    setFileName(null);
    // TODO: Reset form when message or isOpen changes
  }, [message, isOpen, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setFileName(file.name);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!activeCompany || !effectiveOwnerId) {
      toast({ variant: 'destructive', title: 'Nenhuma empresa selecionada.' });
      return;
    }
    
    setIsSaving(true);
    try {
        let messageContent: LibraryMessage['content'] = {};

        if (values.type === 'text') {
            messageContent.text = { body: values.text_body || '' };
        } else if (isMediaType) {
             let mediaUrl = message?.content.media?.url || '';
             if(fileToUpload) {
                const path = `libraryMessages/${activeCompany.id}/${Date.now()}-${fileToUpload.name}`;
                mediaUrl = await uploadFile(fileToUpload, path);
             }
             messageContent.media = { id: '', mime_type: fileToUpload?.type || '', url: mediaUrl, caption: values.media_caption };
        } else if (values.type === 'product') {
            if (!values.product_retailer_id) {
                toast({ variant: 'destructive', title: 'Produto obrigatório', description: 'Por favor, selecione um produto.' });
                setIsSaving(false);
                return;
            }
            messageContent.product_message = { product_retailer_id: values.product_retailer_id };
        } else if (values.type === 'interactive') {
            if (values.interactive_type === 'button') {
                messageContent.interactive = {
                    type: 'button',
                    body: { text: values.interactive_body_text || ' ' },
                    action: {
                        buttons: values.interactive_buttons?.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) || []
                    },
                    footer: values.interactive_footer_text ? { text: values.interactive_footer_text } : undefined,
                }
            } else {
                 toast({ variant: 'destructive', title: 'Tipo interativo não suportado', description: 'Atualmente, apenas o tipo "botão" é suportado.' });
                 setIsSaving(false);
                 return;
            }
        }

      const messageData = {
          name: values.name,
          type: values.type as LibraryMessageType,
          content: messageContent,
          companyId: activeCompany.id,
          ownerId: effectiveOwnerId,
      };

      if (message) {
        await updateLibraryMessage(activeCompany.id, message.id, messageData);
        toast({ title: "Resposta atualizada com sucesso!" });
      } else {
        await addLibraryMessage(activeCompany.id, messageData);
        toast({ title: "Resposta criada com sucesso!" });
      }
      onFinished();
      onClose();
    } catch (error) {
      console.error("Error saving library message:", error);
      toast({ variant: "destructive", title: "Erro ao salvar resposta." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{message ? "Editar Resposta" : "Criar Nova Resposta"}</SheetTitle>
          <SheetDescription>Configure respostas para usar em suas automações.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Resposta</FormLabel><FormControl><Input placeholder="Ex: Boas-vindas, Suporte" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo de Conteúdo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="interactive">Interativo (Botões)</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                </SelectContent></Select><FormMessage /></FormItem>)} />

                {watchedType === 'text' && (
                     <FormField control={form.control} name="text_body" render={({ field }) => (<FormItem><FormLabel>Texto da Mensagem</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                )}

                {isMediaType && (
                     <div className="space-y-4">
                        <Label>Arquivo de Mídia</Label>
                        <Label htmlFor="file-upload" className="cursor-pointer block">
                            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                                <UploadCloud className="h-10 w-10 mb-2" />
                                <span>{fileName ? `Arquivo: ${fileName}` : 'Clique para enviar um arquivo'}</span>
                            </div>
                        </Label>
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                        <FormField control={form.control} name="media_caption" render={({ field }) => (<FormItem><FormLabel>Legenda (Opcional)</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                )}
                
                {watchedType === 'product' && (
                     <FormField control={form.control} name="product_retailer_id" render={({ field }) => (<FormItem><FormLabel>Produto</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger></FormControl><SelectContent>
                         {products.map(p => <SelectItem key={p.id} value={p.sku || p.id}>{p.name}</SelectItem>)}
                     </SelectContent></Select><FormMessage /></FormItem>)} />
                )}
                
                {watchedType === 'interactive' && (
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <FormField control={form.control} name="interactive_body_text" render={({ field }) => (<FormItem><FormLabel>Corpo da Mensagem</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="interactive_footer_text" render={({ field }) => (<FormItem><FormLabel>Rodapé (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <Separator />
                             <Label>Botões de Resposta (Máx. 3)</Label>
                             {fields.map((field, index) => (
                                 <div key={field.id} className="flex items-end gap-2">
                                    <FormField control={form.control} name={`interactive_buttons.${index}.title`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Texto Botão {index + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                 </div>
                             ))}
                             {fields.length < 3 && <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `btn_${Date.now()}`, title: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Botão</Button>}
                        </CardContent>
                    </Card>
                )}
              </div>
            </ScrollArea>
            <SheetFooter className="px-6 py-4 border-t mt-auto">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Resposta
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

    

    
