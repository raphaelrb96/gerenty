
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Employee } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";

const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  phone: z.string().optional(),
  role: z.enum(['Vendedor', 'Entregador', 'Afiliado', 'Outro']),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type MemberFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  member: Employee | null;
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id'>>) => Promise<any>;
};

export function MemberForm({ isOpen, onClose, onFinished, member, addEmployee, updateEmployee }: MemberFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Vendedor",
      isActive: true,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        phone: member.phone || "",
        role: member.role,
        isActive: member.isActive,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        role: "Vendedor",
        isActive: true,
      });
    }
  }, [member, form, isOpen]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro de autenticação" });
      return;
    }

    setIsSaving(true);
    try {
      if (member) {
        await updateEmployee(member.id, values);
        toast({ title: "Membro da equipe atualizado!" });
      } else {
        await addEmployee({ ...values, ownerId: user.uid });
        toast({ title: "Novo membro adicionado à equipe!" });
      }
      onFinished();
      handleClose();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar os dados do membro da equipe." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{member ? "Editar Membro" : "Adicionar Novo Membro"}</SheetTitle>
          <SheetDescription>
            Preencha os dados abaixo para gerenciar sua equipe.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do membro" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="role" render={({ field }) => (<FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Entregador">Entregador</SelectItem>
                  <SelectItem value="Afiliado">Afiliado</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>)} />
            <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Status Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            <SheetFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
