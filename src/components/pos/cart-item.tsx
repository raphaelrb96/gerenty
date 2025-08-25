
"use client"

import type { OrderItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useCurrency } from "@/context/currency-context";

type CartItemProps = {
    item: OrderItem;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdatePrice: (productId: string, newPrice: number) => void;
    onRemove: (productId: string) => void;
};

export function CartItem({ item, onUpdateQuantity, onUpdatePrice, onRemove }: CartItemProps) {
    const { formatCurrency } = useCurrency();

    return (
        <div className="flex items-start gap-4">
            <Image
                src={item.imageUrl || "https://placehold.co/48x48.png"}
                alt={item.productName}
                width={48}
                height={48}
                className="rounded-md aspect-square object-cover"
            />
            <div className="flex-grow flex flex-col">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{item.productName}</p>
                <div className="mt-2 flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                        type="number"
                        className="h-6 w-12 text-center"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.productId, parseInt(e.target.value, 10) || 0)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
                 <div className="mt-2 flex items-center justify-between">
                    <div className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                       <Input
                            type="number"
                            step="0.01"
                            className="h-8 w-28 pl-7 font-bold text-sm"
                            value={item.unitPrice.toFixed(2)}
                            onChange={(e) => onUpdatePrice(item.productId, parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <p className="font-bold text-sm">{formatCurrency(item.totalPrice)}</p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item.productId)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

    