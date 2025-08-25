
"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addOrder } from "@/services/order-service";
import type { Product, OrderItem, OrderStatus, PaymentMethod, DeliveryMethod, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, CreditCard, Truck, ShoppingCart, ArrowLeft } from "lucide-react";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";
import { ProductGrid } from "./product-list";
import { CartItem } from "./cart-item";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customerName: z.string().min(2, "Nome do cliente é obrigatório."),
  customerEmail: z.string().email("Email inválido.").optional().or(z.literal('')),
  customerPhone: z.string().min(1, "Telefone é obrigatório."),
  customerDocument: z.string().optional(),
  paymentMethod: z.enum(["credito", "debito", "pix", "dinheiro", "boleto", "link", "outros"]),
  paymentStatus: z.enum(["aguardando", "aprovado", "recusado", "estornado"]),
  deliveryMethod: z.enum(["retirada_loja", "entrega_padrao", "correios", "logistica_propria", "digital"]),
  shippingCost: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  discount: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  notes: z.string().optional(),
});

type PosFormValues = z.infer<typeof formSchema>;

type PosFormStepperProps = {
  products: Product[];
  cart: OrderItem[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
};

const steps = [
  { id: 1, name: "Carrinho", icon: ShoppingCart },
  { id: 2, name: "Cliente", icon: User },
  { id: 3, name: "Pagamento", icon: CreditCard },
  { id: 4, name: "Finalizar", icon: Truck },
];

export function PosFormStepper({ products, cart, onAddToCart, onUpdateCartQuantity, onRemoveFromCart, onClearCart }: PosFormStepperProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const watchedDiscount = form.watch('discount', 0);
  const watchedShippingCost = form.watch('shippingCost', 0);

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const total = subtotal - (Number(watchedDiscount) || 0) + (Number(watchedShippingCost) || 0);


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof PosFormValues)[] = [];
    if (currentStep === 1 && cart.length === 0) {
        toast({ variant: "destructive", title: "Carrinho vazio", description: "Adicione produtos para continuar." });
        return;
    }
    if (currentStep === 2) {
        fieldsToValidate = ['customerName', 'customerPhone'];
    }

    if (fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate);
        if (!isValid) return;
    }

    if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
    }
  };
  
  async function onSubmit(values: PosFormValues) {
    if (!user || !activeCompany) {
      toast({ variant: "destructive", title: t('pos.error.notLoggedIn') });
      return;
    }
    
    setIsSaving(true);
    
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: activeCompany.id,
        customer: { name: values.customerName, email: values.customerEmail, phone: values.customerPhone, document: values.customerDocument },
        items: cart.map(({imageUrl, ...item}) => item),
        status: 'completed' as OrderStatus,
        payment: { method: values.paymentMethod as PaymentMethod, status: values.paymentStatus, type: 'presencial' },
        shipping: { method: values.deliveryMethod as DeliveryMethod, cost: values.shippingCost, estimatedDelivery: { type: 'dias', value: 0 } },
        subtotal,
        discount: values.discount,
        shippingCost: values.shippingCost,
        total,
        notes: values.notes,
    };

    try {
        await addOrder(orderData);
        toast({ title: t('pos.success.title'), description: t('pos.success.description', { customerName: values.customerName }) });
        onClearCart();
        form.reset();
        setCurrentStep(1);
    } catch(error) {
        console.error(error);
        toast({ variant: "destructive", title: t('pos.error.title'), description: t('pos.error.description') });
    } finally {
        setIsSaving(false);
    }
  }

  const renderStepHeader = (title: string) => (
    <div className="flex items-center gap-4 mb-6">
        {currentStep > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={handlePrevStep} className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        )}
        <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  )

  return (
    <div className="relative bg-muted/40 flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
                    
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="h-full">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            <div className="lg:col-span-2 h-full overflow-y-auto pr-2 no-scrollbar">
                            <ProductGrid products={products} onAddToCart={onAddToCart} />
                            </div>
                            <div className="lg:col-span-1 h-full flex flex-col bg-background rounded-lg border">
                                <h3 className="p-4 text-lg font-semibold border-b flex-shrink-0">Carrinho</h3>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {cart.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Selecione produtos para começar.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {cart.map((item, index) => (
                                                <React.Fragment key={item.productId}>
                                                    <CartItem item={item} onUpdateQuantity={onUpdateCartQuantity} onRemove={onRemoveFromCart} />
                                                    {index < cart.length - 1 && <Separator />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                        <div className="max-w-2xl mx-auto h-full overflow-y-auto p-1">
                            {renderStepHeader("Informações do Cliente")}
                            <div className="space-y-4">
                                <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.name')}</FormLabel><FormControl><Input placeholder={t('pos.customer.namePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.phone')}</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="customerEmail" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.email')} (Opcional)</FormLabel><FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="customerDocument" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.document')} (Opcional)</FormLabel><FormControl><Input placeholder="CPF ou CNPJ" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                        <div className="max-w-2xl mx-auto h-full overflow-y-auto p-1">
                            {renderStepHeader("Pagamento e Entrega")}
                            <div className="space-y-4">
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem><FormLabel>{t('pos.payment.method')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="credito">{t('paymentMethods.credit')}</SelectItem>
                                        <SelectItem value="debito">{t('paymentMethods.debit')}</SelectItem>
                                        <SelectItem value="pix">{t('paymentMethods.pix')}</SelectItem>
                                        <SelectItem value="dinheiro">{t('paymentMethods.cash')}</SelectItem>
                                        <SelectItem value="outros">{t('paymentMethods.other')}</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                                    <FormItem><FormLabel>{t('pos.payment.deliveryMethod')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="retirada_loja">{t('deliveryMethods.pickup')}</SelectItem>
                                        <SelectItem value="entrega_padrao">{t('deliveryMethods.standard')}</SelectItem>
                                        <SelectItem value="logistica_propria">{t('deliveryMethods.own')}</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="shippingCost" render={({ field }) => (<FormItem><FormLabel>{t('pos.summary.shippingCost')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>{t('pos.summary.discount')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
                         <div className="max-w-2xl mx-auto h-full overflow-y-auto p-1">
                            {renderStepHeader("Revisar e Finalizar")}
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-medium">Resumo do Pedido</h3>
                                <div className="text-sm space-y-2">
                                    <p><strong>Cliente:</strong> {form.getValues('customerName')}</p>
                                    <p><strong>Itens:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
                                    <p><strong>Pagamento:</strong> {form.getValues('paymentMethod')}</p>
                                    <Separator/>
                                    <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between"><span>Desconto:</span> <span className="text-destructive">- {formatCurrency(Number(watchedDiscount))}</span></div>
                                    <div className="flex justify-between"><span>Frete:</span> <span>{formatCurrency(Number(watchedShippingCost))}</span></div>
                                    <Separator/>
                                    <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span>{formatCurrency(total)}</span></div>
                                </div>
                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>Observações (opcional)</FormLabel><FormControl><Textarea placeholder="Alguma observação sobre o pedido..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm p-4">
             <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                                        'sm:h-10 sm:w-10',
                                        currentStep > step.id
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : currentStep === step.id
                                            ? 'border-primary'
                                            : 'border-muted-foreground/30 bg-muted-foreground/20 text-muted-foreground'
                                    )}
                                >
                                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <p className={cn(
                                    'mt-1 w-16 truncate text-xs transition-colors hidden sm:block', 
                                    currentStep >= step.id ? 'font-semibold text-foreground' : 'text-muted-foreground'
                                )}>
                                    {step.name}
                                </p>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'mt-[-1.5rem] h-0.5 w-4 flex-1 sm:w-12 transition-colors',
                                        'hidden sm:block',
                                        currentStep > index + 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    </div>
                </div>

                 <div className="flex items-center justify-end gap-2 sm:gap-4">
                    <span className="text-md sm:text-lg font-bold">{formatCurrency(total)}</span>
                    {currentStep < steps.length ? (
                        <Button type="button" onClick={handleNextStep}>
                            Avançar
                        </Button>
                    ) : (
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalizar Pedido
                        </Button>
                    )}
                </div>
            </div>
        </footer>
    </div>
  );
}
