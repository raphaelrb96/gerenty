
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getEmployeesByUser, Employee } from "@/services/employee-service";
import { getUnassignedOrders } from "@/services/order-service";
import { createRoute } from "@/services/logistics-service";
import type { Order } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Loader2, Users, Package, UserPlus } from "lucide-react";
import { useCurrency } from "@/context/currency-context";

const formSchema = z.object({
  title: z.string().min(3, "O título da rota é obrigatório."),
  driverId: z.string().min(1, "Selecione um entregador."),
  orderIds: z.array(z.string()).nonempty("Selecione pelo menos um pedido."),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type RouteFormProps = {
  onFinished: () => void;
};

export function RouteForm({ onFinished }: RouteFormProps) {
  const { user } = useAuth();
  const { companies } = useCompany();
  const { toast } = useToast();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [allEmployees, unassignedOrders] = await Promise.all([
          getEmployeesByUser(user.uid),
          getUnassignedOrders(companies.map(c => c.id))
        ]);

        const availableDrivers = allEmployees.filter(e => e.role === "entregador" && e.isActive);
        setDrivers(availableDrivers);
        setOrders(unassignedOrders);

      } catch (error) {
        console.error("Failed to load data for route form", error);
        toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar entregadores ou pedidos." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, companies, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", driverId: "", orderIds: [], notes: "" },
  });

  const selectedOrderIds = form.watch("orderIds");
  const selectedOrders = orders.filter(order => selectedOrderIds.includes(order.id));
  const totalValue = selectedOrders.reduce((sum, order) => sum + order.total, 0);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const driver = drivers.find(d => d.id === values.driverId);
      if (!driver) {
        toast({ variant: "destructive", title: "Entregador não encontrado." });
        setIsSaving(false);
        return;
      }

      await createRoute({
        ownerId: user.uid,
        title: values.title,
        driverId: driver.id,
        driverName: driver.name,
        orders: selectedOrders,
        notes: values.notes,
      });

      toast({ title: "Rota criada com sucesso!" });
      onFinished();
    } catch (error) {
      console.error("Failed to create route", error);
      toast({ variant: "destructive", title: "Erro ao criar rota", description: "Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (drivers.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
             <EmptyState
                icon={<Users className="h-16 w-16" />}
                title="Nenhum Entregador Encontrado"
                description="Você precisa cadastrar ao menos um funcionário com a função 'Entregador' para criar uma rota."
                action={
                    <Button onClick={() => router.push('/dashboard/team')}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar Funcionário
                    </Button>
                }
            />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Título da Rota</FormLabel><FormControl><Input placeholder="Entregas de Segunda-feira" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="driverId" render={({ field }) => (
              <FormItem><FormLabel>Entregador Responsável</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um entregador" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {drivers.map(driver => <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="orderIds" render={() => (
              <FormItem>
                <FormLabel>Pedidos a Incluir</FormLabel>
                {orders.length > 0 ? (
                  <Card className="max-h-60 overflow-y-auto"><CardContent className="p-4 space-y-3">
                    {orders.map((order) => (
                      <FormField key={order.id} control={form.control} name="orderIds" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(order.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), order.id])
                                  : field.onChange(field.value?.filter((value) => value !== order.id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal w-full cursor-pointer">
                            <div className="flex justify-between">
                              <span>#{order.id.substring(0, 7)} - {order.customer.name}</span>
                              <span className="font-medium">{formatCurrency(order.total)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {order.shipping?.address?.neighborhood}, {order.shipping?.address?.city}
                            </p>
                          </FormLabel>
                        </FormItem>
                      )} />
                    ))}
                  </CardContent></Card>
                ) : (
                  <EmptyState icon={<Package className="h-12 w-12" />} title="Nenhum Pedido Pendente" description="Não há pedidos aguardando para serem incluídos em uma rota." />
                )}
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Observações (Opcional)</FormLabel><FormControl><Textarea placeholder="Instruções especiais para o entregador..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t mt-auto flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Total da Rota:</span>
            <span className="text-xl font-bold">{formatCurrency(totalValue)}</span>
          </div>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Rota
          </Button>
        </div>
      </form>
    </Form>
  );
}
