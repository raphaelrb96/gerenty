
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch, Control, FormProvider, useFormContext } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct, getProductsByUser } from "@/services/product-service";
import type { Product } from "@/lib/types";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import { uploadFile } from "@/services/storage-service";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Bot, Upload, Trash2, PlusCircle, Star } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { Label } from "../ui/label";
import Image from "next/image";
import { MultiSelect } from "../ui/multi-select";
import { Switch } from "../ui/switch";
import { CategorySelector } from "./category-selector";
import { CollectionSelector } from "./collection-selector";
import { Separator } from "../ui/separator";

const priceRuleSchema = z.object({
  type: z.enum(["none", "minQuantity", "minCartValue", "paymentMethod", "purchaseType"]),
  value: z.any().optional(),
});

const commissionSchema = z.object({
    type: z.enum(['fixed', 'percentage']).default('fixed'),
    value: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0).optional()),
});

const formSchema = z.object({
  name: z.string().min(3, "O nome do produto deve ter pelo menos 3 caracteres."),
  slug: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  
  costPrice: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  extraCosts: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0).optional()),
  
  pricing: z.array(z.object({
    label: z.string().min(1, "O rótulo é obrigatório"),
    price: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
    rule: priceRuleSchema.optional(),
    commission: commissionSchema.optional(),
  })).min(1, "Adicione pelo menos um preço."),

  manageStock: z.boolean().default(true),
  availableStock: z.preprocess((a) => parseInt(String(a || "0"), 10), z.number().int().nonnegative()),

  status: z.enum(['available', 'out-of-stock', 'discontinued']),
  visibility: z.enum(['public', 'private']),
  
  tags: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  
  attributes: z.array(z.object({
      name: z.string().min(1, "O nome do atributo é obrigatório"),
      options: z.string().min(1, "Adicione pelo menos uma opção"),
  })),

  companyIds: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormProps = {
    product?: Product | null;
}

type ImageState = {
    file: File | null;
    url: string;
};

const PriceRuleInput = ({ control, index, ruleType }: { control: any, index: number, ruleType: string }) => {
    const { t } = useTranslation();
    
    if (index === 0) return null;

    switch (ruleType) {
        case 'minQuantity':
            return <FormField control={control} name={`pricing.${index}.rule.value`} render={({ field }) => (<FormItem><FormLabel>Quantidade Mínima</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)} />;
        case 'minCartValue':
            return <FormField control={control} name={`pricing.${index}.rule.value`} render={({ field }) => (<FormItem><FormLabel>Valor Mínimo (R$)</FormLabel><FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>)} />;
        case 'paymentMethod':
            return <FormField control={control} name={`pricing.${index}.rule.value`} render={({ field }) => (<FormItem><FormLabel>Forma de Pagamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pix">{t('paymentMethods.pix')}</SelectItem><SelectItem value="dinheiro">{t('paymentMethods.cash')}</SelectItem><SelectItem value="credito">{t('paymentMethods.credit')}</SelectItem><SelectItem value="debito">{t('paymentMethods.debit')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />;
        case 'purchaseType':
            return <FormField control={control} name={`pricing.${index}.rule.value`} render={({ field }) => (<FormItem><FormLabel>Tipo de Compra</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="presencial">Presencial</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />;
        default:
            return null;
    }
};

const ProfitCalculator = ({ priceTier, costPrice, extraCosts }: { priceTier: any, costPrice: number, extraCosts: number }) => {
    const sellingPrice = priceTier.price || 0;
    const commissionType = priceTier.commission?.type || 'fixed';
    const commissionValue = priceTier.commission?.value || 0;
    
    const commissionAmount = commissionType === 'percentage' 
        ? sellingPrice * (commissionValue / 100) 
        : commissionValue;

    const totalCost = (costPrice || 0) + (extraCosts || 0) + commissionAmount;
    const profit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return (
        <div className="grid grid-cols-2 gap-4 mt-2">
            <FormItem>
                <FormLabel>Lucro (R$)</FormLabel>
                <FormControl>
                    <Input type="number" value={profit.toFixed(2)} disabled className="font-bold text-base" />
                </FormControl>
            </FormItem>
            <FormItem>
                <FormLabel>Margem (%)</FormLabel>
                <FormControl>
                    <Input type="number" value={margin.toFixed(2)} disabled className="font-bold text-base" />
                </FormControl>
            </FormItem>
        </div>
    );
};


export function ProductFormNew({ product }: ProductFormProps) {
    const router = useRouter();
    const { t, language } = useTranslation();
    const { user, userData, effectiveOwnerId } = useAuth();
    const { companies, loading: loadingCompanies } = useCompany();
    const { toast } = useToast();

    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, startGenerateTransition] = useTransition();
    const [images, setImages] = useState<ImageState[]>([]);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {} : {
            name: "",
            slug: "",
            description: "",
            sku: "",
            costPrice: 0,
            extraCosts: 0,
            pricing: [{ label: 'Padrão', price: 0, rule: { type: 'none' }, commission: { type: 'fixed', value: 0 } }],
            manageStock: true,
            availableStock: 0,
            status: "available",
            visibility: "public",
            tags: "",
            categoryIds: [],
            collectionIds: [],
            attributes: [],
            companyIds: [],
        },
    });

    const { formState: { isSubmitting }, control } = form;
    
    const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({ control: form.control, name: "pricing" });
    const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({ control: form.control, name: "attributes" });

    const watchManageStock = form.watch("manageStock");
    const watchedPricing = form.watch("pricing");
    const watchedCostPrice = form.watch("costPrice");
    const watchedExtraCosts = form.watch("extraCosts");


    useEffect(() => {
        if (product) {
            const stockIsManaged = typeof product.availableStock === 'number';
            form.reset({
                name: product.name ?? "",
                slug: product.slug ?? "",
                description: product.description ?? "",
                sku: product.sku ?? "",
                costPrice: product.costPrice ?? 0,
                extraCosts: product.extraCosts ?? 0,
                pricing: product.pricing?.map(p => ({ 
                    label: p.label, 
                    price: p.price, 
                    rule: p.rule || { type: 'none' },
                    commission: p.commission || { type: 'fixed', value: 0 }
                })) || [{ label: 'Padrão', price: 0, rule: { type: 'none' }, commission: { type: 'fixed', value: 0 } }],
                manageStock: stockIsManaged,
                availableStock: stockIsManaged ? (product?.availableStock || 0) : 0,
                status: product.status ?? "available",
                visibility: product.visibility ?? "public",
                tags: product.tags?.join(', ') ?? "",
                categoryIds: product.categoryIds ?? [],
                collectionIds: product.collectionIds ?? [],
                attributes: product.attributes?.map(a => ({ name: a.name, options: a.options.join(', ') })) ?? [],
                companyIds: product.companyIds ?? [],
            });

            const existingImages: ImageState[] = [];
            if (product.images?.mainImage) {
                existingImages.push({ file: null, url: product.images.mainImage });
            }
            if (product.images?.gallery) {
                existingImages.push(...product.images.gallery.map(url => ({ file: null, url })));
            }
            setImages(existingImages);
        }
    }, [product, form]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImageStates: ImageState[] = Array.from(files).map(file => ({
                file: file,
                url: URL.createObjectURL(file)
            }));
            setImages(prev => [...prev, ...newImageStates]);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSetMainImage = (indexToSet: number) => {
        if (indexToSet === 0) return;
        setImages(prevImages => {
            const newImages = [...prevImages];
            const [itemToMove] = newImages.splice(indexToSet, 1);
            newImages.unshift(itemToMove);
            return newImages;
        });
    };

    const handleGenerateDescription = () => {
        const productName = form.getValues('name');
        const tags = form.getValues('tags');
    
        if (!productName) {
            toast({ title: t('productForm.generateError.title'), description: t('productForm.generateError.description'), variant: "destructive" });
            return;
        }
    
        startGenerateTransition(async () => {
            try {
                const result = await generateProductDescription({ productName, attributes: tags || '', language });
                form.setValue('description', result.description, { shouldValidate: true });
                toast({ title: t('productForm.generateSuccess.title') });
            } catch (error) {
                toast({ title: t('productForm.generateFailed.title'), description: t('productForm.generateFailed.description'), variant: "destructive" });
            }
        });
    };

    async function onSubmit(values: ProductFormValues) {
        if (!effectiveOwnerId) {
            toast({ variant: "destructive", title: t('productForm.error.noUser'), description: "Você precisa estar logado para criar um produto." });
            return;
        }

        if (images.length === 0) {
            toast({ variant: "destructive", title: "Imagem Necessária", description: "Por favor, adicione pelo menos uma imagem para o produto." });
            return;
        }
        
        setIsUploading(true);

        try {
            if (!product) {
                const productLimit = userData?.plan?.limits?.products ?? 0;
                const userProducts = await getProductsByUser(effectiveOwnerId);
                if (userProducts.length >= productLimit) {
                    toast({ variant: "destructive", title: "Limite de Produtos Atingido", description: "Você atingiu o limite de produtos para o seu plano atual." });
                    router.push('/dashboard/products');
                    return;
                }
            }
            
            const uploadPromises = images.map(imageState => {
                if (imageState.file) {
                    const path = `products/${effectiveOwnerId}/${values.name.replace(/\s+/g, '-')}-${Date.now()}`;
                    return uploadFile(imageState.file, path);
                }
                return Promise.resolve(imageState.url);
            });
            
            const uploadedUrls = await Promise.all(uploadPromises);
            
            const productData: Partial<Product> = {
                ...values,
                ownerId: effectiveOwnerId,
                availableStock: values.manageStock ? values.availableStock : true,
                slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                isActive: true,
                tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
                categoryIds: values.categoryIds || [],
                collectionIds: values.collectionIds || [],
                attributes: values.attributes.map(a => ({...a, options: a.options.split(',').map(o => o.trim())})),
                isVerified: false,
                images: { 
                    mainImage: uploadedUrls[0] || "",
                    gallery: uploadedUrls.slice(1)
                },
            };
            
            if (product) {
                await updateProduct(product.id, productData);
                toast({ title: t('productForm.updateSuccess.title', { productName: values.name }) });
            } else {
                await addProduct(productData as Omit<Product, 'id'|'createdAt'|'updatedAt'>);
                toast({ title: t('productForm.createSuccess.title', { productName: values.name }) });
            }
            router.push('/dashboard/products');
            router.refresh();
        } catch (error) {
            console.error("Error saving product:", error);
            toast({ variant: "destructive", title: t('productForm.error.genericTitle'), description: t('productForm.error.genericDescription') });
        } finally {
            setIsUploading(false);
        }
    }

    const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));
    const isButtonDisabled = isSubmitting || isUploading;

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Produto</CardTitle>
                                <CardDescription>Preencha os detalhes essenciais do seu produto.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Camiseta Básica de Algodão" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Descrição</FormLabel>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                            {t('productForm.generateButton')}
                                        </Button>
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Imagens</CardTitle></CardHeader>
                            <CardContent>
                                <FormItem>
                                    <FormLabel>Galeria de Imagens</FormLabel>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {images.map((image, index) => (
                                            <div key={image.url} className="relative group aspect-square">
                                                <Image src={image.url} alt={`Preview ${index + 1}`} layout="fill" className={cn("rounded-md object-cover transition-all", index === 0 && "ring-2 ring-primary ring-offset-2")}/>
                                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleRemoveImage(index)}><Trash2 className="h-3 w-3" /><span className="sr-only">Remover Imagem</span></Button>
                                                    {index > 0 && (<Button type="button" variant="default" size="icon" className="h-6 w-6 rounded-full bg-primary/80 hover:bg-primary" onClick={() => handleSetMainImage(index)}><Star className="h-3 w-3" /><span className="sr-only">Tornar Principal</span></Button>)}
                                                </div>
                                                {index === 0 && (<div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-xs text-center py-0.5 rounded-b-md">Principal</div>)}
                                            </div>
                                        ))}
                                        <Label htmlFor="gallery-upload" className="cursor-pointer aspect-square border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors rounded-md">
                                            <Upload className="h-8 w-8" />
                                            <span className="text-xs text-center mt-1">Adicionar Imagens</span>
                                        </Label>
                                        <Input id="gallery-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">A primeira imagem da lista será a imagem principal do produto.</p>
                                </FormItem>
                            </CardContent>
                        </Card>
                        
                         <Card>
                            <CardHeader>
                                <CardTitle>Custos, Lucro e Preços</CardTitle>
                                <CardDescription>Defina seus custos e as faixas de preço para este produto.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="costPrice" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preço de Custo</FormLabel>
                                            <FormControl><Input type="number" placeholder="19.90" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                     <FormField control={form.control} name="extraCosts" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custos Extras (p/ un.)</FormLabel>
                                            <FormControl><Input type="number" placeholder="1.50" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                <Separator />
                                {priceFields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-md space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{index === 0 ? "Preço Padrão" : `Faixa de Preço ${index + 1}`}</p>
                                            {index > 0 && (<Button type="button" variant="ghost" size="icon" onClick={() => removePrice(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            <FormField control={form.control} name={`pricing.${index}.label`} render={({ field }) => (<FormItem><FormLabel>Rótulo</FormLabel><FormControl><Input placeholder="Varejo" {...field} disabled={index === 0} value={index === 0 ? "Padrão" : field.value} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name={`pricing.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Preço de Venda</FormLabel><FormControl><Input type="number" placeholder="99.90" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name={`pricing.${index}.rule.type`} render={({ field }) => (<FormItem><FormLabel>Regra</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={index === 0}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Padrão (Sem Regra)</SelectItem><SelectItem value="minQuantity">Quantidade Mínima</SelectItem><SelectItem value="minCartValue">Valor Mínimo do Carrinho</SelectItem><SelectItem value="paymentMethod">Forma de Pagamento</SelectItem><SelectItem value="purchaseType">Tipo de Compra</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                            <PriceRuleInput control={form.control} index={index} ruleType={watchedPricing[index]?.rule?.type ?? 'none'} />
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`pricing.${index}.commission.type`} render={({ field }) => (<FormItem><FormLabel>Tipo de Comissão</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixo (R$)</SelectItem><SelectItem value="percentage">Porcentagem (%)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name={`pricing.${index}.commission.value`} render={({ field }) => (<FormItem><FormLabel>Valor da Comissão</FormLabel><FormControl><Input type="number" placeholder="10.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        </div>
                                        <ProfitCalculator 
                                            priceTier={watchedPricing[index]} 
                                            costPrice={watchedCostPrice} 
                                            extraCosts={watchedExtraCosts || 0}
                                        />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendPrice({ label: '', price: 0, rule: { type: 'none' }, commission: { type: 'fixed', value: 0 }  })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Faixa de Preço</Button>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader><CardTitle>Atributos e Variações</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {attributeFields.map((field, index) => (
                                     <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                                         <FormField control={form.control} name={`attributes.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Atributo</FormLabel><FormControl><Input placeholder="Cor" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                         <FormField control={form.control} name={`attributes.${index}.options`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Opções (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Azul, Verde, Preto" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeAttribute(index)}><Trash2 className="h-4 w-4" /></Button>
                                     </div>
                                ))}
                                 <Button type="button" variant="outline" size="sm" onClick={() => appendAttribute({ name: '', options: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Atributo</Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="companyIds" render={({ field }) => (<FormItem><FormLabel>Empresas (Opcional)</FormLabel><MultiSelect options={companyOptions} selected={field.value} onChange={field.onChange} placeholder="Selecione as empresas..." className="w-full" disabled={loadingCompanies}/><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status do Produto</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="available">Disponível</SelectItem><SelectItem value="out-of-stock">Fora de Estoque</SelectItem><SelectItem value="discontinued">Descontinuado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="visibility" render={({ field }) => (<FormItem><FormLabel>Visibilidade</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="public">Público</SelectItem><SelectItem value="private">Privado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU (Código)</FormLabel><FormControl><Input placeholder="SKU12345" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="manageStock" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Gerenciar Estoque</FormLabel><FormDescription className="text-xs">Ative para controlar a quantidade disponível.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                                {watchManageStock && (<FormField control={form.control} name="availableStock" render={({ field }) => (<FormItem><FormLabel>Estoque Disponível</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>)}
                                <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Ex: promoção, unissex" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="categoryIds" render={({ field }) => (<FormItem><CategorySelector selectedCategories={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Coleções</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="collectionIds" render={({ field }) => (<FormItem><CollectionSelector selectedCollections={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>

                    </div>
                </div>
                
                <CardFooter className="flex justify-end gap-2 mt-8 p-0">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isButtonDisabled}>
                        {isButtonDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? "Salvar Alterações" : "Criar Produto"}
                    </Button>
                </CardFooter>
            </form>
        </FormProvider>
    );
}

    


