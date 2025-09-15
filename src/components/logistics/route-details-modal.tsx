

"use client";

import * as React from "react";
import { useState } from "react";
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
import { User, Calendar, Truck, DollarSign, Clock, Box, Info, Pencil, AlertTriangle, PackageCheck, PackageX, Loader2, MapPin, Hourglass, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { finalizeRoute, batchUpdateDeliveryDetails } from "@/services/logistics-service";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/i18n-context";
import { ALL_ORDER_STATUSES } from "@/lib/order-statuses";


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

const getDeliveryStatusConfig = (status?: OrderStatus) => {
    switch (status) {
        case 'delivered':
            return { variant: 'bg-green-600/20 text-green-700', icon: <PackageCheck className="mr-1 h-3 w-3" /> };
        case 'out_for_delivery':
            return { variant: 'bg-blue-600/20 text-blue-700', icon: <Truck className="mr-1 h-3 w-3" /> };
        case 'processing':
            return { variant: 'bg-yellow-600/20 text-yellow-700', icon: <Hourglass className="mr-1 h-3 w-3" /> };
        case 'cancelled':
        case 'returned':
             return { variant: 'bg-red-600/20 text-red-700', icon: <PackageX className="mr-1 h-3 w-3" /> };
        default:
            return { variant: 'bg-gray-600/20 text-gray-700', icon: <Package className="mr-1 h-3 w-3" /> };
    }
}


export function RouteDetailsModal({
  isOpen,
  onClose,
  route,
  onRouteFinalized
}: RouteDetailsModalProps) {
    const { formatCurrency } = useCurrency();
    const { toast } = useToast();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);

    React.useEffect(() => {
        if (route) {
            // Pre-select all orders by default
            setSelectedOrders(route.orders.map(o => o.id));
        }
    }, [route]);


    if (!route) return null;
    
    const handleToggleOrder = (orderId: string) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    }
    
    const handleFinalizeRoute = async () => {
        setIsFinalizing(true);
        try {
            await finalizeRoute(route.id, selectedOrders);
            toast({ title: "Rota Finalizada", description: "A rota foi concluída e os status foram atualizados." });
            onRouteFinalized(); // Callback to refresh the Kanban board
            onClose(); // Close the main modal
        } catch (error) {
            console.error("Error finalizing route:", error);
            toast({ variant: "destructive", title: "Erro ao Finalizar", description: "Não foi possível finalizar a rota. Tente novamente." });
        } finally {
            setIsFinalizing(false);
            setShowConfirmation(false);
        }
    }

    const totalPix = route.pixTotal || 0;
    const totalCard = route.cardTotal || 0;
    const totalDinheiro = route.cashTotal || 0;
    const totalOnline = route.onlineTotal || 0;

    const deliveredOrders = route.orders.filter(o => selectedOrders.includes(o.id));
    const returnedOrders = route.orders.filter(o => !selectedOrders.includes(o.id));
    const returnedItems = returnedOrders.flatMap(o => o.items.map(item => `${item.quantity}x ${item.productName}`));

    const handleBatchUpdate = async (updates: { payment?: Partial<PaymentDetails>, status?: Order['status'] }) => {
        if (selectedOrders.length === 0) {
            toast({ variant: "destructive", title: "Nenhuma entrega selecionada", description: "Selecione ao menos uma entrega para atualizar."});
            return;
        }
        try {
            await batchUpdateDeliveryDetails(selectedOrders, updates);
            toast({ title: "Entregas atualizadas com sucesso!" });
            onRouteFinalized(); // Refresh data
            setPaymentModalOpen(false);
            setStatusModalOpen(false);
        } catch (error) {
            console.error("Failed to batch update:", error);
            toast({ variant: "destructive", title: "Erro ao atualizar entregas" });
        }
    };


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
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 py-4 min-h-0">
                <ScrollArea className="md:col-span-1">
                    <div className="space-y-4 pr-4">
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
                            <Badge>{route.status}</Badge>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Resumo Financeiro da Rota</h4>
                            <StatCard title="Total em PIX" value={formatCurrency(totalPix)} icon={<Info className="h-5 w-5 text-blue-500" />} />
                            <StatCard title="Total em Cartão" value={formatCurrency(totalCard)} icon={<Info className="h-5 w-5 text-orange-500" />} />
                            <StatCard title="Total em Dinheiro" value={formatCurrency(totalDinheiro)} icon={<DollarSign className="h-5 w-5 text-green-500" />} />
                            <StatCard title="Pagamentos Online" value={formatCurrency(totalOnline)} icon={<Info className="h-5 w-5 text-purple-500" />} />
                        </div>
                        <Separator />
                        <div className="space-y-2 ml-1">
                            <Label htmlFor="driver-earning">Pagamento do Entregador (Opcional)</Label>
                            <Input id="driver-earning" type="number" placeholder="R$ 0,00" />
                        </div>
                        <div className="space-y-2 ml-1 mb-10">
                            <Label htmlFor="route-notes">Anotações da Rota</Label>
                            <Textarea id="route-notes" placeholder="Insira anotações importantes aqui..." defaultValue={route.notes}/>
                        </div>
                    </div>
                </ScrollArea>
                <ScrollArea className="md:col-span-2 pr-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Box className="h-5 w-5" /> Entregas ({route.orders.length})</h3>
                    <p className="text-sm text-muted-foreground mb-4">Marque as entregas que foram concluídas com sucesso. Itens não marcados serão considerados devolvidos.</p>
                    <div className="space-y-3">
                    {route.orders.map(order => {
                         const statusConfig = getDeliveryStatusConfig(order.status);
                         return (
                            <Card key={order.id} className="p-0">
                                <div className="p-3 flex items-start gap-3">
                                    <Checkbox 
                                    id={`order-${order.id}`}
                                    className="mt-1" 
                                    checked={selectedOrders.includes(order.id)}
                                    onCheckedChange={() => handleToggleOrder(order.id)}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm leading-tight">Pedido #{order.id.substring(0,7)}</p>
                                                <p className="text-xs text-muted-foreground">{order.customer.name}</p>
                                            </div>
                                            <p className="font-bold text-base">{formatCurrency(order.total)}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-start gap-2">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <address className="not-italic">
                                                {order.shipping?.address?.street}, {order.shipping?.address?.number}, {order.shipping?.address?.complement ? `(${order.shipping.address.complement})` : ''} <br/>
                                                {order.shipping?.address?.neighborhood} - {order.shipping?.address?.city}, {order.shipping?.address?.state}
                                            </address>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="capitalize">{order.payment.method}</Badge>
                                             <Badge variant="outline" className={cn(getDeliveryStatusConfig(order.status).variant)}>
                                                {statusConfig.icon}
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="items" className="border-t">
                                        <AccordionTrigger className="text-xs px-3 py-2">
                                            Ver Itens ({order.items.length})
                                        </AccordionTrigger>
                                        <AccordionContent className="px-3 pb-3">
                                            <ul className="space-y-1 text-xs text-muted-foreground">
                                                {order.items.map(item => (
                                                    <li key={item.productId} className="flex justify-between">
                                                        <span>{item.quantity}x {item.productName}</span>
                                                        <span>{formatCurrency(item.totalPrice)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </Card>
                         )
                    })}
                    </div>
                </ScrollArea>
          </div>
          <DialogFooter className="pt-4 border-t flex-shrink-0 px-6 pb-6">
              <div className="flex justify-between w-full">
                  <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPaymentModalOpen(true)} disabled={selectedOrders.length === 0}>Atualizar Pagamento</Button>
                        <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(true)} disabled={selectedOrders.length === 0}>Atualizar Status</Button>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={onClose}>Fechar</Button>
                      <Button onClick={() => setShowConfirmation(true)} disabled={route.status !== 'em_andamento'}>Finalizar Rota</Button>
                  </div>
              </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento da Rota?</AlertDialogTitle>
            <AlertDialogDescription>
              Revise os detalhes do fechamento antes de confirmar. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4 max-h-[40vh] overflow-y-auto">
            <div className="rounded-lg border bg-card p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-green-500" /> Prestação de Contas</h4>
              <p>Valor total em dinheiro a ser recebido do entregador: <strong className="text-lg">{formatCurrency(totalDinheiro)}</strong></p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><PackageCheck className="h-5 w-5 text-green-500"/> Entregas Concluídas ({deliveredOrders.length})</h4>
              <p className="text-sm text-muted-foreground">{deliveredOrders.length > 0 ? deliveredOrders.map(o => `#${o.id.substring(0,7)}`).join(', ') : "Nenhuma"}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2"><PackageX className="h-5 w-5 text-red-500"/> Devoluções ({returnedOrders.length})</h4>
              {returnedOrders.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {returnedItems.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item devolvido.</p>
              )}
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
        <UpdatePaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            onSave={(payment) => handleBatchUpdate({ payment })}
            selectedCount={selectedOrders.length}
        />
        <UpdateStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onSave={(updates) => handleBatchUpdate(updates)}
            selectedCount={selectedOrders.length}
        />
    </>
  );
}


function UpdatePaymentModal({ isOpen, onClose, onSave, selectedCount }: { isOpen: boolean, onClose: () => void, onSave: (data: Partial<PaymentDetails>) => void, selectedCount: number }) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
    const [paymentStatus, setPaymentStatus] = useState<PaymentDetails['status'] | undefined>();

    const handleSave = () => {
        const updates: Partial<PaymentDetails> = {};
        if (paymentMethod) updates.method = paymentMethod;
        if (paymentStatus) updates.status = paymentStatus;
        onSave(updates);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Atualizar Pagamento ({selectedCount} entregas)</DialogTitle>
                    <DialogDescription>
                        Selecione a nova forma ou status de pagamento. Apenas os campos preenchidos serão atualizados.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label>Forma de Pagamento Recebida</Label>
                        <Select onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="credito">Cartão de Crédito</SelectItem>
                                <SelectItem value="debito">Cartão de Débito</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Status do Pagamento</Label>
                        <Select onValueChange={(v) => setPaymentStatus(v as PaymentDetails['status'])}>
                             <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="aprovado">Pago</SelectItem>
                                <SelectItem value="recusado">Não Pago</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UpdateStatusModal({ isOpen, onClose, onSave, selectedCount }: { isOpen: boolean, onClose: () => void, onSave: (data: { status: OrderStatus }) => void, selectedCount: number }) {
    const [deliveryStatus, setDeliveryStatus] = useState<OrderStatus | undefined>();
    const { t } = useTranslation();

    const handleSave = () => {
        if (deliveryStatus) {
            onSave({ status: deliveryStatus });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Atualizar Status da Entrega ({selectedCount} entregas)</DialogTitle>
                    <DialogDescription>Selecione o novo status para as entregas selecionadas.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label>Novo Status</Label>
                    <Select onValueChange={(v) => setDeliveryStatus(v as OrderStatus)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                           {ALL_ORDER_STATUSES.map(status => (
                               <SelectItem key={status} value={status}>{t(`orderStatus.${status}`)}</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
