
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
import { useTranslation } from "@/context/i18n-context";


type Stage = {
    id: string;
    label: string;
};

export default function CrmPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();

    const defaultStages: Stage[] = [
        { id: 'Lead', label: t('crmStages.lead') },
        { id: 'Contact', label: t('crmStages.contact') },
        { id: 'Active', label: t('crmStages.active') },
        { id: 'VIP', label: t('crmStages.vip') },
    ];

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stages, setStages] = useState<Stage[]>(defaultStages);
    const [activeStageId, setActiveStageId] = useState<string>("Lead");
    
    const [loading, setLoading] = useState(true);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalCustomer, setDetailsModalCustomer] = useState<Customer | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);

    const activeCustomer = activeId ? customers.find(c => c.id === activeId) : null;
    const activeItemType = activeId ? (stages.some(s => s.id === activeId) ? 'Stage' : 'Customer') : null;


    const fetchCustomers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userCustomers = await getCustomersByUser(user.uid);
            setCustomers(userCustomers);
            
            // In a future implementation, stages would be fetched from a user's settings
            // For now, we use the translated default stages.
            setStages(defaultStages);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [user, t]); // Re-fetch or re-set if language changes

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer]);
        // If the new customer's status is a new stage, you might add it to the stages list here in the future
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over) return;
        
        const isOverAStageDropZone = over.data.current?.type === 'Stage';

        // Reordering stages in the menu
        if (activeItemType === 'Stage' && isOverAStageDropZone) {
            if (active.id !== over.id) {
                setStages((currentStages) => {
                    const oldIndex = currentStages.findIndex(s => s.id === active.id);
                    const newIndex = currentStages.findIndex(s => s.id === over.data.current?.stage.id);
                    return arrayMove(currentStages, oldIndex, newIndex);
                });
            }
            return;
        }
            
        // Dropping a customer onto a stage in the menu
        if (activeItemType === 'Customer' && isOverAStageDropZone) {
            const newStageId = over.id.replace('stage-drop-', '');
            const customerId = active.id as string;
            const originalCustomer = customers.find(c => c.id === customerId);

            if (!originalCustomer || originalCustomer.status === newStageId) return;

            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStageId } : c));

            try {
                await updateCustomerStatus(customerId, newStageId);
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

    const filteredCustomers = customers.filter(c => c.status === activeStageId);

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
                <div className="flex-1 mt-4 grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden">
                    <div className="md:col-span-1 h-full overflow-y-auto no-scrollbar">
                       <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                         <StageMenu 
                           stages={stages}
                           activeStageId={activeStageId}
                           onSelectStage={setActiveStageId}
                           activeItemType={activeItemType}
                         />
                       </SortableContext>
                    </div>
                    <div className="md:col-span-3 h-full overflow-y-auto no-scrollbar">
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
                {activeId && activeItemType === 'Stage' && stages.find(s => s.id === activeId) ? (
                     <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-lg">{stages.find(s => s.id === activeId)?.label}</div>
                 ) : null}
             </DragOverlay>
        </DndContext>
    );
}
