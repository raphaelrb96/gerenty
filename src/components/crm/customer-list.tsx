

"use client";

import type { Customer } from "@/services/customer-service";
import { CustomerCard } from "./customer-card";
import { EmptyState } from "../common/empty-state";
import { HeartHandshake } from "lucide-react";

type CustomerListProps = {
    customers: Customer[];
    getStageName: (stageId: string) => string;
    onViewDetails: (customer: Customer) => void;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
};

export function CustomerList({ customers, getStageName, onViewDetails, onEdit, onDelete }: CustomerListProps) {
    if (customers.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <EmptyState
                    icon={<HeartHandshake className="h-12 w-12" />}
                    title="Nenhum cliente neste estágio"
                    description="Arraste um cliente para esta coluna ou adicione um novo cliente."
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
            {customers.map(customer => (
                <CustomerCard 
                    key={customer.id} 
                    customer={customer}
                    stageName={getStageName(customer.status)}
                    onViewDetails={() => onViewDetails(customer)} 
                    onEdit={() => onEdit(customer)}
                    onDelete={() => onDelete(customer)}
                />
            ))}
        </div>
    );
}
