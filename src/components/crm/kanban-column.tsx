"use client";

import type { Customer } from "@/services/customer-service";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CustomerCard } from "./customer-card";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
    status: Customer['status'];
    customers: Customer[];
    onCardClick: (customer: Customer) => void;
};


export function KanbanColumn({ status, customers, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });
    
    const getBackgroundColor = () => {
        if (isOver) return "bg-primary/10";
        switch (status) {
            case 'Lead': return 'bg-blue-500/5 dark:bg-blue-900/20';
            case 'Contact': return 'bg-yellow-500/5 dark:bg-yellow-900/20';
            case 'Active': return 'bg-green-500/5 dark:bg-green-900/20';
            case 'VIP': return 'bg-purple-500/5 dark:bg-purple-900/20';
            default: return 'bg-muted/50';
        }
    }

    return (
        <div ref={setNodeRef} className={cn("rounded-lg flex flex-col h-full", getBackgroundColor())}>
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">{status} <span className="font-normal text-sm text-muted-foreground">({customers.length})</span></h3>
            </div>
            <ScrollArea className="flex-1 p-2">
                {customers.map(customer => (
                    <SortableCustomerCard key={customer.id} customer={customer} onCardClick={onCardClick} />
                ))}
                 {customers.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Arraste clientes aqui
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}


function SortableCustomerCard({ customer, onCardClick }: { customer: Customer, onCardClick: (customer: Customer) => void; }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onCardClick(customer)}>
      <CustomerCard customer={customer} />
    </div>
  );
}
