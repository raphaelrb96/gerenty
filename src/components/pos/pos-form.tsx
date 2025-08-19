
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Product, OrderItem } from "@/lib/types";
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
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  customerName: z.string().min(2, "Nome do cliente é obrigatório."),
  customerEmail: z.string().email("Email inválido."),
  paymentMethod: z.enum(["credito", "debito", "pix", "dinheiro"]),
});

type PosFormValues = z.infer<typeof formSchema>;

type PosFormProps = {
  allProducts: Product[];
};

export function PosForm({ allProducts }: PosFormProps) {
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
      paymentMethod: "credito",
    },
  });

  const handleAddProductToCart = () => {
    if (!selectedProduct) return;
    const product = allProducts.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: item.totalPrice + item.unitPrice }
            : item
        )
      );
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.pricing[0].price,
        totalPrice: product.pricing[0].price,
        isDigital: false,
      };
      setCart([...cart, newItem]);
    }
  };
  
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  }

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  async function onSubmit(values: PosFormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Você precisa estar logado." });
        return;
    }
    if (cart.length === 0) {
        toast({ variant: "destructive", title: "O carrinho está vazio." });
        return;
    }

    setIsSaving(true);
    // TODO: Implement order creation logic here
    console.log("Creating order with:", { ...values, cart, subtotal });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
        title: "Pedido Criado com Sucesso!",
        description: `Pedido para ${values.customerName} foi registrado.`,
    });
    
    setCart([]);
    form.reset();
    setIsSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Details */}
            <div className="space-y-2">
                <h3 className="font-semibold">Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do Cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="email@cliente.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />

            {/* Product Selection */}
             <div className="space-y-2">
                <h3 className="font-semibold">Produtos</h3>
                 <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <Label>Selecionar Produto</Label>
                        <Select onValueChange={setSelectedProduct} value={selectedProduct}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolha um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name} - R${product.pricing[0].price.toFixed(2)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" size="icon" onClick={handleAddProductToCart}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />
            
            {/* Cart */}
            <div className="space-y-4">
                <h3 className="font-semibold">Carrinho</h3>
                <div className="space-y-2 rounded-md border p-2 min-h-[100px]">
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
                {cart.length > 0 && (
                    <div className="text-right font-bold text-lg">
                        Subtotal: R${subtotal.toFixed(2)}
                    </div>
                )}
            </div>

            <Separator />

            {/* Payment */}
            <div className="space-y-2">
                <h3 className="font-semibold">Pagamento</h3>
                 <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <CardFooter className="p-0 pt-6">
                 <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Finalizar Pedido
                 </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
