
"use client";

import type { Customer } from "@/services/customer-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Home, Phone, Mail } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

type CustomerDetailsModalProps = {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    stages: { id: string; name: string }[];
};

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
                            <h4 className="font-semibold">Histórico</h4>
                             <div className="text-sm text-muted-foreground text-center py-8">
                                Histórico em breve.
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
