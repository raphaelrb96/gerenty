
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getEmployeesByUser, Employee } from "@/services/employee-service";
import { getUnassignedOrders } from "@/services/order-service";
import type { Order, OrderStatus } from "@/lib/types";
import { createRoute } from "@/services/logistics-service";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter } from "@/components/ui/sheet";
import { Loader2, UserPlus, Search, ShoppingCart, Info, Calendar } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { EmptyState } from "../common/empty-state";
import { DateRangePicker } from "../ui/date-range-picker";
import { useTranslation } from "@/context/i18n-context";


type RouteFormProps = {
    onFinished: () => void;
}

export function RouteForm({ onFinished }: RouteFormProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { companies } = useCompany();
    const router = useRouter();
    const { toast } = useToast();
    const { formatCurrency } = useCurrency();

    const [drivers, setDrivers] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    
    // Form state
    const [selectedDriver, setSelectedDriver] = useState<string>("");
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

    // Loading states
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

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const filtered = orders.filter(order => {
            const searchMatch = order.customer.name.toLowerCase().includes(lowercasedFilter) ||
                                order.id.toLowerCase().includes(lowercasedFilter);

            const statusMatch = statusFilter === 'all' || order.status === statusFilter;

            const orderDate = new Date(order.createdAt as string);
            const dateMatch = dateRange?.from && dateRange?.to
                ? orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to)
                : true;
            
            return searchMatch && statusMatch && dateMatch;
        });

        setFilteredOrders(filtered);
    }, [searchTerm, orders, dateRange, statusFilter]);

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        setSelectedOrders(prev => {
            const newSelected = { ...prev };
            if (checked) {
                newSelected[orderId] = true;
            } else {
                delete newSelected[orderId];
            }
            return newSelected;
        });
    };

    const handleSubmit = async () => {
        const finalSelectedOrderIds = Object.keys(selectedOrders);
        
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
            
            await createRoute(user!.uid, driver.id, driver.name, ordersToAssign, title, notes);

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
                        <label className="text-sm font-medium">Título da Rota (opcional)</label>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`Rota de ${drivers.find(d => d.id === selectedDriver)?.name || 'Entregas'}`}
                        />
                    </div>
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
                     <div>
                        <label className="text-sm font-medium">Observações (opcional)</label>
                        <Textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Adicione observações sobre a rota, como horários ou instruções especiais."
                        />
                    </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>Pedidos Disponíveis</CardTitle>
                        <CardDescription>Selecione os pedidos para incluir nesta rota.</CardDescription>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por cliente ou ID do pedido..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                                 <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Status</SelectItem>
                                        <SelectItem value="confirmed">{t('orderStatus.confirmed')}</SelectItem>
                                        <SelectItem value="processing">{t('orderStatus.processing')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-2">
                        <ScrollArea className="h-full">
                           {filteredOrders.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredOrders.map(order => (
                                        <Card 
                                            key={order.id} 
                                            className={`flex items-start gap-3 p-3 transition-colors ${selectedOrders[order.id] ? 'bg-muted border-primary' : 'hover:bg-muted/50'}`}
                                        >
                                            <Checkbox
                                                id={`order-${order.id}`}
                                                checked={selectedOrders[order.id] || false}
                                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked === true)}
                                                className="mt-1"
                                            />
                                            <label htmlFor={`order-${order.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold">{order.customer.name}</p>
                                                    <p className="font-bold text-sm">{formatCurrency(order.total)}</p>
                                                </div>
                                                <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                                    <div className="flex items-center gap-1.5"><ShoppingCart className="h-3 w-3" /> <span>{order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</span></div>
                                                    <div className="flex items-center gap-1.5"><Info className="h-3 w-3" /> <span>ID: #{order.id.substring(0, 7)}</span></div>
                                                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> <span>{new Date(order.createdAt as string).toLocaleDateString()}</span></div>
                                                </div>
                                            </label>
                                        </Card>
                                    ))}
                                </div>
                           ) : (
                               <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                   <p>Nenhum pedido aguardando rota ou correspondente aos filtros.</p>
                               </div>
                           )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <SheetFooter className="p-6 border-t">
                <Button variant="ghost" onClick={onFinished}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Rota ({Object.keys(selectedOrders).length})
                </Button>
            </SheetFooter>
        </>
    );
}
