
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTransition, useEffect, useState } from 'react';
import { useAuth } from "@/context/auth-context";

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
import { useToast } from "@/hooks/use-toast";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import { addProduct, updateProduct } from "@/services/product-service";
import { Bot, Loader2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useTranslation } from "@/context/i18n-context";
import { useCompany } from "@/context/company-context";

const formSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().optional(),
  price: z.preprocess((a) => parseFloat(z.string().parse(a).replace(",", ".")), z.number().positive()),
  stock: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().nonnegative()),
  // Added for the AI generation, not part of the Product model itself but useful for the form
  attributes: z.string().min(3, { message: "Please list some key attributes." }),
});

type ProductFormValues = z.infer<typeof formSchema>;

type ProductFormProps = {
    product?: Product | null;
    onFinished: () => void;
}

export function ProductForm({ product, onFinished }: ProductFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, startGenerateTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      attributes: "",
      description: "",
      price: 0,
      stock: 0,
    },
  });

  useEffect(() => {
    if (product) {
        form.reset({
            name: product.name,
            description: product.description || '',
            price: product.pricing?.[0]?.price || 0,
            stock: typeof product.availableStock === 'number' ? product.availableStock : 0,
            attributes: product.tags?.join(', ') || ''
        })
    } else {
        form.reset({
            name: "",
            attributes: "",
            description: "",
            price: 0,
            stock: 0,
        });
    }
  }, [product, form])

  const { setValue, watch } = form;

  const handleGenerateDescription = () => {
    const productName = watch('name');
    const attributes = watch('attributes');

    if (!productName || !attributes) {
        toast({
            title: t('productForm.generateError.title'),
            description: t('productForm.generateError.description'),
            variant: "destructive",
        })
        return;
    }

    startGenerateTransition(async () => {
        try {
            const result = await generateProductDescription({ productName, attributes });
            setValue('description', result.description, { shouldValidate: true });
            toast({
                title: t('productForm.generateSuccess.title'),
                description: t('productForm.generateSuccess.description'),
            })
        } catch (error) {
            toast({
                title: t('productForm.generateFailed.title'),
                description: t('productForm.generateFailed.description'),
                variant: "destructive",
            })
        }
    });
  };

  async function onSubmit(values: ProductFormValues) {
    if (!user || !activeCompany) {
        toast({ variant: "destructive", title: t('productForm.error.noUser') });
        return;
    }
    
    setIsSaving(true);

    const productData: Partial<Product> = {
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, '-'),
        description: values.description || '',
        pricing: [{
            label: 'Varejo',
            price: values.price,
            minQuantity: 1,
            currency: 'BRL',
            quantityRule: 'perItem'
        }],
        availableStock: values.stock,
        tags: values.attributes.split(',').map(attr => attr.trim()),
        companyIds: [activeCompany.id],
        isActive: true,
        status: 'available',
        visibility: 'public',
        isVerified: false,
    };

    try {
        if (product) {
            // Update existing product
            // Ensure companyIds is handled correctly when updating
            const updatedProductData = {
                ...productData,
                companyIds: product.companyIds.includes(activeCompany.id) 
                    ? product.companyIds 
                    : [...product.companyIds, activeCompany.id]
            };
            await updateProduct(product.id, updatedProductData);
            toast({
                title: t('productForm.updateSuccess.title'),
                description: `${values.name} ${t('productForm.updateSuccess.description')}`,
            });
        } else {
            // Create new product
            await addProduct(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
            toast({
                title: t('productForm.createSuccess.title'),
                description: `${values.name} ${t('productForm.createSuccess.description')}`,
            });
        }
        onFinished();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('productForm.name.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('productForm.name.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attributes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('productForm.attributes.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('productForm.attributes.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="space-y-2">
            <div className="flex items-center justify-between">
                <FormLabel htmlFor="description">{t('productForm.description.label')}</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    {t('productForm.generateButton')}
                </Button>
            </div>
            <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                <FormControl>
                    <Textarea
                        id="description"
                        placeholder={t('productForm.description.placeholder')}
                        className="min-h-[120px]"
                        {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
         </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('productForm.price.label')}</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="299.99" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('productForm.stock.label')}</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>{t('productForm.cancel')}</Button>
            <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? t('productForm.save') : t('productForm.createButton', {})}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    
