
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { addCategory, updateCategory } from "@/services/category-service";
import type { ProductCategory } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "O nome da categoria é obrigatório."),
  slug: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

type CategoryFormProps = {
  category?: ProductCategory | null;
  onFinished: () => void;
};

export function CategoryForm({ category, onFinished }: CategoryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
      });
    } else {
        form.reset({ name: '', slug: '' });
    }
  }, [category, form]);

  async function onSubmit(values: CategoryFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
      return;
    }
    setIsSaving(true);

    const categoryData = {
        name: values.name,
        slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
        ownerId: user.uid,
    }

    try {
        if (category) {
            await updateCategory(category.id, categoryData);
            toast({ title: "Categoria atualizada com sucesso!" });
        } else {
            await addCategory(categoryData as any);
            toast({ title: "Categoria criada com sucesso!" });
        }
        onFinished();
    } catch(error) {
        console.error("Failed to save category", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a categoria." });
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
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Camisetas" {...field} />
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
                <Input placeholder="ex: camisetas (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Categoria
            </Button>
        </div>
      </form>
    </Form>
  );
}
