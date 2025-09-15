
"use client";

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
import type { Route, Order } from "@/lib/types";
import { useCurrency } from "@/context/currency-context";
import { User, Calendar, Truck, DollarSign, Clock, Box, Info, Pencil, AlertTriangle, PackageCheck, PackageX, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { finalizeRoute } from "@/services/logistics-service";
import { useToast } from "@/hooks/use-toast";

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

    React.useEffect(() => {
        if (route) {
            // Pre-select all orders by default
            setSelectedOrders(route.orders.map(o => o.id));
        }
    }, [route]);


    if (!route) return null;
    
    const getPaymentStatusVariant = (status: Order['payment']['status']) => {
        switch (status) {
            case 'aprovado': return 'bg-green-600/20 text-green-700';
            case 'aguardando': return 'bg-yellow-600/20 text-yellow-700';
            case 'recusado': default: return 'bg-red-600/20 text-red-700';
        }
    }

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

    const totalPix = route.orders.reduce((sum, o) => o.payment.method === 'pix' ? sum + o.total : sum, 0);
    const totalCard = route.orders.reduce((sum, o) => (o.payment.method === 'credito' || o.payment.method === 'debito') ? sum + o.total : sum, 0);
    const totalDinheiro = route.totalCashInRoute || 0;
    const totalOnline = route.orders.reduce((sum, o) => o.payment.type === 'online' ? sum + o.total : sum, 0);

    const deliveredOrders = route.orders.filter(o => selectedOrders.includes(o.id));
    const returnedOrders = route.orders.filter(o => !selectedOrders.includes(o.id));
    const returnedItems = returnedOrders.flatMap(o => o.items.map(item => `${item.quantity}x ${item.productName}`));


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl flex flex-col h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes da Rota #{route.id.substring(0, 7)}</DialogTitle>
            <DialogDescription>
              Informações completas sobre a rota, entregador e pedidos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
              <div className="md:col-span-1 space-y-4 flex flex-col">
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
                   <div className="space-y-2">
                      <Label htmlFor="driver-earning">Pagamento do Entregador (Opcional)</Label>
                      <Input id="driver-earning" type="number" placeholder="R$ 0,00" />
                   </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label htmlFor="route-notes">Anotações da Rota</Label>
                      <Textarea id="route-notes" placeholder="Insira anotações importantes aqui..." className="flex-1" defaultValue={route.notes}/>
                   </div>
              </div>
              <div className="md:col-span-2 flex flex-col overflow-hidden border-l pl-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Box className="h-5 w-5" /> Entregas ({route.orders.length})</h3>
                  <p className="text-sm text-muted-foreground mb-4">Marque as entregas que foram concluídas com sucesso. Itens não marcados serão considerados devolvidos.</p>
                   <div className="flex-1 overflow-y-auto pr-2">
                      <div className="space-y-3">
                      {route.orders.map(order => (
                          <div key={order.id} className="border p-3 rounded-lg flex items-start gap-3">
                              <Checkbox 
                                id={`order-${order.id}`}
                                className="mt-1" 
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => handleToggleOrder(order.id)}
                              />
                              <div className="flex-1">
                                  <p className="font-semibold text-sm">Pedido #{order.id.substring(0,7)} - {formatCurrency(order.total)}</p>
                                  <p className="text-xs text-muted-foreground">{order.shipping?.address?.street}, {order.shipping?.address?.number}</p>
                                  <p className="text-xs text-muted-foreground">{order.shipping?.address?.neighborhood}, {order.shipping?.address?.city}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className={getPaymentStatusVariant(order.payment.status)}>{order.payment.status}</Badge>
                                  <Badge variant="secondary" className="capitalize">{order.payment.method}</Badge>
                              </div>
                          </div>
                      ))}
                      </div>
                  </div>
              </div>
          </div>
          <DialogFooter className="pt-4 border-t">
              <div className="flex justify-between w-full">
                  <div className="flex gap-2">
                       <Button variant="outline" size="sm" disabled>Atualizar Pagamento</Button>
                       <Button variant="outline" size="sm" disabled>Atualizar Status</Button>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={onClose}>Fechar</Button>
                      <Button onClick={() => setShowConfirmation(true)} disabled={route.status !== 'a_caminho'}>Finalizar Rota</Button>
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
    </>
  );
}
