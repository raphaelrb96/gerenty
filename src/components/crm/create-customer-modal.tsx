
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addCustomer, getCustomersByUser, Customer } from "@/services/customer-service";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { getStagesByUser, Stage } from "@/services/stage-service";

type CreateCustomerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
};

const formSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório."),
    email: z.string().email("Email inválido.").optional().or(z.literal('')),
    phone: z.string().optional(),
    status: z.string().min(1, "O estágio é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCustomerModal({ isOpen, onClose, onCustomerCreated }: CreateCustomerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [stages, setStages] = React.useState<Stage[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "",
    },
  });
  
  React.useEffect(() => {
    if (user && isOpen) {
        getStagesByUser(user.uid).then(userStages => {
            setStages(userStages);
            if (userStages.length > 0 && !form.getValues('status')) {
                form.setValue('status', userStages[0].id);
            }
        });
    }
  }, [user, isOpen, form]);

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
        // Check for duplicates
        const existingCustomers = await getCustomersByUser(user.uid);
        const isDuplicate = existingCustomers.some(customer => 
            (values.email && customer.email === values.email) ||
            (values.phone && customer.phone === values.phone)
        );

        if (isDuplicate) {
            toast({
                variant: "destructive",
                title: "Cliente duplicado",
                description: "Já existe um cliente com este e-mail ou telefone."
            });
            setIsSaving(false);
            return;
        }


      const newCustomerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lastInteraction'> = {
        ownerId: user.uid,
        ...values,
      };
      const newCustomer = await addCustomer(newCustomerData);
      toast({ title: "Cliente criado com sucesso!" });
      onCustomerCreated(newCustomer);
      handleClose();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao criar cliente" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg flex flex-col h-full md:h-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Preencha os dados abaixo para criar um novo cliente no seu funil.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
             <ScrollArea className="flex-1 pr-6 -mr-6">
                <div className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="cliente@email.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem>
                        <FormLabel>Estágio Inicial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {stages.map(stage => (
                                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )}/>
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6 border-t">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Cliente
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
