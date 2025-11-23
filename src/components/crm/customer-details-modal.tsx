
"use client";

import type { Customer, Order } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Home, Phone, Mail, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useEffect, useState } from "react";
import { getOrdersForCustomer } from "@/services/order-service";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";

type CustomerDetailsModalProps = {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    stages: { id: string; name: string }[];
};

function OrderHistory({ customer }: { customer: Customer }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useCurrency();
    const { companies } = useCompany();
    const companyIds = companies.map(c => c.id);

    useEffect(() => {
        if (customer) {
            setLoading(true);
            getOrdersForCustomer(customer.id, companyIds)
                .then(setOrders)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [customer, companyIds]);

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    if (loading) {
        return <p className="text-sm text-muted-foreground">Carregando histórico...</p>
    }

    if (orders.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido encontrado.</p>
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                <span className="font-medium text-muted-foreground">Total Gasto:</span>
                <span className="font-bold text-base">{formatCurrency(totalSpent)}</span>
            </div>
            {orders.map(order => (
                <div key={order.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                    <div>
                        <p className="font-medium">Pedido #{order.id.substring(0, 7)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt as string).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                </div>
            ))}
        </div>
    );
}

export function CustomerDetailsModal({ customer, isOpen, onClose, stages }: CustomerDetailsModalProps) {
    const { t } = useTranslation();
    if (!customer) return null;

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    const stageName = stages.find(s => s.id === customer.status)?.name || customer.status;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md flex flex-col h-full md:h-[80vh]">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={customer.profileImageUrl} />
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <DialogTitle className="text-2xl">{customer.name}</DialogTitle>
                             <DialogDescription>
                                <span className="font-medium text-primary">{stageName}</span>
                             </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-4">
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold">Informações de Contato</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4"/>
                                <span>{customer.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4"/>
                                <span>{customer.phone || 'N/A'}</span>
                            </div>
                        </div>

                         {customer.address && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Endereço</h4>
                                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Home className="h-4 w-4 mt-1 flex-shrink-0" />
                                        <address className="not-italic">
                                            {customer.address.street}, {customer.address.number}<br/>
                                            {customer.address.neighborhood}, {customer.address.city} - {customer.address.state}<br/>
                                            CEP: {customer.address.zipCode}
                                        </address>
                                    </div>
                                </div>
                            </>
                         )}

                         <Separator />
                         <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Histórico de Compras</h4>
                            <OrderHistory customer={customer} />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t">
                    <Button onClick={onClose} variant="outline">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
