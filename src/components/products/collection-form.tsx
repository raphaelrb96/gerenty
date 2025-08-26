
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { addCollection, updateCollection } from "@/services/collection-service";
import type { ProductCollection } from "@/services/collection-service";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "O nome da coleção é obrigatório."),
  slug: z.string().optional(),
});

type CollectionFormValues = z.infer<typeof formSchema>;

type CollectionFormProps = {
  collection?: ProductCollection | null;
  onFinished: () => void;
};

export function CollectionForm({ collection, onFinished }: CollectionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (collection) {
      form.reset({
        name: collection.name,
        slug: collection.slug,
      });
    } else {
        form.reset({ name: '', slug: '' });
    }
  }, [collection, form]);

  async function onSubmit(values: CollectionFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
      return;
    }
    setIsSaving(true);

    const collectionData = {
        name: values.name,
        slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
        ownerId: user.uid,
    }

    try {
        if (collection) {
            await updateCollection(collection.id, collectionData);
            toast({ title: "Coleção atualizada com sucesso!" });
        } else {
            await addCollection(collectionData as any);
            toast({ title: "Coleção criada com sucesso!" });
        }
        onFinished();
    } catch(error) {
        console.error("Failed to save collection", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a coleção." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Coleção</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Coleção de Verão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input placeholder="ex: colecao-de-verao (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Coleção
            </Button>
        </div>
      </form>
    </Form>
  );
}
