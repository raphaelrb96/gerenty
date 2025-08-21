
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { addCompany } from "@/services/company-service";
import type { Company } from "@/lib/types";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const formSchema = z.object({
  // Institucional
  name: z.string().min(2, "O nome da empresa é obrigatório."),
  description: z.string().optional(),
  document: z.string().optional(),
  documentType: z.enum(['CNPJ', 'CPF', 'Outro']).default('CNPJ'),
  
  // Contato
  email: z.string().email("Email de contato inválido."),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url("URL do site inválida.").optional().or(z.literal('')),
  
  // Endereço
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type CreateCompanyFormValues = z.infer<typeof formSchema>;

export function CreateCompanyForm() {
    const router = useRouter();
    const { user } = useAuth();
    const { setActiveCompany } = useCompany();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateCompanyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            document: "",
            documentType: "CNPJ",
            email: "",
            phone: "",
            whatsapp: "",
            website: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            zipCode: "",
            country: "Brasil",
        },
    });

    async function onSubmit(values: CreateCompanyFormValues) {
        if (!user) {
            toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado para criar uma empresa." });
            return;
        }
        
        setIsLoading(true);

        const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
            ownerId: user.uid,
            name: values.name,
            slug: values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            description: values.description,
            document: values.document,
            documentType: values.documentType,
            email: values.email,
            phone: values.phone,
            whatsapp: values.whatsapp,
            website: values.website,
            address: {
                street: values.street,
                number: values.number,
                complement: values.complement,
                neighborhood: values.neighborhood,
                city: values.city,
                state: values.state,
                zipCode: values.zipCode,
                country: values.country,
            },
            isVerified: false,
            isActive: true,
        };

        try {
            const newCompany = await addCompany(companyData);
            toast({
                title: "Empresa Criada!",
                description: `A empresa ${newCompany.name} foi criada com sucesso.`,
            });
            setActiveCompany(newCompany);
            router.push("/dashboard");

        } catch(error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao Criar Empresa", description: "Ocorreu um erro, por favor tente novamente." });
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
                            
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="font-semibold text-lg">Informações Institucionais</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Minha Empresa LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva brevemente sua empresa..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="documentType" render={({ field }) => (
                                            <FormItem><FormLabel>Tipo de Documento</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                                                        <SelectItem value="CPF">CPF</SelectItem>
                                                        <SelectItem value="Outro">Outro</SelectItem>
                                                    </SelectContent>
                                                </Select><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="document" render={({ field }) => (
                                            <FormItem><FormLabel>Número do Documento</FormLabel><FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger className="font-semibold text-lg">Informações de Contato</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email de Contato</FormLabel><FormControl><Input placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                     </div>
                                      <FormField control={form.control} name="website" render={({ field }) => (
                                        <FormItem><FormLabel>Site (opcional)</FormLabel><FormControl><Input placeholder="https://suaempresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger className="font-semibold text-lg">Endereço</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="zipCode" render={({ field }) => (
                                            <FormItem className="md:col-span-1"><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <FormField control={form.control} name="street" render={({ field }) => (
                                        <FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Avenida Principal" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                         <FormField control={form.control} name="number" render={({ field }) => (
                                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="complement" render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Sala 101" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="city" render={({ field }) => (
                                            <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="state" render={({ field }) => (
                                            <FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                        <CardFooter className="p-0 pt-6 flex justify-end">
                            <Button type="submit" disabled={isLoading} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Empresa
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
