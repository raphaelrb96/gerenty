
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bot, Upload } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

// Esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(3, "O nome do produto deve ter pelo menos 3 caracteres."),
  slug: z.string().min(3, "O slug é obrigatório."),
  description: z.string().optional(),
  sku: z.string().optional(),
  
  price: z.preprocess((a) => parseFloat(z.string().parse(a || "0").replace(",", ".")), z.number().min(0)),
  availableStock: z.preprocess((a) => parseInt(z.string().parse(a || "0"), 10), z.number().int().nonnegative()),

  status: z.enum(['available', 'out-of-stock', 'discontinued']),
  visibility: z.enum(['public', 'private']),
  
  tags: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormProps = {
    product?: Product | null;
}

export function ProductFormNew({ product }: ProductFormProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, userData } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, startGenerateTransition] = useTransition();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            sku: "",
            price: 0,
            availableStock: 0,
            status: "available",
            visibility: "public",
            tags: "",
        },
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                slug: product.slug,
                description: product.description || '',
                sku: product.sku || '',
                price: product.pricing?.[0]?.price || 0,
                availableStock: typeof product.availableStock === 'number' ? product.availableStock : 0,
                status: product.status,
                visibility: product.visibility,
                tags: product.tags?.join(', ') || ''
            });
        }
    }, [product, form]);

    const handleGenerateDescription = () => {
        const productName = form.watch('name');
        const tags = form.watch('tags');
    
        if (!productName || !tags) {
            toast({
                title: t('productForm.generateError.title'),
                description: t('productForm.generateError.description'),
                variant: "destructive",
            });
            return;
        }
    
        startGenerateTransition(async () => {
            try {
                const result = await generateProductDescription({ productName, attributes: tags });
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
        if (!user || !activeCompany) {
            toast({ variant: "destructive", title: t('productForm.error.noUser') });
            return;
        }

        setIsSaving(true);
        
        if (!product) {
            const productLimit = userData?.plan?.limits?.products ?? 0;
            const currentProducts = await getProducts(activeCompany.id);
            if (currentProducts.length >= productLimit) {
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

        const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
            companyIds: product ? product.companyIds : [activeCompany.id],
            name: values.name,
            slug: values.slug,
            description: values.description || '',
            sku: values.sku,
            isActive: true,
            pricing: [{
                label: 'Varejo',
                price: values.price,
                minQuantity: 1,
                currency: 'BRL',
                quantityRule: 'perItem'
            }],
            availableStock: values.availableStock,
            attributes: [], 
            categories: [], 
            collections: [],
            tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
            images: product?.images || { mainImage: '', gallery: [] },
            status: values.status,
            visibility: values.visibility,
            isVerified: false,
        };

        try {
            if (product) {
                await updateProduct(product.id, productData);
                toast({ title: t('productForm.updateSuccess.title') });
            } else {
                await addProduct(productData);
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="slug" render={({ field }) => (
                                    <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                            <CardHeader><CardTitle>Preço e Estoque</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Preço</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="availableStock" render={({ field }) => (
                                        <FormItem><FormLabel>Estoque</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                 <FormField control={form.control} name="sku" render={({ field }) => (
                                    <FormItem><FormLabel>SKU (Código de Barras)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>Imagens</CardTitle></CardHeader>
                            <CardContent>
                                 <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                                        </div>
                                        <input id="dropzone-file" type="file" className="hidden" />
                                    </label>
                                </div> 
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Disponível</SelectItem>
                                                <SelectItem value="out-of-stock">Fora de Estoque</SelectItem>
                                                <SelectItem value="discontinued">Descontinuado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="visibility" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Visibilidade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="public">Público</SelectItem>
                                                <SelectItem value="private">Privado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="tags" render={({ field }) => (
                                    <FormItem><FormLabel>Tags (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Ex: promoção, verão, unissex" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-8">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? "Salvar Alterações" : "Criar Produto"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

