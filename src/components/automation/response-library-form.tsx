
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { addLibraryMessage, updateLibraryMessage } from "@/services/library-message-service";
import { uploadFile } from "@/services/storage-service";
import type { LibraryMessage } from "@/lib/types";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UploadCloud } from "lucide-react";
import { Label } from "../ui/label";

type ResponseLibraryFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  message: LibraryMessage | null;
};

const formSchema = z.object({
  name: z.string().min(2, "O nome da resposta é obrigatório."),
  type: z.enum(['text', 'image', 'video', 'audio', 'file']),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ResponseLibraryForm({ isOpen, onClose, onFinished, message }: ResponseLibraryFormProps) {
  const { toast } = useToast();
  const { activeCompany } = useCompany();
  const { effectiveOwnerId } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "text",
      content: "",
    },
  });

  const watchedType = form.watch('type');

  React.useEffect(() => {
    setFileToUpload(null);
    setFileName(null);
    if (message && isOpen) {
      form.reset({
        name: message.name,
        type: message.type,
        content: message.type === 'text' ? message.content : '',
      });
      if (message.type !== 'text') {
        setFileName(message.content.split('/').pop()?.split('?')[0] || 'Arquivo existente');
      }
    } else {
      form.reset({
        name: "",
        type: "text",
        content: "",
      });
    }
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
    
    if (values.type !== 'text' && !fileToUpload && !message) {
        toast({ variant: 'destructive', title: 'Arquivo necessário', description: 'Por favor, selecione um arquivo para enviar.' });
        return;
    }

    setIsSaving(true);
    try {
      let finalContent = values.content || '';

      if (values.type !== 'text' && fileToUpload) {
        const path = `libraryMessages/${activeCompany.id}/${Date.now()}-${fileToUpload.name}`;
        finalContent = await uploadFile(fileToUpload, path);
      } else if (message && message.type !== 'text') {
          // If not uploading a new file, keep the old content URL
          finalContent = message.content;
      }

      const messageData = {
          name: values.name,
          type: values.type,
          content: finalContent,
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
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo de Conteúdo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="text">Texto</SelectItem><SelectItem value="image">Imagem</SelectItem><SelectItem value="video">Vídeo</SelectItem><SelectItem value="audio">Áudio</SelectItem><SelectItem value="file">Arquivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />

                {watchedType === 'text' ? (
                     <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Texto da Mensagem</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                ) : (
                    <div className="space-y-2">
                        <Label>Arquivo de Mídia</Label>
                        <Label htmlFor="file-upload" className="cursor-pointer block">
                            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                                <UploadCloud className="h-10 w-10 mb-2" />
                                <span>{fileName ? `Arquivo: ${fileName}` : 'Clique para enviar um arquivo'}</span>
                                <p className="text-xs mt-1">
                                    {watchedType === 'image' && 'Imagens (JPG, PNG, GIF)'}
                                    {watchedType === 'video' && 'Vídeos (MP4)'}
                                    {watchedType === 'audio' && 'Áudio (MP3, OGG)'}
                                    {watchedType === 'file' && 'Documentos (PDF, etc.)'}
                                </p>
                            </div>
                        </Label>
                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                    </div>
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
