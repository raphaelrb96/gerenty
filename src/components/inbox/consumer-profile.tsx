
"use client";

import type { Consumer } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShoppingCart } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { Separator } from "../ui/separator";

type ConsumerProfileProps = {
    consumer: Consumer | null;
}

export function ConsumerProfile({ consumer }: ConsumerProfileProps) {
    const { formatCurrency } = useCurrency();

    const getInitials = (name: string) => {
        if (!name || name.trim().toLowerCase() === 'unknown') return '?';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    if (!consumer) {
        return (
             <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-muted/50 border-l">
                <User className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">Detalhes do Contato</h3>
                <p className="text-sm">Selecione uma conversa para ver os detalhes do contato aqui.</p>
            </div>
        );
    }
    
    const displayName = consumer.name && consumer.name.toLowerCase() !== 'unknown' 
        ? consumer.name 
        : consumer.phone;

    return (
        <div className="flex flex-col h-full bg-muted/50 border-l">
            <header className="p-4 border-b text-center space-y-3">
                <Avatar className="h-20 w-20 border-2 border-background mx-auto">
                    <AvatarFallback className="text-2xl">{getInitials(consumer.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold text-lg">{displayName}</h2>
                    <p className="text-sm text-muted-foreground">{consumer.phone}</p>
                </div>
                <div className="flex justify-center gap-2">
                    <Badge variant={consumer.isCustomer ? "default" : "secondary"}>
                        {consumer.type}
                    </Badge>
                </div>
            </header>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4"/>
                                Informações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">E-mail:</span>
                                <span>{consumer.email || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fonte:</span>
                                <span>{consumer.source}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Desde:</span>
                                <span>{new Date(consumer.createdAt as string).toLocaleDateString()}</span>
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
                                <span>{consumer.ordersCount}</span>
                            </div>
                             <div className="flex justify-between font-medium">
                                <span className="text-muted-foreground">Total Gasto:</span>
                                <span>{formatCurrency(consumer.totalSpent)}</span>
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
