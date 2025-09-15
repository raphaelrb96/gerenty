

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addCustomer, updateCustomer, getCustomersByUser, Customer } from "@/services/customer-service";

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { getStagesByUser, Stage } from "@/services/stage-service";
import { MultiSelectCreatable } from "../ui/multi-select-creatable";

type CreateCustomerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved: (customer: Customer) => void;
  customer: Customer | null;
  allTags: string[];
};

const formSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório."),
    phone: z.string().min(1, "Telefone é obrigatório."),
    email: z.string().email("Email inválido.").optional().or(z.literal('')),
    document: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().min(1, "O estágio é obrigatório"),
    address: z.object({
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
    }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateCustomerModal({ isOpen, onClose, onCustomerSaved, customer, allTags }: CreateCustomerModalProps) {
  const { user, effectiveOwnerId } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [stages, setStages] = React.useState<Stage[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      tags: [],
      status: "",
      address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" },
    },
  });
  
  React.useEffect(() => {
    if (effectiveOwnerId && isOpen) {
        getStagesByUser(effectiveOwnerId).then(userStages => {
            const sortedStages = userStages.sort((a, b) => a.order - b.order);
            setStages(sortedStages);
            
            if (customer) {
                form.reset({
                    name: customer.name,
                    email: customer.email || "",
                    phone: customer.phone || "",
                    document: customer.document || "",
                    tags: customer.tags || [],
                    status: customer.status,
                    address: customer.address || { street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" }
                });
            } else if (sortedStages.length > 0) {
                 form.setValue('status', sortedStages[0].id);
            }
        });
    } else if (!isOpen) {
        form.reset();
    }
  }, [effectiveOwnerId, isOpen, customer, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    if (!effectiveOwnerId) {
      toast({ variant: "destructive", title: "Erro de autenticação" });
      return;
    }

    setIsSaving(true);
    try {
        if (!customer) { // Only check for duplicates on creation
            const existingCustomers = await getCustomersByUser(effectiveOwnerId);
            const isDuplicate = existingCustomers.some(c => 
                (values.email && c.email === values.email) ||
                (values.phone && c.phone === values.phone)
            );

            if (isDuplicate) {
                toast({ variant: "destructive", title: "Cliente duplicado", description: "Já existe um cliente com este e-mail ou telefone." });
                setIsSaving(false);
                return;
            }
        }

        const customerData = {
          ownerId: effectiveOwnerId,
          name: values.name,
          email: values.email,
          phone: values.phone,
          document: values.document,
          status: values.status,
          address: values.address,
          tags: values.tags || [],
        };

        let savedCustomer;
        if (customer) {
            savedCustomer = await updateCustomer(customer.id, customerData);
            toast({ title: "Cliente atualizado com sucesso!" });
        } else {
            savedCustomer = await addCustomer(customerData);
            toast({ title: "Cliente criado com sucesso!" });
        }
        
        onCustomerSaved(savedCustomer);
        handleClose();

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao salvar cliente" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{customer ? "Editar Cliente" : "Adicionar Novo Cliente"}</SheetTitle>
          <SheetDescription>Preencha os dados abaixo para gerenciar seus clientes.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
             <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-medium mb-4">Informações de Contato</h4>
                        <div className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="cliente@email.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="document" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ (Opcional)</FormLabel><FormControl><Input placeholder="Documento do cliente" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <h4 className="text-sm font-medium mb-4">Organização</h4>
                        <div className="space-y-4">
                             <FormField control={form.control} name="status" render={({ field }) => (<FormItem>
                                <FormLabel>Estágio</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um estágio" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {stages.map(stage => (
                                            <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="tags" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <MultiSelectCreatable
                                    options={allTags.map(tag => ({ value: tag, label: tag }))}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Selecione ou crie tags..."
                                />
                                <FormMessage />
                              </FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="pt-4">
                         <h4 className="text-sm font-medium mb-4">Endereço (Opcional)</h4>
                         <div className="space-y-4">
                            <FormField control={form.control} name="address.zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            <FormField control={form.control} name="address.street" render={({ field }) => (<FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Avenida Principal" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="address.number" render={({ field }) => (<FormItem><FormLabel>Nº</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                                <FormField control={form.control} name="address.complement" render={({ field }) => (<FormItem><FormLabel>Compl.</FormLabel><FormControl><Input placeholder="Sala 101" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            </div>
                            <FormField control={form.control} name="address.neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="address.city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                                <FormField control={form.control} name="address.state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                            </div>
                        </div>
                    </div>
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

    
    