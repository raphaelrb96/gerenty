
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
import { PlusCircle, Trash2, Loader2, User, CreditCard } from "lucide-react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useTranslation } from "@/context/i18n-context";


const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  isDigital: z.boolean(),
  productSlug: z.string().optional(),
  variant: z.any().optional(),
  imageUrl: z.string().optional(),
  downloadLink: z.string().optional(),
  externalLink: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  // Customer
  customerName: z.string().min(2, "Nome do cliente é obrigatório."),
  customerEmail: z.string().email("Email inválido."),
  customerPhone: z.string().optional(),
  customerDocument: z.string().optional(),

  // Items - handled separately
  items: z.array(orderItemSchema).nonempty("O carrinho não pode estar vazio."),
  
  // Payment
  paymentMethod: z.enum(["credito", "debito", "pix", "dinheiro", "boleto", "link", "outros"]),
  paymentStatus: z.enum(["aguardando", "aprovado", "recusado", "estornado"]),

  // Shipping
  deliveryMethod: z.enum(["retirada_loja", "entrega_padrao", "correios", "logistica_propria", "digital"]),
  shippingCost: z.preprocess((a) => parseFloat(z.string().parse(a).replace(",", ".") || "0"), z.number().min(0)),
  
  // Totals & Notes
  discount: z.preprocess((a) => parseFloat(z.string().parse(a).replace(",", ".") || "0"), z.number().min(0)),
  notes: z.string().optional(),
});

type PosFormValues = z.infer<typeof formSchema>;

type PosFormProps = {
  allProducts: Product[];
};

export function PosForm({ allProducts }: PosFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PosFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
      items: [],
      paymentMethod: "credito",
      paymentStatus: "aprovado",
      deliveryMethod: "retirada_loja",
      shippingCost: 0,
      discount: 0,
      notes: "",
    },
  });

  const { control, setValue, getValues, watch } = form;

  // Use watch to react to changes in discount and shippingCost for total calculation
  const watchedDiscount = watch('discount', 0);
  const watchedShippingCost = watch('shippingCost', 0);

  const handleAddProductToCart = () => {
    if (!selectedProduct) return;
    const product = allProducts.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

    let updatedCart: OrderItem[];

    if (existingItemIndex > -1) {
      updatedCart = cart.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      );
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.pricing[0].price,
        totalPrice: product.pricing[0].price,
        isDigital: false, // This could be derived from product data if available
      };
      updatedCart = [...cart, newItem];
    }
    setCart(updatedCart);
    setValue('items', updatedCart, { shouldValidate: true });
    setSelectedProduct("");
  };
  
  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    setValue('items', updatedCart, { shouldValidate: true });
  }

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const total = subtotal - watchedDiscount + watchedShippingCost;


  async function onSubmit(values: PosFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Você precisa estar logado." });
        return;
    }
    
    setIsSaving(true);
    
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        companyId: user.uid,
        customer: {
            name: values.customerName,
            email: values.customerEmail,
            phone: values.customerPhone,
            document: values.customerDocument,
        },
        items: cart,
        status: 'completed' as OrderStatus, // POS orders are typically completed on creation
        payment: {
            method: values.paymentMethod as PaymentMethod,
            status: values.paymentStatus,
            type: 'presencial' // Assuming POS is always in-person
        },
        shipping: {
            method: values.deliveryMethod as DeliveryMethod,
            cost: values.shippingCost,
            // These would need inputs if required, providing defaults for now
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
            title: "Pedido Criado com Sucesso!",
            description: `Pedido para ${values.customerName} foi registrado.`,
        });
        
        setCart([]);
        form.reset();
        setValue('items', []);
    } catch(error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro ao criar pedido", description: "Ocorreu um erro, tente novamente." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Pedido (PDV)</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                {/* Customer Details */}
                <AccordionItem value="item-1">
                    <AccordionTrigger className="font-semibold text-lg"><div className="flex items-center gap-2"><User className="h-5 w-5"/> Cliente</div></AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="customerName" render={({ field }) => (
                                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do Cliente" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="customerEmail" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="customerPhone" render={({ field }) => (
                                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="customerDocument" render={({ field }) => (
                                <FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input placeholder="Documento" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Product Selection */}
                <AccordionItem value="item-2">
                    <AccordionTrigger className="font-semibold text-lg">Produtos</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <Label>Selecionar Produto</Label>
                                <Select onValueChange={setSelectedProduct} value={selectedProduct}>
                                    <SelectTrigger><SelectValue placeholder="Escolha um produto..." /></SelectTrigger>
                                    <SelectContent>
                                        {allProducts.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} - R${product.pricing[0].price.toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" size="icon" onClick={handleAddProductToCart} disabled={!selectedProduct}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Cart */}
                         <FormField
                            control={form.control}
                            name="items"
                            render={({ field }) => (
                                <FormItem>
                                <div className="space-y-2 rounded-md border p-2 min-h-[120px]">
                                    {cart.length === 0 ? (
                                        <p className="text-muted-foreground text-center p-4">Nenhum produto no carrinho.</p>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.productId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-muted-foreground">{item.quantity} x R${item.unitPrice.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold">R${item.totalPrice.toFixed(2)}</p>
                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveFromCart(item.productId)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                 <FormMessage />
                                </FormItem>
                            )}
                        />
                    </AccordionContent>
                </AccordionItem>
                
                 {/* Payment & Shipping */}
                <AccordionItem value="item-3">
                    <AccordionTrigger className="font-semibold text-lg"><div className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pagamento e Entrega</div></AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                <FormItem><FormLabel>Forma de Pagamento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="credito">Cartão de Crédito</SelectItem>
                                            <SelectItem value="debito">Cartão de Débito</SelectItem>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                            <SelectItem value="boleto">Boleto</SelectItem>
                                            <SelectItem value="link">Link de Pagamento</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                                <FormItem><FormLabel>Status Pagamento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="aprovado">Aprovado</SelectItem>
                                            <SelectItem value="aguardando">Aguardando</SelectItem>
                                            <SelectItem value="recusado">Recusado</SelectItem>
                                            <SelectItem value="estornado">Estornado</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                            )}/>
                              <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                                <FormItem><FormLabel>Método de Entrega</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="retirada_loja">Retirada na Loja</SelectItem>
                                            <SelectItem value="entrega_padrao">Entrega Padrão</SelectItem>
                                            <SelectItem value="correios">Correios</SelectItem>
                                            <SelectItem value="logistica_propria">Logística Própria</SelectItem>
                                            <SelectItem value="digital">Digital</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Separator />
            
            {/* Totals & Notes */}
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Resumo e Observações</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="shippingCost" render={({ field }) => (
                        <FormItem><FormLabel>Custo do Frete</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="discount" render={({ field }) => (
                        <FormItem><FormLabel>Desconto</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <div className="space-y-2 rounded-md border bg-muted p-4">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>R$ {watchedShippingCost.toFixed(2)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Desconto</span><span className="text-red-500">- R$ {watchedDiscount.toFixed(2)}</span></div>
                    <Separator className="my-2 bg-border" />
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                 </div>

                 <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Adicione notas sobre o pedido..." {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
            </div>
            
            <CardFooter className="p-0 pt-6">
                 <Button type="submit" className="w-full" size="lg" disabled={isSaving || cart.length === 0} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Finalizar Pedido (R$ {total.toFixed(2)})
                 </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    