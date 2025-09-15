
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Route, Order } from "@/lib/types";
import { useCurrency } from "@/context/currency-context";
import { User, Calendar, Truck, DollarSign, Clock, Box } from "lucide-react";

type RouteDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
};

export function RouteDetailsModal({
  isOpen,
  onClose,
  route,
}: RouteDetailsModalProps) {
    const { formatCurrency } = useCurrency();

    if (!route) return null;
    
    const getPaymentStatusVariant = (status: Order['payment']['status']) => {
        switch (status) {
            case 'aprovado': return 'bg-green-600/20 text-green-700';
            case 'aguardando': return 'bg-yellow-600/20 text-yellow-700';
            case 'recusado': default: return 'bg-red-600/20 text-red-700';
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Rota #{route.id.substring(0, 7)}</DialogTitle>
          <DialogDescription>
            Informações completas sobre a rota, entregador e pedidos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
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
                    <Badge>{route.status}</Badge>
                </div>
                 <Separator />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4"/> Valores</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>Total da Rota: <span className="font-bold">{formatCurrency(route.totalValue)}</span></p>
                        <p>Taxa do Entregador: <span className="font-bold">{formatCurrency(route.totalFee)}</span></p>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 flex flex-col overflow-hidden border-l pl-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Box className="h-5 w-5" /> Entregas ({route.orders.length})</h3>
                 <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                    {route.orders.map(order => (
                        <div key={order.id} className="border p-3 rounded-lg flex items-start gap-3">
                            <Checkbox className="mt-1" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Pedido #{order.id.substring(0,7)} - {formatCurrency(order.total)}</p>
                                <p className="text-xs text-muted-foreground">{order.shipping?.address?.street}, {order.shipping?.address?.number}</p>
                                <p className="text-xs text-muted-foreground">{order.shipping?.address?.neighborhood}, {order.shipping?.address?.city}</p>
                            </div>
                            <Badge variant="outline" className={getPaymentStatusVariant(order.payment.status)}>{order.payment.status}</Badge>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t">
            <div className="flex justify-between w-full">
                <div className="flex gap-2">
                     <Button variant="outline" size="sm">Atualizar Status</Button>
                     <Button variant="outline" size="sm">Pagamento</Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <Button>Finalizar Rota</Button>
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

