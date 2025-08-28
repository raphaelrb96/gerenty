"use client";

import { useState } from "react";
import { Customer, updateCustomerStatus } from "@/services/customer-service";
import { KanbanColumn } from "./kanban-column";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { CustomerDetailsModal } from "./customer-details-modal";
import { useToast } from "@/hooks/use-toast";

type KanbanBoardProps = {
    customers: Customer[];
    onCustomerUpdated: (customer: Customer) => void;
};

const columns = ["Lead", "Contact", "Active", "VIP"];

export function KanbanBoard({ customers, onCustomerUpdated }: KanbanBoardProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const { toast } = useToast();

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const customerId = active.id as string;
            const newStatus = over.id as Customer['status'];

            const originalCustomer = customers.find(c => c.id === customerId);
            if (!originalCustomer) return;

            // Optimistic UI update
            const updatedCustomer = { ...originalCustomer, status: newStatus };
            onCustomerUpdated(updatedCustomer);

            try {
                await updateCustomerStatus(customerId, newStatus);
                toast({ title: "Status do cliente atualizado!" });
            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Erro ao atualizar status" });
                // Revert optimistic update on failure
                onCustomerUpdated(originalCustomer);
            }
        }
    };

    const handleCardClick = (customer: Customer) => {
        setSelectedCustomer(customer);
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-x-auto">
                {columns.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status as Customer['status']}
                        customers={customers.filter(c => c.status === status)}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>
            <CustomerDetailsModal
                customer={selectedCustomer}
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </DndContext>
    );
}
