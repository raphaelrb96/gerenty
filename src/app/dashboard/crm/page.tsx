
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getCustomersByUser, Customer, updateCustomerStatus } from "@/services/customer-service";
import { DndContext, DragEndEvent, DragOverlay, closestCorners, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

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
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalCustomer, setDetailsModalCustomer] = useState<Customer | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);

    const activeCustomer = activeId ? customers.find(c => c.id === activeId) : null;
    const activeItemType = activeId ? (stages.includes(activeId) ? 'Stage' : 'Customer') : null;


    const fetchCustomers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userCustomers = await getCustomersByUser(user.uid);
            setCustomers(userCustomers);
            
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
        if (!stages.includes(newCustomer.status)) {
            setStages(prev => [...prev, newCustomer.status]);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over) return;
        
        // Item dropped on itself
        if (active.id === over.id) return;
        
        const isActiveAStage = stages.includes(active.id as string);
        const isOverAStage = stages.includes(over.id as string);
        const isOverACustomerDropZone = over.data.current?.type === 'Stage';


        // Reordering stages
        if (isActiveAStage && isOverAStage) {
            setStages((currentStages) => {
                const oldIndex = currentStages.indexOf(active.id as string);
                const newIndex = currentStages.indexOf(over.id as string);
                return arrayMove(currentStages, oldIndex, newIndex);
            });
            // Here you would typically save the new stage order to user preferences or a database
        }
            
        // Dropping a customer onto a stage in the menu
        if (isOverACustomerDropZone && !isActiveAStage) {
            const newStage = over.data.current.stage;
            const customerId = active.id as string;
            const originalCustomer = customers.find(c => c.id === customerId);

            if (!originalCustomer || originalCustomer.status === newStage) return;

            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStage } : c));

            try {
                await updateCustomerStatus(customerId, newStage);
                toast({ title: "Status do cliente atualizado!" });
            } catch (error) {
                console.error("Error updating customer status:", error);
                toast({ variant: "destructive", title: "Erro ao atualizar o status do cliente" });
                setCustomers(prev => prev.map(c => c.id === customerId ? originalCustomer : c));
            }
        }
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    const filteredCustomers = customers.filter(c => c.status === activeStage);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
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
                <div className="flex-1 mt-4 grid grid-cols-1 lg:grid-cols-5 gap-6 h-full overflow-hidden">
                    <div className="lg:col-span-1 h-full overflow-y-auto no-scrollbar">
                       <SortableContext items={stages} strategy={verticalListSortingStrategy}>
                         <StageMenu 
                           stages={stages}
                           activeStage={activeStage}
                           onSelectStage={setActiveStage}
                           activeItemType={activeItemType}
                         />
                       </SortableContext>
                    </div>
                    <div className="lg:col-span-4 h-full overflow-y-auto no-scrollbar">
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
                {activeId && activeItemType === 'Customer' && activeCustomer ? <CustomerCard customer={activeCustomer} isOverlay /> : null}
                {activeId && activeItemType === 'Stage' ? (
                     <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-lg">{activeId}</div>
                 ) : null}
             </DragOverlay>
        </DndContext>
    );
}
