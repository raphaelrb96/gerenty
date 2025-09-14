
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { addEmployee, updateEmployee } from "@/services/employee-service";
import type { Employee, Role } from "@/lib/types";

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
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";


const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").optional(),
  phone: z.string().min(1, "O telefone de contato é obrigatório."),
  document: z.string().optional(),
  type: z.enum(['Fixo', 'Freelancer']),
  role: z.enum(['admin', 'empresa', 'salesperson', 'entregador', 'manager', 'stockist', 'accountant', 'affiliate']),
  isActive: z.boolean(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
    // Make password required only when creating a new member (when member prop is null)
    if (!data.password) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: "A senha é obrigatória para novos membros.",
        });
    }
});

type FormValues = z.infer<typeof formSchema>;

type MemberFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
  member: Employee | null;
};

const roles: { value: Role; label: string }[] = [
    { value: "entregador", label: "Entregador" },
    { value: "salesperson", label: "Vendedor" },
    { value: "manager", label: "Gerente" },
    { value: "stockist", label: "Estoquista" },
    { value: "accountant", label: "Financeiro" },
    { value: "affiliate", label: "Afiliado" },
    { value: "admin", label: "Admin" },
    { value: "empresa", label: "Dono" },
];

export function MemberForm({ isOpen, onFinished, member }: MemberFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      type: "Fixo",
      role: "salesperson",
      isActive: true,
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        phone: member.phone || "",
        document: member.document || "",
        type: member.type || "Fixo",
        role: member.role,
        isActive: member.isActive,
        address: member.address || { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" },
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        document: "",
        type: "Fixo",
        role: "salesperson",
        isActive: true,
        address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" },
      });
    }
  }, [member, form, isOpen]);

  const handleClose = () => {
    form.reset();
    onFinished();
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro de autenticação" });
      return;
    }

    setIsSaving(true);
    try {
      if (member) {
        // We don't update the password on edit, so we remove it from the data
        const { password, ...updateData } = values;
        await updateEmployee(member.id, updateData);
        toast({ title: "Membro da equipe atualizado!" });
      } else {
        if (!values.password) {
            toast({ variant: "destructive", title: "Senha obrigatória", description: "É necessário definir uma senha para o novo membro." });
            setIsSaving(false);
            return;
        }
        await addEmployee({ ...values, ownerId: user.uid, password: values.password });
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
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{member ? "Editar Membro" : "Adicionar Novo Membro"}</SheetTitle>
          <SheetDescription>
            Preencha os dados abaixo para gerenciar sua equipe.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Informações Pessoais</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do membro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone / Contato</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} disabled={!!member} /></FormControl><FormMessage /></FormItem>)} />
                       {!member && (
                        <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       )}
                      <FormField control={form.control} name="document" render={({ field }) => (<FormItem><FormLabel>CPF (Opcional)</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Detalhes do Cargo</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Função</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                          {roles.map(role => (
                              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                      </SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo de Vínculo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Fixo">Fixo (CLT)</SelectItem><SelectItem value="Freelancer">Freelancer</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Status Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Endereço (Opcional)</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <FormField control={form.control} name="address.zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="address.street" render={({ field }) => (<FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Avenida Principal" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="address.number" render={({ field }) => (<FormItem><FormLabel>Nº</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="address.complement" render={({ field }) => (<FormItem><FormLabel>Compl.</FormLabel><FormControl><Input placeholder="Sala 101" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="address.neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="address.city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="address.state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
            <SheetFooter className="px-6 py-4 border-t mt-auto">
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
