"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getCustomersByUser, Customer, updateCustomerStatus } from "@/services/customer-service";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateCustomerModal } from "@/components/crm/create-customer-modal";
import { CustomerDetailsModal } from "@/components/crm/customer-details-modal";
import { StageMenu } from "@/components/crm/stage-menu";
import { CustomerList } from "@/components/crm/customer-list";
import { CustomerCard } from "@/components/crm/customer-card";
import { useToast } from "@/hooks/use-toast";


const defaultStages = ["Lead", "Contact", "Active", "VIP"];

export default function CrmPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [activeStage, setActiveStage] = useState<string>("Lead");
    const [stages, setStages] = useState<string[]>(defaultStages);
    const [loading, setLoading] = useState(true);
    
    // Modals state
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalCustomer, setDetailsModalCustomer] = useState<Customer | null>(null);

    // Drag and Drop state
    const [activeId, setActiveId] = useState<string | null>(null);

    const activeCustomer = customers.find(c => c.id === activeId);

    const fetchCustomers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userCustomers = await getCustomersByUser(user.uid);
            setCustomers(userCustomers);
            
            // Dynamically create stages from existing customer statuses + default ones
            const existingStatuses = userCustomers.map(c => c.status);
            const allStages = [...new Set([...defaultStages, ...existingStatuses])];
            setStages(allStages);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [user]);

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer]);
        // No need to re-fetch, just add to the list
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over) return;
        
        // Handle dropping a customer onto a new stage in the menu
        if (over.id.startsWith('stage-') && active.data.current?.customer) {
            const newStage = over.id.replace('stage-', '');
            const customerId = active.id as string;
            const originalCustomer = customers.find(c => c.id === customerId);

            if (!originalCustomer || originalCustomer.status === newStage) return;

            // Optimistic UI update
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStage } : c));

            try {
                await updateCustomerStatus(customerId, newStage);
                toast({ title: "Status do cliente atualizado!" });
            } catch (error) {
                console.error("Error updating customer status:", error);
                toast({ variant: "destructive", title: "Erro ao atualizar o status do cliente" });
                // Revert on failure
                setCustomers(prev => prev.map(c => c.id === customerId ? originalCustomer : c));
            }
        }
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    const filteredCustomers = customers.filter(c => c.status === activeStage);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full">
                <PageHeader
                    title="CRM de Clientes"
                    description="Gerencie o funil de relacionamento com seus clientes."
                    action={
                        <Button onClick={() => setCreateModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Cliente
                        </Button>
                    }
                />
                <div className="flex-1 mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-hidden">
                    <div className="md:col-span-1 lg:col-span-1 h-full">
                       <StageMenu 
                         stages={stages}
                         activeStage={activeStage}
                         onSelectStage={setActiveStage}
                         customerCount={stages.reduce((acc, stage) => {
                            acc[stage] = customers.filter(c => c.status === stage).length;
                            return acc;
                         }, {} as Record<string, number>)}
                       />
                    </div>
                    <div className="md:col-span-3 lg:col-span-4 h-full overflow-y-auto">
                        <SortableContext items={filteredCustomers.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <CustomerList
                                customers={filteredCustomers}
                                onCardClick={setDetailsModalCustomer}
                            />
                        </SortableContext>
                    </div>
                </div>
            </div>
             <CreateCustomerModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCustomerCreated={handleCustomerCreated}
            />
            <CustomerDetailsModal
                customer={detailsModalCustomer}
                isOpen={!!detailsModalCustomer}
                onClose={() => setDetailsModalCustomer(null)}
            />
             <DragOverlay>
                {activeId && activeCustomer ? <CustomerCard customer={activeCustomer} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
