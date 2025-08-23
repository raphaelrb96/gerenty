
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
import { uploadFile } from "@/services/storage-service";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { CategorySelector } from "./category-selector";
import { CollectionSelector } from "./collection-selector";

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

  manageStock: z.boolean().default(true),
  availableStock: z.preprocess((a) => parseInt(z.string().parse(a || "0"), 10), z.number().int().nonnegative()),

  status: z.enum(['available', 'out-of-stock', 'discontinued']),
  visibility: z.enum(['public', 'private']),
  
  tags: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  
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
    
    // Unified state for all images
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);


    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {} : {
            name: "",
            slug: "",
            description: "",
            sku: "",
            pricing: [{ label: 'Varejo', price: 0, currency: 'BRL' }],
            manageStock: true,
            availableStock: 0,
            status: "available",
            visibility: "public",
            tags: "",
            categoryIds: [],
            collectionIds: [],
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

    const watchManageStock = form.watch("manageStock");

    useEffect(() => {
        if (product) {
            const stockIsManaged = typeof product.availableStock === 'number';
            form.reset({
                name: product.name,
                slug: product.slug,
                description: product.description || '',
                sku: product.sku || '',
                pricing: product.pricing?.map(p => ({ label: p.label, price: p.price, currency: p.currency })) || [{ label: 'Varejo', price: 0, currency: 'BRL' }],
                manageStock: stockIsManaged,
                availableStock: stockIsManaged ? product.availableStock : 0,
                status: product.status,
                visibility: product.visibility,
                tags: product.tags?.join(', ') || '',
                categoryIds: product.categoryIds || [],
                collectionIds: product.collectionIds || [],
                attributes: product.attributes?.map(a => ({ name: a.name, options: a.options.join(', ') })) || [],
                companyIds: product.companyIds || [],
            });
            // Populate image previews from existing product data
            const existingImages = [];
            if (product.images?.mainImage) {
                existingImages.push(product.images.mainImage);
            }
            if (product.images?.gallery) {
                existingImages.push(...product.images.gallery);
            }
            setImagePreviews(existingImages);

        }
    }, [product, form]);
    
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);
            
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSetMainImage = (indexToSet: number) => {
        if (indexToSet === 0) return; // Already the main image

        const newImagePreviews = [...imagePreviews];
        const [itemToMove] = newImagePreviews.splice(indexToSet, 1);
        newImagePreviews.unshift(itemToMove);
        setImagePreviews(newImagePreviews);

        const newImageFiles = [...imageFiles];
        // This is tricky if files and previews are out of sync (e.g. on edit)
        // We only need to reorder if the files have been staged for upload
        if(imageFiles.length === imagePreviews.length) {
          const [fileToMove] = newImageFiles.splice(indexToSet, 1);
          newImageFiles.unshift(fileToMove);
          setImageFiles(newImageFiles);
        } else {
            toast({
                title: "Aviso",
                description: "A reordenação de imagens já existentes será salva, mas não afeta os arquivos originais. Apenas novas imagens podem ter sua ordem de upload alterada.",
                variant: "default"
            });
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
        
        // This logic needs to be smarter. It needs to differentiate between existing URLs and new files.
        const uploadedUrls = await Promise.all(imageFiles.map(file => {
            const path = `products/${user.uid}/gallery/${values.name.replace(/\s+/g, '-')}-${file.name}-${Date.now()}`;
            return uploadFile(file, path);
        }));

        // Combine existing urls (that were not removed) with new urls
        const finalImageUrls = imagePreviews.filter(p => p.startsWith('http')).concat(uploadedUrls);

        const mainImageUrl = finalImageUrls[0] || "";
        const galleryImageUrls = finalImageUrls.slice(1);
        
        const productData = {
            ...values,
            availableStock: values.manageStock ? values.availableStock : true, // Set to true for infinite stock
            slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            isActive: true,
            pricing: values.pricing.map(p => ({ ...p, minQuantity: 1, quantityRule: 'perItem' as const })),
            tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
            categoryIds: values.categoryIds || [],
            collectionIds: values.collectionIds || [],
            attributes: values.attributes.map(a => ({...a, options: a.options.split(',').map(o => o.trim())})),
            isVerified: false,
            images: { mainImage: mainImageUrl, gallery: galleryImageUrls },
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
                            <CardHeader><CardTitle>Imagens</CardTitle></CardHeader>
                            <CardContent>
                                <FormItem>
                                    <FormLabel>Galeria de Imagens</FormLabel>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {imagePreviews.map((src, index) => (
                                            <div key={src} className="relative group aspect-square">
                                                <Image 
                                                    src={src} 
                                                    alt={`Preview ${index + 1}`} 
                                                    layout="fill" 
                                                    className={cn(
                                                        "rounded-md object-cover transition-all",
                                                        index === 0 && "ring-2 ring-primary ring-offset-2"
                                                    )}
                                                />
                                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        type="button" 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        className="h-6 w-6 rounded-full"
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span className="sr-only">Remover Imagem</span>
                                                    </Button>
                                                    {index > 0 && (
                                                        <Button 
                                                            type="button" 
                                                            variant="default" 
                                                            size="icon" 
                                                            className="h-6 w-6 rounded-full bg-primary/80 hover:bg-primary"
                                                            onClick={() => handleSetMainImage(index)}
                                                        >
                                                            <Star className="h-3 w-3" />
                                                            <span className="sr-only">Tornar Principal</span>
                                                        </Button>
                                                    )}
                                                </div>
                                                {index === 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-xs text-center py-0.5 rounded-b-md">Principal</div>
                                                )}
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
                                
                                <FormField
                                    control={form.control}
                                    name="manageStock"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>Gerenciar Estoque</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Ative para controlar a quantidade disponível.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {watchManageStock && (
                                    <FormField control={form.control} name="availableStock" render={({ field }) => (
                                        <FormItem><FormLabel>Estoque Disponível</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                )}
                                <FormField control={form.control} name="tags" render={({ field }) => (
                                    <FormItem><FormLabel>Tags (separadas por vírgula)</FormLabel><FormControl><Input placeholder="Ex: promoção, unissex" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Categorias</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="categoryIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <CategorySelector
                                                selectedCategories={field.value}
                                                onChange={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Coleções</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="collectionIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <CollectionSelector
                                                selectedCollections={field.value}
                                                onChange={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
