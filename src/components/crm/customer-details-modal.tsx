"use client";

import type { Customer } from "@/services/customer-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";

type CustomerDetailsModalProps = {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
};

export function CustomerDetailsModal({ customer, isOpen, onClose }: CustomerDetailsModalProps) {
    if (!customer) return null;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

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
                             <p className="text-muted-foreground">{customer.email}</p>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-4">
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold">Informações de Contato</h4>
                            <p className="text-sm"><strong>Telefone:</strong> {customer.phone || 'N/A'}</p>
                            <p className="text-sm"><strong>Status:</strong> <span className="font-medium text-primary">{customer.status}</span></p>
                        </div>
                        <Separator />
                         <div className="space-y-2">
                            <h4 className="font-semibold">Histórico de Pedidos</h4>
                             <div className="text-sm text-muted-foreground text-center py-8">
                                Histórico de pedidos em breve.
                            </div>
                        </div>
                         <Separator />
                         <div className="space-y-2">
                            <h4 className="font-semibold">Notas</h4>
                             <div className="text-sm text-muted-foreground text-center py-8">
                                Seção de notas em breve.
                            </div>
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
