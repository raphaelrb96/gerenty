
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getEmployeesByUser } from "@/services/employee-service";
import { getUnassignedOrders } from "@/services/order-service";
import { createRoute } from "@/services/logistics-service";
import type { Employee, Order } from "@/lib/types";
import { useRouter } from "next/navigation";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Users, File, Loader2 } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";

const formSchema = z.object({
    driverId: z.string().min(1, "É obrigatório selecionar um entregador."),
    title: z.string().min(3, "O título da rota é obrigatório."),
    notes: z.string().optional(),
    orderIds: z.array(z.string()).min(1, "Selecione pelo menos um pedido para a rota."),
});

type RouteFormValues = z.infer<typeof formSchema>;

export function RouteForm() {
    const { effectiveOwnerId } = useAuth();
    const { activeCompany, companies } = useCompany();
    const { toast } = useToast();
    const router = useRouter();
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const form = useForm<RouteFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { orderIds: [] },
    });

    const selectedOrderIds = form.watch("orderIds");
    const selectedOrders = orders.filter(order => selectedOrderIds.includes(order.id));
    const totalRouteValue = selectedOrders.reduce((acc, order) => acc + order.total, 0);

    useEffect(() => {
        const fetchData = async () => {
            if (!effectiveOwnerId) return;
            setLoading(true);
            try {
                const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
                const [userDrivers, unassignedOrders] = await Promise.all([
                    getEmployeesByUser(effectiveOwnerId),
                    getUnassignedOrders(companyIds)
                ]);
                setDrivers(userDrivers.filter(d => d.role === 'entregador' && d.isActive));
                setOrders(unassignedOrders);
            } catch (error) {
                toast({ variant: "destructive", title: "Erro ao carregar dados" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [effectiveOwnerId, activeCompany, companies, toast]);

    const onSubmit = async (values: RouteFormValues) => {
        if (!effectiveOwnerId) {
            toast({ variant: "destructive", title: "Usuário não autenticado." });
            return;
        }

        const selectedDriver = drivers.find(d => d.id === values.driverId);
        if (!selectedDriver) {
            toast({ variant: "destructive", title: "Entregador não encontrado." });
            return;
        }

        try {
            await createRoute({
                ownerId: effectiveOwnerId,
                companyId: activeCompany?.id, // Assuming active company context is available
                driverId: values.driverId,
                driverName: selectedDriver.name,
                title: values.title,
                notes: values.notes,
                orders: selectedOrders,
            });
            toast({ title: "Rota criada com sucesso!" });
            router.push("/dashboard/logistics");
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao criar rota." });
            console.error(error);
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
                    title="Nenhum Entregador Cadastrado"
                    description="Você precisa ter pelo menos um entregador ativo cadastrado para criar uma rota."
                    action={
                        <Button onClick={() => router.push('/dashboard/team')}>
                            Cadastrar Entregador
                        </Button>
                    }
                />
            </div>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden p-1">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalhes da Rota</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título da Rota</FormLabel><FormControl><Input placeholder="Entregas Zona Sul" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="driverId" render={({ field }) => (<FormItem><FormLabel>Entregador</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um entregador" /></SelectTrigger></FormControl><SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre a rota..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Resumo da Rota</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Entregas selecionadas:</span> <strong>{selectedOrders.length}</strong></div>
                                <div className="flex justify-between"><span>Valor total da rota:</span> <strong>{formatCurrency(totalRouteValue)}</strong></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 flex flex-col">
                        <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <CardTitle>Pedidos Pendentes</CardTitle>
                                <CardDescription>Selecione os pedidos para adicionar a esta rota.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden">
                                <FormField control={form.control} name="orderIds" render={({ field }) => (
                                    <FormItem>
                                        <ScrollArea className="h-[calc(100vh-28rem)] border rounded-md">
                                            {orders.length === 0 ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <EmptyState icon={<File className="h-12 w-12" />} title="Nenhum Pedido Pendente" description="Não há pedidos aguardando para serem adicionados a uma rota."/>
                                                </div>
                                            ) : (
                                            <div className="p-4 space-y-2">
                                                {orders.map((order) => (
                                                    <FormField key={order.id} control={form.control} name="orderIds" render={({ field }) => {
                                                        return (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-3 rounded-md">
                                                            <FormControl>
                                                                <Checkbox checked={field.value?.includes(order.id)} onCheckedChange={(checked) => {
                                                                    return checked ? field.onChange([...field.value, order.id]) : field.onChange(field.value?.filter((value) => value !== order.id))
                                                                }} />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none text-sm">
                                                                <FormLabel className="font-normal">Pedido #{order.id.substring(0,7)} - <span className="font-bold">{formatCurrency(order.total)}</span></FormLabel>
                                                                <p className="text-muted-foreground text-xs">{order.shipping?.address?.street}, {order.shipping?.address?.number} - {order.shipping?.address?.neighborhood}</p>
                                                            </div>
                                                        </FormItem>
                                                        )}}
                                                    />
                                                ))}
                                            </div>
                                            )}
                                        </ScrollArea>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                 <div className="flex justify-end gap-2 p-4 mt-auto">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Criar Rota
                    </Button>
                </div>
            </form>
        </Form>
    );
}
