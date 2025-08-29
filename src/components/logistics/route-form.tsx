
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getEmployeesByUser, Employee } from "@/services/employee-service";
import { getUnassignedOrders, Order } from "@/services/order-service";
import { createRoute } from "@/services/logistics-service";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter } from "@/components/ui/sheet";
import { Loader2, UserPlus } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { EmptyState } from "../common/empty-state";


type RouteFormProps = {
    onFinished: () => void;
}

export function RouteForm({ onFinished }: RouteFormProps) {
    const { user } = useAuth();
    const { companies } = useCompany();
    const router = useRouter();
    const { toast } = useToast();
    const { formatCurrency } = useCurrency();

    const [drivers, setDrivers] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<string>("");
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [allEmployees, unassignedOrders] = await Promise.all([
                    getEmployeesByUser(user.uid),
                    getUnassignedOrders(companies.map(c => c.id))
                ]);
                
                const availableDrivers = allEmployees.filter(e => e.role === "Entregador" && e.isActive);
                setDrivers(availableDrivers);
                setOrders(unassignedOrders);
            } catch (error) {
                console.error("Failed to load data for route form", error);
                toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar motoristas e pedidos." });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, companies, toast]);

    const handleSelectAll = (checked: boolean) => {
        const newSelectedOrders: Record<string, boolean> = {};
        if (checked) {
            orders.forEach(order => {
                newSelectedOrders[order.id] = true;
            });
        }
        setSelectedOrders(newSelectedOrders);
    };

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        setSelectedOrders(prev => ({
            ...prev,
            [orderId]: checked,
        }));
    };

    const handleSubmit = async () => {
        const finalSelectedOrderIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
        
        if (!selectedDriver) {
            toast({ variant: "destructive", title: "Selecione um motorista" });
            return;
        }
        if (finalSelectedOrderIds.length === 0) {
            toast({ variant: "destructive", title: "Selecione ao menos um pedido" });
            return;
        }

        setIsSaving(true);
        try {
            const driver = drivers.find(d => d.id === selectedDriver);
            if (!driver) throw new Error("Motorista não encontrado");
            
            const ordersToAssign = orders.filter(o => finalSelectedOrderIds.includes(o.id));
            
            await createRoute(user!.uid, driver.id, driver.name, ordersToAssign);

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
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (drivers.length === 0) {
        return (
            <div className="flex-1 p-6">
                <EmptyState
                    icon={<UserPlus className="h-12 w-12" />}
                    title="Nenhum Motorista Encontrado"
                    description="Você precisa cadastrar ao menos um funcionário com a função 'Entregador' para criar uma rota."
                    action={<Button onClick={() => router.push('/dashboard/team')}>Cadastrar Funcionário</Button>}
                />
            </div>
        )
    }

    return (
        <>
            <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="space-y-4 mb-4">
                    <div>
                        <label className="text-sm font-medium">Motorista Responsável</label>
                        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o motorista" />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map(driver => (
                                    <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>Pedidos Disponíveis</CardTitle>
                        <CardDescription>Selecione os pedidos para incluir nesta rota.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead className="w-[50px]">
                                            <Checkbox
                                                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                                checked={Object.keys(selectedOrders).length > 0 && Object.keys(selectedOrders).every(k => selectedOrders[k])}
                                                indeterminate={Object.keys(selectedOrders).length > 0 && !Object.keys(selectedOrders).every(k => selectedOrders[k])}
                                            />
                                       </TableHead>
                                       <TableHead>Pedido</TableHead>
                                       <TableHead>Cliente</TableHead>
                                       <TableHead className="text-right">Total</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {orders.length > 0 ? orders.map(order => (
                                       <TableRow key={order.id} data-state={selectedOrders[order.id] && "selected"}>
                                           <TableCell>
                                                <Checkbox
                                                    checked={selectedOrders[order.id] || false}
                                                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked === true)}
                                                />
                                           </TableCell>
                                           <TableCell>#{order.id.substring(0, 7)}</TableCell>
                                           <TableCell>{order.customer.name}</TableCell>
                                           <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                       </TableRow>
                                   )) : (
                                       <TableRow>
                                           <TableCell colSpan={4} className="h-24 text-center">Nenhum pedido aguardando rota.</TableCell>
                                       </TableRow>
                                   )}
                               </TableBody>
                           </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <SheetFooter className="p-6 border-t">
                <Button variant="ghost" onClick={onFinished}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Rota
                </Button>
            </SheetFooter>
        </>
    );
}
