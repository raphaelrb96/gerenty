"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTransition, useEffect } from 'react';

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
import { Bot, Loader2 } from "lucide-react";

const formSchema = z.object({
  productName: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  attributes: z.string().min(3, { message: "Please list some key attributes." }),
  description: z.string().optional(),
  price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive()),
  stock: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().nonnegative()),
});

type ProductFormProps = {
    product?: { name: string, price: string, stock: number } | null,
    onFinished: () => void;
}

export function ProductForm({ product, onFinished }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      attributes: "",
      description: "",
      price: 0,
      stock: 0,
    },
  });

  useEffect(() => {
    if (product) {
        form.reset({
            productName: product.name,
            attributes: 'ergonomic, black, mesh',
            price: parseFloat(product.price.substring(1)),
            stock: product.stock
        })
    }
  }, [product, form])

  const { setValue, watch } = form;

  const handleGenerateDescription = () => {
    const productName = watch('productName');
    const attributes = watch('attributes');

    if (!productName || !attributes) {
        toast({
            title: "Missing Information",
            description: "Please enter a product name and attributes first.",
            variant: "destructive",
        })
        return;
    }

    startTransition(async () => {
        try {
            const result = await generateProductDescription({ productName, attributes });
            setValue('description', result.description, { shouldValidate: true });
            toast({
                title: "Description Generated!",
                description: "The AI has generated a new product description.",
            })
        } catch (error) {
            toast({
                title: "Generation Failed",
                description: "Could not generate description. Please try again.",
                variant: "destructive",
            })
        }
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
        title: product ? "Product Updated" : "Product Created",
        description: `${values.productName} has been saved successfully.`,
    })
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ergonomic Office Chair" {...field} />
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
              <FormLabel>Key Attributes</FormLabel>
              <FormControl>
                <Input placeholder="e.g. black, mesh, adjustable arms" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="space-y-2">
            <div className="flex items-center justify-between">
                <FormLabel htmlFor="description">Product Description</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate with AI
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
                        placeholder="A detailed description of the product..."
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
                    <FormLabel>Price</FormLabel>
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
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="25" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Save Product</Button>
        </div>
      </form>
    </Form>
  );
}
