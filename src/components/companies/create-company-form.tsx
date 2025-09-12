
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
import { uploadFile } from "@/services/storage-service";
import type { Company } from "@/lib/types";
import Image from "next/image";

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
import { Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";


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

  // Redes Sociais
  socialMedia: z.object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      twitter: z.string().optional(),
  }).optional(),
  
  // Endereço
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  
  // Políticas de Negócio (Simplificado para o formulário inicial)
  businessPolicy: z.object({
      deliveryEnabled: z.boolean().default(false),
      pickupEnabled: z.boolean().default(false),
      minimumOrderValue: z.preprocess((a) => parseFloat(z.string().parse(a || "0").replace(",", ".")), z.number().min(0)).optional(),
  }).optional(),
});

type CreateCompanyFormValues = z.infer<typeof formSchema>;

export function CreateCompanyForm() {
    const router = useRouter();
    const { user } = useAuth();
    const { setActiveCompany } = useCompany();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

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
            address: {
                street: "",
                number: "",
                complement: "",
                neighborhood: "",
                city: "",
                state: "",
                zipCode: "",
                country: "Brasil",
            },
            socialMedia: {
                instagram: "",
                facebook: "",
                tiktok: "",
                linkedin: "",
                youtube: "",
                twitter: "",
            },
            businessPolicy: {
                deliveryEnabled: true,
                pickupEnabled: false,
                minimumOrderValue: 0,
            }
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(previewUrl);
            } else {
                setBannerFile(file);
                setBannerPreview(previewUrl);
            }
        }
    };


    async function onSubmit(values: CreateCompanyFormValues) {
        if (!user) {
            toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para criar uma empresa." });
            return;
        }
        
        setIsLoading(true);

        try {
            let logoUrl = "";
            let bannerUrl = "";
            
            if (logoFile) {
                const path = `companies/${user.uid}/${values.name.replace(/\s+/g, '-')}-logo-${Date.now()}`;
                console.log('Upload Logo Init: ', path);
                logoUrl = await uploadFile(logoFile, path);
                console.log('Upload Logo Finalizado');
            }

            if (bannerFile) {
                const path = `companies/${user.uid}/${values.name.replace(/\s+/g, '-')}-banner-${Date.now()}`;
                console.log('Upload Banner Init: ', path);
                bannerUrl = await uploadFile(bannerFile, path);
                console.log('Upload Banner Finalizado');
            }
            
            const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'> = {
                ownerId: user.uid,
                name: values.name,
                slug: values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                description: values.description,
                logoUrl: logoUrl,
                bannerUrl: bannerUrl,
                document: values.document,
                documentType: values.documentType,
                email: values.email,
                phone: values.phone,
                whatsapp: values.whatsapp,
                website: values.website,
                socialMedia: values.socialMedia,
                address: {
                    ...values.address,
                    location: null,
                },
                businessPolicy: {
                    ...values.businessPolicy,
                    shippingDetails: { methods: [] }, 
                    acceptedPayments: [], 
                },
                catalogSettings: { layout: 'grid' },
                isVerified: false,
                isActive: true,
            };

            console.log('Salvando dados da empresa...');
            const newCompany = await addCompany(companyData);
            console.log('Dados da empresa salvos com sucesso');
            toast({
                title: "Empresa Criada!",
                description: `A empresa ${newCompany.name} foi criada com sucesso.`,
            });
            setActiveCompany(newCompany);
            // Force a full page reload to ensure the CompanyProvider is updated
            window.location.href = "/dashboard";

        } catch(error) {
            setIsLoading(false);
            console.error("Operação falhou", error);
            toast({ variant: "destructive", title: "Erro ao Criar Empresa", description: "Ocorreu um erro ao salvar os dados. Por favor, tente novamente." });
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                         <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Minha Empresa LTDA" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <div className="space-y-2 flex flex-col items-center">
                                            <FormLabel>Logo</FormLabel>
                                            <Label htmlFor="logo-upload" className="cursor-pointer">
                                                <div className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                                                    {logoPreview ? (
                                                        <Image src={logoPreview} alt="Logo preview" width={128} height={128} className="rounded-full object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <Upload className="mx-auto h-8 w-8" />
                                                            <p className="text-xs mt-1">Clique para enviar</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Label>
                                            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                                        </div>
                                    </div>
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
                                    <FormItem className="space-y-2">
                                        <FormLabel>Banner</FormLabel>
                                        <Label htmlFor="banner-upload" className="cursor-pointer block">
                                             <Card className="relative h-32 border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                                                {bannerPreview ? (
                                                      <Image src={bannerPreview} alt="Banner preview" layout="fill" className="rounded-md object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="mx-auto h-12 w-12" />
                                                        <p className="text-sm mt-2">Clique para enviar o banner</p>
                                                    </div>
                                                )}
                                            </Card>
                                        </Label>
                                        <Input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                                    </FormItem>
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

                             <AccordionItem value="item-social">
                                <AccordionTrigger className="font-semibold text-lg">Redes Sociais</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <FormField control={form.control} name="socialMedia.instagram" render={({ field }) => ( <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="usuario_instagram" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name="socialMedia.facebook" render={({ field }) => ( <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input placeholder="pagina_facebook" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name="socialMedia.tiktok" render={({ field }) => ( <FormItem><FormLabel>TikTok</FormLabel><FormControl><Input placeholder="@usuario_tiktok" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name="socialMedia.linkedin" render={({ field }) => ( <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="linkedin.com/company/sua-empresa" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger className="font-semibold text-lg">Endereço</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="address.zipCode" render={({ field }) => (
                                            <FormItem className="md:col-span-1"><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <FormField control={form.control} name="address.street" render={({ field }) => (
                                        <FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Avenida Principal" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                         <FormField control={form.control} name="address.number" render={({ field }) => (
                                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="address.complement" render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Sala 101" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="address.neighborhood" render={({ field }) => (
                                            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="address.city" render={({ field }) => (
                                            <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name="address.state" render={({ field }) => (
                                            <FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-4">
                                <AccordionTrigger className="font-semibold text-lg">Políticas de Negócio</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                     <FormField
                                        control={form.control} name="businessPolicy.deliveryEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Habilitar Entregas</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Permite que os clientes escolham a entrega como opção de envio.</p>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control} name="businessPolicy.pickupEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Habilitar Retirada</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Permite que os clientes retirem o pedido no local.</p>
                                                </div>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="businessPolicy.minimumOrderValue" render={({ field }) => (
                                        <FormItem><FormLabel>Valor Mínimo do Pedido (opcional)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <div className="text-sm text-muted-foreground pt-2">
                                        <p><strong>Nota:</strong> Configurações avançadas de frete, pagamento e políticas de devolução poderão ser configuradas na tela de edição da empresa.</p>
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
