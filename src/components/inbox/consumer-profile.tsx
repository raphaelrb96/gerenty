
"use client";

import type { Customer, Stage } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShoppingCart, Pencil } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type ConsumerProfileProps = {
    customer: Customer | null;
    stages: Stage[];
    onEdit: () => void;
}

export function ConsumerProfile({ customer, stages, onEdit }: ConsumerProfileProps) {
    const { formatCurrency } = useCurrency();

    if (!customer) {
        return (
             <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-muted/50 border-l">
                <User className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">Detalhes do Contato</h3>
                <p className="text-sm">Selecione uma conversa para ver os detalhes do contato aqui.</p>
            </div>
        );
    }
    
    const displayName = customer.name && customer.name.toLowerCase() !== 'unknown' 
        ? customer.name 
        : customer.phone;

    const stage = stages.find(s => s.id === customer.status);

    return (
        <div className="flex flex-col h-full bg-muted/20 border-t">
            <ScrollArea className="flex-1 pr-4">
                <div className="p-4 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4"/>
                                Informações
                            </CardTitle>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">E-mail:</span>
                                <span>{customer.email || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Estágio CRM:</span>
                                <span>{stage?.name || 'N/A'}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Desde:</span>
                                <span>{new Date(customer.createdAt as string).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4"/>
                                Histórico de Compras
                            </CardTitle>
                        </CardHeader>
                         <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Pedidos:</span>
                                <span>{/* consumer.ordersCount */} 0</span>
                            </div>
                             <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Total Gasto:</span>
                                <span>{formatCurrency(0 /* consumer.totalSpent */)}</span>
                            </div>
                             <Separator className="my-2"/>
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                Lista de pedidos em breve.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
}
