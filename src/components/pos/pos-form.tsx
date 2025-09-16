

"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addOrder } from "@/services/order-service";
import type { Product, OrderItem, OrderStatus, PaymentMethod, DeliveryMethod, Order } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, User, CreditCard, ShoppingCart } from "lucide-react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";
import { CartItem } from "./cart-item";


const formSchema = z.object({
  customerName: z.string().min(2, "Nome do cliente é obrigatório."),
  customerEmail: z.string().email("Email inválido."),
  customerPhone: z.string().optional(),
  customerDocument: z.string().optional(),
  paymentMethod: z.enum(["credito", "debito", "pix", "dinheiro", "boleto", "link", "outros"]),
  paymentStatus: z.enum(["aguardando", "aprovado", "recusado", "estornado"]),
  deliveryMethod: z.enum(["retirada_loja", "entrega_padrao", "correios", "logistica_propria", "digital"]),
  shippingCost: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  discount: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  notes: z.string().optional(),
});

type PosFormValues = z.infer<typeof formSchema>;

type PosFormProps = {
  cart: OrderItem[];
  setCart: React.Dispatch<React.SetStateAction<OrderItem[]>>;
};

export function PosForm({ cart, setCart }: PosFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PosFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
      paymentMethod: "credito",
      paymentStatus: "aprovado",
      deliveryMethod: "retirada_loja",
      shippingCost: 0,
      discount: 0,
      notes: "",
    },
  });

  const { control, setValue, getValues, watch } = form;

  const watchedDiscount = watch('discount', 0);
  const watchedShippingCost = watch('shippingCost', 0);

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const total = subtotal - watchedDiscount + watchedShippingCost;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.productId === productId 
      ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
      : item
    ));
  };
  
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  }

  const handleUpdatePrice = (productId: string, newPrice: number) => {
      setCart(cart.map(item => 
          item.productId === productId 
          ? { ...item, unitPrice: newPrice, totalPrice: newPrice * item.quantity }
          : item
      ));
  };


  async function onSubmit(values: PosFormValues) {
    if (!user || !activeCompany) {
        toast({ variant: "destructive", title: t('pos.error.notLoggedIn') });
        return;
    }
    if (cart.length === 0) {
        toast({ variant: "destructive", title: "Carrinho Vazio", description: "Adicione produtos ao carrinho para criar um pedido." });
        return;
    }
    
    setIsSaving(true);
    
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: activeCompany.id,
        customer: {
            name: values.customerName,
            email: values.customerEmail,
            phone: values.customerPhone,
            document: values.customerDocument,
        },
        items: cart.map(({imageUrl, ...item}) => item), // Remove imageUrl from saved data
        status: 'completed' as OrderStatus,
        payment: {
            method: values.paymentMethod as PaymentMethod,
            status: values.paymentStatus,
            type: 'presencial'
        },
        shipping: {
            method: values.deliveryMethod as DeliveryMethod,
            cost: values.shippingCost,
            estimatedDelivery: { type: 'dias', value: 0 }, 
        },
        subtotal: subtotal,
        discount: values.discount,
        shippingCost: values.shippingCost,
        total: total,
        notes: values.notes,
    };

    try {
        await addOrder(orderData);
        toast({
            title: t('pos.success.title'),
            description: t('pos.success.description', { customerName: values.customerName }),
        });
        
        setCart([]);
        form.reset();
    } catch(error) {
        console.error(error);
        toast({ variant: "destructive", title: t('pos.error.title'), description: t('pos.error.description') });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6"/> {t('pos.cart.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto space-y-4 pr-2 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>{t('pos.cart.empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <CartItem 
                                    key={item.productId}
                                    item={item}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onUpdatePrice={handleUpdatePrice}
                                    onRemove={handleRemoveFromCart}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="flex-shrink-0 p-6 space-y-4 border-t">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground"><span>{t('orderDetails.subtotal')}</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between text-sm text-muted-foreground"><span>{t('pos.summary.shippingCost')}</span><span>{formatCurrency(watchedShippingCost)}</span></div>
                        <div className="flex justify-between text-sm text-muted-foreground"><span>{t('pos.summary.discount')}</span><span className="text-destructive">- {formatCurrency(watchedDiscount)}</span></div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg"><span>{t('orderDetails.total')}</span><span>{formatCurrency(total)}</span></div>
                    </div>
                
                    <Accordion type="multiple" className="w-full">
                        <AccordionItem value="customer">
                            <AccordionTrigger className="font-semibold text-base"><div className="flex items-center gap-2"><User className="h-5 w-5"/>{t('pos.customer.title')}</div></AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="customerName" render={({ field }) => (
                                        <FormItem><FormLabel>{t('pos.customer.name')}</FormLabel><FormControl><Input placeholder={t('pos.customer.namePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                                        <FormItem><FormLabel>{t('pos.customer.email')}</FormLabel><FormControl><Input placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="payment">
                            <AccordionTrigger className="font-semibold text-base"><div className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t('pos.payment.title')}</div></AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="shippingCost" render={({ field }) => (
                                        <FormItem><FormLabel>{t('pos.summary.shippingCost')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="discount" render={({ field }) => (
                                        <FormItem><FormLabel>{t('pos.summary.discount')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem><FormLabel>{t('pos.payment.method')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="credito">{t('paymentMethods.credit')}</SelectItem>
                                                <SelectItem value="debito">{t('paymentMethods.debit')}</SelectItem>
                                                <SelectItem value="pix">{t('paymentMethods.pix')}</SelectItem>
                                                <SelectItem value="dinheiro">{t('paymentMethods.cash')}</SelectItem>
                                                <SelectItem value="outros">{t('paymentMethods.other')}</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                )}/>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <CardFooter className="flex-shrink-0">
                    <Button type="submit" className="w-full" size="lg" disabled={isSaving || cart.length === 0 || !activeCompany} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('pos.submitButton')} ({formatCurrency(total)})
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
