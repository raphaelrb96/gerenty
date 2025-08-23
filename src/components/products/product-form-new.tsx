
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct, getProducts } from "@/services/product-service";
import type { Product } from "@/lib/types";
import { generateProductDescription } from "@/ai/flows/generate-product-description";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Bot, Upload, Trash2, PlusCircle, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Label } from "../ui/label";
import Image from "next/image";
import { MultiSelect } from "../ui/multi-select";
import { uploadFile } from "@/services/storage-service";

// Esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(3, "O nome do produto deve ter pelo menos 3 caracteres."),
  slug: z.string().min(3, "O slug é obrigatório.").optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  
  pricing: z.array(z.object({
    label: z.string().min(1, "O rótulo é obrigatório"),
    price: z.preprocess((a) => parseFloat(z.string().parse(a || "0").replace(",", ".")), z.number().min(0)),
    currency: z.enum(['BRL', 'USD', 'EUR', 'GBP']),
  })).min(1, "Adicione pelo menos um preço."),

  availableStock: z.preprocess((a) => parseInt(z.string().parse(a || "0"), 10), z.number().int().nonnegative()),

  status: z.enum(['available', 'out-of-stock', 'discontinued']),
  visibility: z.enum(['public', 'private']),
  
  tags: z.string().optional(),
  
  attributes: z.array(z.object({
      name: z.string().min(1, "O nome do atributo é obrigatório"),
      options: z.string().min(1, "Adicione pelo menos uma opção"),
  })),

  companyIds: z.array(z.string()).min(1, "Selecione pelo menos uma empresa."),
});

type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormProps = {
    product?: Product | null;
}

export function ProductFormNew({ product }: ProductFormProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, userData } = useAuth();
    const { companies, activeCompany, loading: loadingCompanies } = useCompany();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, startGenerateTransition] = useTransition();
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {} : {
            name: "",
            slug: "",
            description: "",
            sku: "",
            pricing: [{ label: 'Varejo', price: 0, currency: 'BRL' }],
            availableStock: 0,
            status: "available",
            visibility: "public",
            tags: "",
            attributes: [],
            companyIds: activeCompany ? [activeCompany.id] : [],
        },
    });
    
    const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({
        control: form.control,
        name: "pricing",
    });

    const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
        control: form.control,
        name: "attributes",
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                slug: product.slug,
                description: product.description || '',
                sku: product.sku || '',
                pricing: product.pricing?.map(p => ({ label: p.label, price: p.price, currency: p.currency })) || [{ label: 'Varejo', price: 0, currency: 'BRL' }],
                availableStock: typeof product.availableStock === 'number' ? product.availableStock : 0,
                status: product.status,
                visibility: product.visibility,
                tags: product.tags?.join(', ') || '',
                attributes: product.attributes?.map(a => ({ name: a.name, options: a.options.join(', ') })) || [],
                companyIds: product.companyIds || [],
            });
            setMainImagePreview(product.images?.mainImage || null);
        }
    }, [product, form]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main') => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'main') {
                setMainImageFile(file);
                setMainImagePreview(previewUrl);
            }
        }
    };


    const handleGenerateDescription = () => {
        const productName = form.watch('name');
        const tags = form.watch('tags');
    
        if (!productName) {
            toast({
                title: t('productForm.generateError.title'),
                description: t('productForm.generateError.description'),
                variant: "destructive",
            });
            return;
        }
    
        startGenerateTransition(async () => {
            try {
                const result = await generateProductDescription({ productName, attributes: tags || '' });
                form.setValue('description', result.description, { shouldValidate: true });
                toast({
                    title: t('productForm.generateSuccess.title'),
                });
            } catch (error) {
                toast({
                    title: t('productForm.generateFailed.title'),
                    description: t('productForm.generateFailed.description'),
                    variant: "destructive",
                });
            }
        });
    };

    async function onSubmit(values: ProductFormValues) {
        if (!user || values.companyIds.length === 0) {
            toast({ variant: "destructive", title: "Dados Incompletos", description: "Você precisa estar logado e selecionar pelo menos uma empresa." });
            return;
        }
        setIsSaving(true);
        
        if (!product) {
            const productLimit = userData?.plan?.limits?.products ?? 0;
            // This logic is imperfect for multi-company, we'd need to check per company
            // For now, let's assume a global limit for simplicity
            const allProducts = await Promise.all(values.companyIds.map(id => getProducts(id)));
            const totalProducts = allProducts.flat().length;

            if (totalProducts >= productLimit) {
                toast({
                    variant: "destructive",
                    title: "Limite de Produtos Atingido",
                    description: "Você atingiu o limite de produtos para o seu plano atual. Considere fazer um upgrade.",
                });
                setIsSaving(false);
                router.push('/dashboard/products');
                return;
            }
        }

        let mainImageUrl = product?.images?.mainImage || "";
        if (mainImageFile && user) {
            const path = `products/${user.uid}/${values.name.replace(/\s+/g, '-')}-main-${Date.now()}`;
            mainImageUrl = await uploadFile(mainImageFile, path);
        }

        
        const productData = {
            ...values,
            slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            isActive: true,
            pricing: values.pricing.map(p => ({ ...p, minQuantity: 1, quantityRule: 'perItem' as const })),
            tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
            attributes: values.attributes.map(a => ({...a, options: a.options.split(',').map(o => o.trim())})),
            isVerified: false,
            images: { mainImage: mainImageUrl, gallery: product?.images?.gallery || [] },
            categories: product?.categories || [],
            collections: product?.collections || [],
        };
        
        try {
            if (product) {
                await updateProduct(product.id, productData);
                toast({ title: t('productForm.updateSuccess.title') });
            } else {
                await addProduct(productData as Omit<Product, 'id'|'createdAt'|'updatedAt'>);
                toast({ title: t('productForm.createSuccess.title') });
            }
            router.push('/dashboard/products');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('productForm.error.genericTitle'),
                description: t('productForm.error.genericDescription'),
            });
        } finally {
            setIsSaving(false);
        }
    }

    const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Produto</CardTitle>
                                <CardDescription>Preencha os detalhes essenciais do seu produto.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Camiseta Básica de Algodão" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Descrição</FormLabel>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                            Gerar com IA
                                        </Button>
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Imagens e Mídia</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <FormItem>
                                        <FormLabel>Imagem Principal</FormLabel>
                                        <Label htmlFor="main-image-upload" className="cursor-pointer">
                                            <Card className="relative aspect-video w-full border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                                                {mainImagePreview ? (
                                                    <Image src={mainImagePreview} alt="Pré-visualização da imagem principal" layout="fill" className="rounded-md object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="mx-auto h-12 w-12" />
                                                        <p className="text-sm mt-2">Clique para enviar a imagem principal</p>
                                                    </div>
                                                )}
                                            </Card>
                                        </Label>
                                        <Input id="main-image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'main')} />
                                    </FormItem>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Preços</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {priceFields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                                        <FormField control={form.control} name={`pricing.${index}.label`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Rótulo</FormLabel><FormControl><Input placeholder="Varejo" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`pricing.${index}.price`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Preço</FormLabel><FormControl><Input type="number" placeholder="99.90" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`pricing.${index}.currency`} render={({ field }) => (
                                            <FormItem><FormLabel>Moeda</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="BRL">BRL</SelectItem>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="EUR">EUR</SelectItem>
                                                    </SelectContent>
                                                </Select><FormMessage /></FormItem>
                                        )}/>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removePrice(index)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendPrice({ label: '', price: 0, currency: 'BRL' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Faixa de Preço</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Atributos e Variações</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {attributeFields.map((field, index) => (
                                     <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                                         <FormField control={form.control} name={`attributes.${index}.name`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Atributo</FormLabel><FormControl><Input placeholder="Cor" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                         <FormField control={form.control} name={`attributes.${index}.options`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Opções (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Azul, Verde, Preto" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeAttribute(index)}><Trash2 className="h-4 w-4" /></Button>
                                     </div>
                                ))}
                                 <Button type="button" variant="outline" size="sm" onClick={() => appendAttribute({ name: '', options: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Atributo</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Lateral */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="companyIds"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Empresas</FormLabel>
                                        <MultiSelect
                                            options={companyOptions}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Selecione as empresas..."
                                            className="w-full"
                                            disabled={loadingCompanies}
                                        />
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem><FormLabel>Status do Produto</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Disponível</SelectItem>
                                                <SelectItem value="out-of-stock">Fora de Estoque</SelectItem>
                                                <SelectItem value="discontinued">Descontinuado</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="visibility" render={({ field }) => (
                                    <FormItem><FormLabel>Visibilidade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="public">Público</SelectItem>
                                                <SelectItem value="private">Privado</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="sku" render={({ field }) => (
                                    <FormItem><FormLabel>SKU (Código)</FormLabel><FormControl><Input placeholder="SKU12345" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="availableStock" render={({ field }) => (
                                    <FormItem><FormLabel>Estoque Disponível</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="tags" render={({ field }) => (
                                    <FormItem><FormLabel>Tags (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Ex: promoção, verão, unissex" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                <CardFooter className="flex justify-end gap-2 mt-8 p-0">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? "Salvar Alterações" : "Criar Produto"}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
