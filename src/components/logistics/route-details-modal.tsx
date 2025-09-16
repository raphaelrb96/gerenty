

"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Route, Order, PaymentMethod, OrderStatus, PaymentDetails } from "@/lib/types";
import { useCurrency } from "@/context/currency-context";
import { User, Calendar, Truck, DollarSign, Clock, Box, Info, Pencil, AlertTriangle, PackageCheck, PackageX, Loader2, MapPin, Hourglass, Package, Save, CheckCircle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { finalizeRoute, updateDeliveryDetails } from "@/services/logistics-service";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/i18n-context";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { formatDistanceStrict, intervalToDuration } from 'date-fns';


type RouteDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
  onRouteFinalized: () => void;
};

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <Card>
        <CardContent className="p-3 flex items-center gap-3">
            <div className="bg-muted p-2 rounded-md">
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-base font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const formatDuration = (duration: Duration) => {
    const parts = [];
    if (duration.hours) parts.push(`${duration.hours}h`);
    if (duration.minutes) parts.push(`${duration.minutes}m`);
    parts.push(`${duration.seconds ?? 0}s`); // Ensure seconds is always defined
    return parts.join(' ');
}


export function RouteDetailsModal({
  isOpen,
  onClose,
  route,
  onRouteFinalized
}: RouteDetailsModalProps) {
    const { formatCurrency } = useCurrency();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [driverEarning, setDriverEarning] = useState<number>(0);
    const [routeDuration, setRouteDuration] = useState<string>("");
    const [finalizationNotes, setFinalizationNotes] = useState("");

    const financialSummary = useMemo(() => {
        if (!route?.orders) {
            return { totalPix: 0, totalCard: 0, totalDinheiro: 0, totalOnline: 0 };
        }

        return route.orders.reduce((acc, order) => {
            if (order.status !== 'cancelled' && order.status !== 'returned') {
                 if (order.payment.method === 'pix') {
                    acc.totalPix += order.total;
                } else if (order.payment.method === 'credito' || order.payment.method === 'debito') {
                    acc.totalCard += order.total;
                } else if (order.payment.method === 'dinheiro') {
                    acc.totalDinheiro += order.total;
                } else if (order.payment.type === 'online') {
                    acc.totalOnline += order.total;
                }
            }
            return acc;
        }, { totalPix: 0, totalCard: 0, totalDinheiro: 0, totalOnline: 0 });

    }, [route?.orders]);


    useEffect(() => {
        if (route) {
            setSelectedOrders(route.orders.filter(o => o.status === 'delivered').map(o => o.id));
        }
    }, [route]);

     useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showConfirmation && route?.createdAt) {
            timer = setInterval(() => {
                const duration = intervalToDuration({
                    start: new Date(route.createdAt as string),
                    end: new Date(),
                });
                setRouteDuration(formatDuration(duration));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showConfirmation, route?.createdAt]);

    const handleOpenConfirmation = () => {
        if (route) {
            const delivered = route.orders.filter(o => o.status === 'delivered');
            const calculatedEarnings = delivered.reduce((sum, order) => sum + (order.shippingCost || 0), 0);
            setDriverEarning(calculatedEarnings);
        }
        setShowConfirmation(true);
    };


    if (!route) return null;
    
    const handleFinalizeRoute = async () => {
        setIsFinalizing(true);
        try {
            await finalizeRoute(route.id, selectedOrders, driverEarning, finalizationNotes);
            toast({ title: "Rota Finalizada", description: "A rota foi concluída e os status foram atualizados." });
            onRouteFinalized();
            onClose();
        } catch (error) {
            console.error("Error finalizing route:", error);
            toast({ variant: "destructive", title: "Erro ao Finalizar", description: "Não foi possível finalizar a rota. Tente novamente." });
        } finally {
            setIsFinalizing(false);
            setShowConfirmation(false);
            setFinalizationNotes("");
        }
    }

    const canFinalize = route.orders.every(o => o.status === 'delivered' || o.status === 'cancelled');

    const deliveredCount = route.orders.filter(o => o.status === 'delivered').length;
    const returnedCount = route.orders.filter(o => o.status === 'cancelled').length;


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl flex flex-col h-[90vh]">
          <DialogHeader className="px-6 pt-6 flex-shrink-0">
            <DialogTitle>Detalhes da Rota #{route.id.substring(0, 7)}</DialogTitle>
            <DialogDescription>
              Informações completas sobre a rota, entregador e pedidos.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 px-6 min-h-0">
                <div className="md:col-span-1 space-y-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4"/> Entregador</h4>
                        <p className="text-muted-foreground">{route.driverName}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Calendar className="h-4 w-4"/> Data de Criação</h4>
                        <p className="text-muted-foreground">{new Date(route.createdAt as string).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4"/> Status</h4>
                        <Badge>{t(`routeStatus.${route.status}`)}</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Resumo Financeiro da Rota</h4>
                        <StatCard title="Total em PIX" value={formatCurrency(financialSummary.totalPix)} icon={<Info className="h-5 w-5 text-blue-500" />} />
                        <StatCard title="Total em Cartão" value={formatCurrency(financialSummary.totalCard)} icon={<Info className="h-5 w-5 text-orange-500" />} />
                        <StatCard title="Total em Dinheiro" value={formatCurrency(financialSummary.totalDinheiro)} icon={<DollarSign className="h-5 w-5 text-green-500" />} />
                        <StatCard title="Pagamentos Online" value={formatCurrency(financialSummary.totalOnline)} icon={<Info className="h-5 w-5 text-purple-500" />} />
                    </div>
                    <Separator />
                    <div className="space-y-2 ml-1 mb-10">
                        <Label htmlFor="route-notes">Anotações da Rota</Label>
                        <Textarea id="route-notes" placeholder="Insira anotações importantes aqui..." defaultValue={route.notes}/>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Box className="h-5 w-5" /> Entregas ({route.orders.length})</h3>
                    <p className="text-sm text-muted-foreground">Atualize individualmente o status e pagamento de cada entrega.</p>
                    <Accordion type="multiple" className="w-full space-y-3">
                        {route.orders.map(order => (
                            <OrderUpdateCard key={order.id} order={order} onUpdate={onRouteFinalized} />
                        ))}
                    </Accordion>
                </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t flex-shrink-0 px-6 pb-6">
              <div className="flex justify-end w-full gap-2">
                  <Button variant="outline" onClick={onClose}>Fechar</Button>
                  <Button onClick={handleOpenConfirmation} disabled={!canFinalize || route.status !== 'em_andamento'}>Finalizar Rota</Button>
              </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento da Rota?</AlertDialogTitle>
            <AlertDialogDescription>
              Revise os detalhes do fechamento. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto p-1">
            <div className="rounded-lg border bg-card p-4 space-y-4">
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold">{deliveredCount}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3 text-green-500"/> Entregues</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold">{returnedCount}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Ban className="h-3 w-3 text-red-500"/> Devolvidos</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold">{routeDuration}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3"/> Duração</p>
                    </div>
                 </div>

                <Separator />

                <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-green-500" /> Prestação de Contas</h4>
                    <p>Valor total em dinheiro a ser recebido: <strong className="text-lg">{formatCurrency(financialSummary.totalDinheiro)}</strong></p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="driver-earning">Pagamento do Entregador</Label>
                    <Input id="driver-earning" type="number" placeholder="R$ 0,00" value={driverEarning} onChange={(e) => setDriverEarning(Number(e.target.value))}/>
                    <p className="text-xs text-muted-foreground">Valor calculado com base nas taxas de entrega dos pedidos concluídos.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="finalization-notes">Observações de Fechamento</Label>
                    <Textarea 
                        id="finalization-notes" 
                        placeholder="Observações sobre o fechamento da rota..." 
                        value={finalizationNotes}
                        onChange={(e) => setFinalizationNotes(e.target.value)}
                    />
                </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeRoute} disabled={isFinalizing}>
              {isFinalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Confirmar Fechamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const updateSchema = z.object({
  status: z.custom<OrderStatus>(),
  paymentMethod: z.custom<PaymentMethod>(),
  paymentStatus: z.custom<PaymentDetails['status']>(),
  amountPaid: z.preprocess((a) => parseFloat(String(a || "0").replace(",", ".")), z.number().min(0)),
  notes: z.string().optional(),
}).refine(data => {
    if (data.status === 'cancelled' || data.status === 'returned') {
        if (!data.notes || data.notes.trim().length === 0) {
            return false;
        }
    }
    return true;
}, {
    message: "Observações são obrigatórias para este status.",
    path: ["notes"],
});


type UpdateFormValues = z.infer<typeof updateSchema>;

const deliveryUpdateStatuses: OrderStatus[] = [
    'out_for_delivery', 'delivered', 'cancelled'
];

function OrderUpdateCard({ order, onUpdate }: { order: Order; onUpdate: () => void; }) {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<UpdateFormValues>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            status: order.status,
            paymentMethod: order.payment.method,
            paymentStatus: order.payment.status,
            amountPaid: order.payment.amountPaid ?? order.total,
            notes: order.payment.notes ?? '',
        },
    });

    const watchedStatus = form.watch('status');

    useEffect(() => {
        if (watchedStatus === 'delivered') {
            form.setValue('paymentStatus', 'aprovado');
        } else if (watchedStatus === 'out_for_delivery') {
            form.setValue('paymentStatus', 'aguardando');
        } else if (watchedStatus === 'cancelled' || watchedStatus === 'returned') {
            form.setValue('paymentStatus', 'recusado');
            form.setValue('amountPaid', 0);
            form.setValue('paymentMethod', 'outros');
        }
    }, [watchedStatus, form, order.total]);


    const onSubmit = async (data: UpdateFormValues) => {
        setIsSaving(true);
        try {
            await updateDeliveryDetails(order.id, {
                status: data.status,
                payment: {
                    method: data.paymentMethod,
                    status: data.paymentStatus,
                    amountPaid: data.amountPaid,
                    notes: data.notes,
                }
            });
            toast({ title: "Entrega atualizada!", description: `O pedido para ${order.customer.name} foi salvo.` });
            onUpdate(); // Re-fetch data
        } catch (error) {
            console.error("Failed to update delivery:", error);
            toast({ variant: "destructive", title: "Erro ao atualizar" });
        } finally {
            setIsSaving(false);
        }
    };

    const firstItem = order.items[0];
    const moreItemsCount = order.items.length - 1;
    
    return (
         <Card className="p-0 border-l-4" style={{ borderColor: getDeliveryStatusConfig(form.watch('status')).variant.match(/bg-(.*?)\-/)?.[1] }}>
            <AccordionItem value={order.id} className="border-b-0">
                <AccordionTrigger className="p-3 text-left hover:no-underline">
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-sm leading-tight">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate" title={`${firstItem.quantity}x ${firstItem.productName} ${moreItemsCount > 0 ? `(+${moreItemsCount} itens)` : ''}`}>
                            {firstItem.quantity}x {firstItem.productName} {moreItemsCount > 0 ? `(+${moreItemsCount} itens)` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                           <MapPin className="h-3 w-3" /> 
                           Bairro: {order.shipping?.address?.neighborhood || 'N/A'}
                        </p>
                    </div>
                    <p className="font-bold text-base px-4">{formatCurrency(order.total)}</p>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem><FormLabel>Status da Entrega</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        {deliveryUpdateStatuses.map(s => <SelectItem key={s} value={s}>{t(`orderStatus.${s}`)}</SelectItem>)}
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem><FormLabel>Forma de Pagamento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="credito">Crédito</SelectItem>
                                        <SelectItem value="debito">Débito</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="link">Link</SelectItem>
                                        <SelectItem value="outros">Outros</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                                    <FormItem><FormLabel>Status do Pagamento</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="aguardando">Aguardando</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="recusado">Cancelado</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="amountPaid" render={({ field }) => (
                                    <FormItem><FormLabel>Valor Pago</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="ID da transação, motivo do cancelamento, etc." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="flex justify-end">
                                <Button type="submit" size="sm" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </AccordionContent>
            </AccordionItem>
        </Card>
    );
}

const getDeliveryStatusConfig = (status?: OrderStatus) => {
    switch (status) {
        case 'delivered':
            return { variant: 'bg-green-600/20 text-green-700 border-green-500', icon: <PackageCheck className="mr-1 h-3 w-3" /> };
        case 'out_for_delivery':
            return { variant: 'bg-blue-600/20 text-blue-700 border-blue-500', icon: <Truck className="mr-1 h-3 w-3" /> };
        case 'processing':
            return { variant: 'bg-yellow-600/20 text-yellow-700 border-yellow-500', icon: <Hourglass className="mr-1 h-3 w-3" /> };
        case 'cancelled':
        case 'returned':
             return { variant: 'bg-red-600/20 text-red-700 border-red-500', icon: <PackageX className="mr-1 h-3 w-3" /> };
        default:
            return { variant: 'bg-gray-600/20 text-gray-700 border-gray-500', icon: <Package className="mr-1 h-3 w-3" /> };
    }
}

    



    

    

    
