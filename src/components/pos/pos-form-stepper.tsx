
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addOrder } from "@/services/order-service";
import { getCustomersByUser, addCustomer, Customer } from "@/services/customer-service";
import { getEmployeesByUser } from "@/services/employee-service";
import type { Product, OrderItem, OrderStatus, PaymentMethod, DeliveryMethod, Order, PaymentDetails, Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, User, CreditCard, Truck, ShoppingCart, ArrowLeft, Package, Search } from "lucide-react";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";
import { ProductGrid } from "./product-list";
import { CartItem } from "./cart-item";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const formSchema = z.object({
  customerName: z.string().min(2, "Nome do cliente é obrigatório."),
  customerEmail: z.string().email("Email inválido.").optional().or(z.literal('')),
  customerPhone: z.string().min(1, "Telefone é obrigatório."),
  customerDocument: z.string().optional(),
  
  employeeId: z.string().optional(),

  paymentMethod: z.enum(["credito", "debito", "pix", "dinheiro", "boleto", "link", "outros"]),
  paymentType: z.enum(["presencial", "online"]),
  paymentStatus: z.enum(["aguardando", "aprovado", "recusado", "estornado"]),
  
  deliveryMethod: z.enum(["retirada_loja", "entrega_padrao", "correios", "logistica_propria", "digital"]),
  
  shippingCost: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  additionalFees: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  additionalFeeType: z.enum(["fixed", "percentage"]).default("fixed"),
  discount: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  notes: z.string().optional(),

  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
    if (data.deliveryMethod !== 'retirada_loja' && data.deliveryMethod !== 'digital') {
        if (!data.address?.street) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rua é obrigatória', path: ['address.street'] });
        }
        if (!data.address?.number) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Número é obrigatório', path: ['address.number'] });
        }
        if (!data.address?.neighborhood) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bairro é obrigatório', path: ['address.neighborhood'] });
        }
        if (!data.address?.city) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cidade é obrigatória', path: ['address.city'] });
        }
        if (!data.address?.state) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estado é obrigatório', path: ['address.state'] });
        }
        if (!data.address?.zipCode) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CEP é obrigatório', path: ['address.zipCode'] });
        }
    }
});


type PosFormValues = z.infer<typeof formSchema>;

type PosFormStepperProps = {
  products: Product[];
  cart: OrderItem[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onUpdateCartPrice: (productId: string, newPrice: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
};

const steps = [
  { id: 1, name: "Carrinho", icon: ShoppingCart },
  { id: 2, name: "Cliente", icon: User },
  { id: 3, name: "Pagamento", icon: CreditCard },
  { id: 4, name: "Finalizar", icon: Truck },
];

function CustomerSearch({ onCustomerSelect }: { onCustomerSelect: (customer: Customer) => void }) {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [open, setOpen] = useState(false);
    
    useEffect(() => {
        const fetchCustomers = async () => {
            if (user) {
                const userCustomers = await getCustomersByUser(user.uid);
                setCustomers(userCustomers);
            }
        };
        fetchCustomers();
    }, [user]);

    const handleSelect = (customer: Customer) => {
        onCustomerSelect(customer);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar cliente existente...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                 <Command>
                    <CommandInput placeholder="Buscar por nome, email ou telefone..." />
                    <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.email} ${customer.phone}`}
                                    onSelect={() => handleSelect(customer)}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{customer.name}</span>
                                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}


export function PosFormStepper({ products, cart, onAddToCart, onUpdateCartQuantity, onUpdateCartPrice, onRemoveFromCart, onClearCart }: PosFormStepperProps) {
  const { t } = useTranslation();
  const { user, effectiveOwnerId } = useAuth();
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [salespeople, setSalespeople] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchSalespeople() {
      if (effectiveOwnerId) {
        const allEmployees = await getEmployeesByUser(effectiveOwnerId);
        setSalespeople(allEmployees.filter(emp => emp.role === 'salesperson' && emp.isActive));
      }
    }
    fetchSalespeople();
  }, [effectiveOwnerId]);

  const form = useForm<PosFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
      employeeId: "direct_sale",
      paymentMethod: "credito",
      paymentType: "presencial",
      paymentStatus: "aprovado",
      deliveryMethod: "retirada_loja",
      shippingCost: 0,
      additionalFees: 0,
      additionalFeeType: "fixed",
      discount: 0,
      notes: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Brasil",
      }
    },
  });

  const handleCustomerSelect = (customer: Customer) => {
    form.setValue("customerName", customer.name);
    form.setValue("customerEmail", customer.email || "");
    form.setValue("customerPhone", customer.phone || "");
    setSelectedCustomerId(customer.id);
  }

  const watchedDiscount = form.watch('discount', 0);
  const watchedShippingCost = form.watch('shippingCost', 0);
  const watchedAdditionalFees = form.watch('additionalFees', 0);
  const watchedAdditionalFeeType = form.watch('additionalFeeType');
  const deliveryMethod = form.watch('deliveryMethod');

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const calculatedFees = watchedAdditionalFeeType === 'percentage'
    ? subtotal * (Number(watchedAdditionalFees) / 100)
    : Number(watchedAdditionalFees);
  
  const total = subtotal - (Number(watchedDiscount) || 0) + (Number(watchedShippingCost) || 0) + (calculatedFees || 0);

  const deliveryMethodMap: Record<DeliveryMethod, string> = {
    retirada_loja: 'pickup',
    entrega_padrao: 'standard',
    correios: 'correios',
    logistica_propria: 'own',
    digital: 'digital'
  };


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof PosFormValues)[] | (string)[] = [];
    if (currentStep === 1 && cart.length === 0) {
        toast({ variant: "destructive", title: "Carrinho vazio", description: "Adicione produtos para continuar." });
        return;
    }
    if (currentStep === 2) {
        fieldsToValidate = ['customerName', 'customerPhone'];
    }
    if (currentStep === 3) {
        fieldsToValidate = ['paymentMethod', 'deliveryMethod', 'shippingCost', 'discount'];
        if (deliveryMethod !== 'retirada_loja' && deliveryMethod !== 'digital') {
            fieldsToValidate.push(
                'address.street', 'address.number', 'address.neighborhood', 
                'address.city', 'address.state', 'address.zipCode'
            );
        }
    }


    if (fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate as any);
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
    
    let customerId = selectedCustomerId;
    if (!customerId) {
        try {
            const newCustomer = await addCustomer({
                ownerId: user.uid,
                name: values.customerName,
                email: values.customerEmail,
                phone: values.customerPhone,
                document: values.customerDocument,
                status: 'Active',
            });
            customerId = newCustomer.id;
        } catch (error) {
             toast({ variant: "destructive", title: "Erro ao criar cliente", description: "Não foi possível cadastrar o novo cliente." });
             setIsSaving(false);
             return;
        }
    }

    let orderStatus: OrderStatus;
    let paymentStatus: PaymentDetails['status'];

    if (values.deliveryMethod === 'retirada_loja') {
        orderStatus = 'completed';
        paymentStatus = 'aprovado';
    } else {
        orderStatus = 'pending';
        paymentStatus = 'aguardando';
    }

    const orderCommission = cart.reduce((acc, item) => {
        const commissionConfig = item.commission;
        if (!commissionConfig) return acc;

        if (commissionConfig.type === 'fixed') {
            return acc + (commissionConfig.value || 0) * item.quantity;
        } else { // percentage
            return acc + (item.totalPrice * ((commissionConfig.value || 0) / 100));
        }
    }, 0);

    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: activeCompany.id,
        employeeId: values.employeeId === 'direct_sale' ? undefined : values.employeeId,
        customer: { id: customerId, name: values.customerName, email: values.customerEmail || '', phone: values.customerPhone, document: values.customerDocument },
        items: cart.map(({imageUrl, ...item}) => item),
        status: orderStatus,
        payment: { 
            method: values.paymentMethod as PaymentMethod, 
            status: paymentStatus, 
            type: values.paymentType 
        },
        shipping: { 
            method: values.deliveryMethod as DeliveryMethod, 
            cost: values.shippingCost, 
            estimatedDelivery: { type: 'dias', value: 0 },
            address: (values.deliveryMethod !== 'retirada_loja' && values.deliveryMethod !== 'digital') ? values.address as any : undefined,
        },
        subtotal,
        discount: values.discount,
        shippingCost: values.shippingCost,
        taxas: calculatedFees,
        total,
        commission: orderCommission,
        notes: values.notes,
    };

    try {
        await addOrder(orderData);
        toast({ title: t('pos.success.title'), description: t('pos.success.description', { customerName: values.customerName }) });
        onClearCart();
        form.reset();
        setCurrentStep(1);
        setSelectedCustomerId(null);
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

  const needsShippingAddress = deliveryMethod !== 'retirada_loja' && deliveryMethod !== 'digital';

  return (
    <div className="relative bg-muted/40 flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mb-28 md:mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: currentStep === 1 ? 'grid' : 'none' }}>
                <div className="lg:col-span-2">
                     <ProductGrid products={products} onAddToCart={onAddToCart} />
                </div>
                <div className="lg:col-span-1 flex flex-col bg-background rounded-lg border">
                    <h3 className="p-4 text-lg font-semibold border-b flex-shrink-0 flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Carrinho</h3>
                    <div className="flex-1 overflow-y-auto p-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                <Package className="h-12 w-12 mb-4" />
                                <p>Selecione produtos para começar.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <React.Fragment key={item.productId}>
                                        <CartItem item={item} onUpdateQuantity={onUpdateCartQuantity} onUpdatePrice={onUpdateCartPrice} onRemove={onRemoveFromCart} />
                                        {index < cart.length - 1 && <Separator />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 4) form.handleSubmit(onSubmit)(); }}>
                    {/* The rest of the form steps go inside this form tag */}
                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                        <div className="max-w-2xl mx-auto p-1 space-y-6">
                            {renderStepHeader("Informações do Cliente")}
                            <Card>
                                <CardHeader><CardTitle>Buscar Cliente</CardTitle></CardHeader>
                                <CardContent>
                                    <CustomerSearch onCustomerSelect={handleCustomerSelect} />
                                    <p className="text-center text-sm text-muted-foreground mt-4">Ou preencha os dados manualmente abaixo</p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.name')}</FormLabel><FormControl><Input placeholder={t('pos.customer.namePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.phone')}</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="customerEmail" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.email')} (Opcional)</FormLabel><FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="customerDocument" render={({ field }) => (<FormItem><FormLabel>{t('pos.customer.document')} (Opcional)</FormLabel><FormControl><Input placeholder="CPF ou CNPJ" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader><CardTitle>Vendedor</CardTitle></CardHeader>
                                <CardContent>
                                     <FormField control={form.control} name="employeeId" render={({ field }) => (
                                      <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecione um vendedor" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="direct_sale">Venda Direta (Sem Vendedor)</SelectItem>
                                            {salespeople.map(sp => (
                                              <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                        <div className="max-w-4xl mx-auto p-1">
                            {renderStepHeader("Pagamento e Entrega")}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium">Pagamento</h3>
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
                                         <FormField control={form.control} name="paymentType" render={({ field }) => (
                                            <FormItem><FormLabel>Tipo de Pagamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                                <SelectItem value="presencial">Presencial</SelectItem>
                                                <SelectItem value="online">Online</SelectItem>
                                            </SelectContent></Select><FormMessage /></FormItem>
                                        )}/>
                                        <div className="space-y-2">
                                            <FormLabel>Taxas Adicionais (ex: máq. cartão)</FormLabel>
                                            <div className="flex items-center gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="additionalFeeType"
                                                    render={({ field }) => (
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            className="flex items-center"
                                                        >
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl><RadioGroupItem value="fixed" /></FormControl>
                                                                <FormLabel className="font-normal">Fixo (R$)</FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl><RadioGroupItem value="percentage" /></FormControl>
                                                                <FormLabel className="font-normal">Percentual (%)</FormLabel>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    )}
                                                />
                                                <FormField control={form.control} name="additionalFees" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            </div>
                                        </div>
                                         <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>{t('pos.summary.discount')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium">Entrega</h3>
                                    <div className="space-y-4">
                                        <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                                            <FormItem><FormLabel>{t('pos.payment.deliveryMethod')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                                                <SelectItem value="retirada_loja">{t('deliveryMethods.pickup')}</SelectItem>
                                                <SelectItem value="entrega_padrao">{t('deliveryMethods.standard')}</SelectItem>
                                                <SelectItem value="logistica_propria">{t('deliveryMethods.own')}</SelectItem>
                                            </SelectContent></Select><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="shippingCost" render={({ field }) => (<FormItem><FormLabel>{t('pos.summary.shippingCost')}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        
                                        {needsShippingAddress && (
                                            <div className="space-y-4 pt-4 border-t">
                                                <h4 className="font-medium">Endereço de Entrega</h4>
                                                <FormField control={form.control} name="address.zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                <FormField control={form.control} name="address.street" render={({ field }) => (<FormItem><FormLabel>Rua</FormLabel><FormControl><Input placeholder="Av. Principal" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="address.number" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                    <FormField control={form.control} name="address.complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 101" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                </div>
                                                <FormField control={form.control} name="address.neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="address.city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                    <FormField control={form.control} name="address.state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
                         <div className="max-w-3xl mx-auto p-1">
                            {renderStepHeader("Revisar e Finalizar")}
                            <div className="space-y-6">
                                <div className="rounded-lg border p-4 space-y-4">
                                    <h3 className="font-semibold text-lg">Itens do Pedido</h3>
                                    {cart.map(item => (
                                        <div key={item.productId} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-muted-foreground">Qtde: {item.quantity} x {formatCurrency(item.unitPrice)}</p>
                                            </div>
                                            <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="rounded-lg border p-4 space-y-2">
                                        <h3 className="font-semibold text-lg">Cliente</h3>
                                        <p className="text-sm"><strong>Nome:</strong> {form.getValues('customerName')}</p>
                                        <p className="text-sm"><strong>Telefone:</strong> {form.getValues('customerPhone')}</p>
                                        <p className="text-sm"><strong>Email:</strong> {form.getValues('customerEmail') || 'N/A'}</p>
                                    </div>
                                     <div className="rounded-lg border p-4 space-y-2">
                                        <h3 className="font-semibold text-lg">Entrega</h3>
                                        <p className="text-sm"><strong>Método:</strong> {t(`deliveryMethods.${deliveryMethodMap[form.getValues('deliveryMethod')]}`)}</p>
                                        {needsShippingAddress && (
                                             <address className="text-sm not-italic">
                                                {form.getValues('address.street')}, {form.getValues('address.number')} <br />
                                                {form.getValues('address.neighborhood')}, {form.getValues('address.city')} - {form.getValues('address.state')} <br/>
                                                {form.getValues('address.zipCode')}
                                            </address>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <h3 className="font-semibold text-lg mb-2">Resumo Financeiro</h3>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
                                        <div className="flex justify-between"><span>Taxas Adicionais:</span> <span>+ {formatCurrency(calculatedFees)}</span></div>
                                        <div className="flex justify-between"><span>Frete:</span> <span>+ {formatCurrency(Number(watchedShippingCost))}</span></div>
                                        <div className="flex justify-between text-destructive"><span>Desconto:</span> <span>- {formatCurrency(Number(watchedDiscount))}</span></div>
                                        <Separator className="my-2"/>
                                        <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span>{formatCurrency(total)}</span></div>
                                    </div>
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
        
        <footer className="fixed bottom-0 z-10 border-t bg-background/80 backdrop-blur-sm p-4 left-0 md:left-[var(--sidebar-width)] w-full peer-data-[state=collapsed]:md:left-[var(--sidebar-width-icon)] transition-[left] ease-linear">
             <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                {/* Stepper */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center text-center">
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                                    currentStep > step.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : currentStep === step.id
                                        ? 'border-primary'
                                        : 'border-muted-foreground/30 bg-muted-foreground/20 text-muted-foreground'
                                )}
                            >
                                <step.icon className="h-4 w-4" />
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

                {/* Actions */}
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
