
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getCustomersByUser, Customer, updateCustomerStatus } from "@/services/customer-service";
import { getStagesByUser, addStage, updateStage, deleteStage, Stage } from "@/services/stage-service";

import { DndContext, DragEndEvent, DragOverlay, closestCorners, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
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
import { StageFormModal } from "@/components/crm/stage-form-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/context/i18n-context";

export default function CrmPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalCustomer, setDetailsModalCustomer] = useState<Customer | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
    const [stageToEdit, setStageToEdit] = useState<Stage | null>(null);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);


    useEffect(() => {
        const fetchAndInitializeData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [userCustomers, userStages] = await Promise.all([
                    getCustomersByUser(user.uid),
                    getStagesByUser(user.uid)
                ]);

                if (userStages.length === 0) {
                    // If no stages exist, create default ones
                    const defaultStageNames = ['Lead', 'Contact', 'Active', 'VIP'];
                    const createdStages: Stage[] = [];
                    for (let i = 0; i < defaultStageNames.length; i++) {
                        const newStage = await addStage({ 
                            name: t(`crmStages.${defaultStageNames[i].toLowerCase()}`), 
                            ownerId: user.uid, 
                            order: i 
                        });
                        createdStages.push(newStage);
                    }
                    setStages(createdStages);
                    setActiveStageId(createdStages[0]?.id || null);
                } else {
                    setStages(userStages.sort((a, b) => a.order - b.order));
                    setActiveStageId(userStages[0]?.id || null);
                }
                
                setCustomers(userCustomers);

            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar os dados do CRM." });
            } finally {
                setLoading(false);
            }
        };
        if(user) fetchAndInitializeData();
    }, [user, toast, t]);

    const activeCustomer = activeId ? customers.find(c => c.id === activeId) : null;
    const activeItemType = activeId ? (stages.some(s => s.id === activeId) ? 'Stage' : 'Customer') : null;

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer]);
    };

    const handleOpenStageModal = (stage: Stage | null = null) => {
        setStageToEdit(stage);
        setIsStageModalOpen(true);
    }

    const handleStageSave = async (data: { name: string }) => {
        if (!user) return;

        try {
            if (stageToEdit) {
                const updatedStage = await updateStage(stageToEdit.id, { name: data.name });
                setStages(prev => prev.map(s => s.id === stageToEdit.id ? updatedStage : s));
                toast({ title: "Estágio atualizado com sucesso!" });
            } else {
                const newStage = await addStage({ name: data.name, ownerId: user.uid, order: stages.length });
                setStages(prev => [...prev, newStage]);
                toast({ title: "Estágio criado com sucesso!" });
            }
            setIsStageModalOpen(false);
            setStageToEdit(null);
        } catch (error) {
             toast({ variant: "destructive", title: "Erro ao salvar estágio", description: "Tente novamente." });
        }
    }
    
    const handleDeleteStageConfirm = async () => {
        if (!stageToDelete) return;
        try {
            await deleteStage(stageToDelete.id);
            setStages(prev => prev.filter(s => s.id !== stageToDelete.id));
            if (activeStageId === stageToDelete.id) {
                setActiveStageId(stages.length > 1 ? stages.filter(s => s.id !== stageToDelete.id)[0].id : null);
            }
            toast({ title: "Estágio excluído com sucesso!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir estágio", description: "Tente novamente." });
        } finally {
            setStageToDelete(null);
        }
    }


    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const isActiveAStage = stages.some(s => s.id === active.id);
        const isOverAStage = stages.some(s => s.id === over.id || over.data.current?.type === 'Stage');

        if (isActiveAStage && isOverAStage) {
            setStages((currentStages) => {
                const oldIndex = currentStages.findIndex(s => s.id === active.id);
                const overId = over.id.toString().replace('stage-drop-', '');
                const newIndex = currentStages.findIndex(s => s.id === overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    return arrayMove(currentStages, oldIndex, newIndex);
                }
                return currentStages;
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (activeItemType === 'Stage' && over && active.id !== over.id) {
            // Persist the new order after visual reordering is done
            const updatedStages = stages.map((stage, index) => ({ ...stage, order: index }));
            setStages(updatedStages); 
            // In a real app, you would batch update the 'order' property in Firestore here.
            console.log("Persisting new stage order to DB...");
        }

        if (activeItemType === 'Customer' && over?.data.current?.type === 'Stage') {
            const newStageId = over.id.toString().replace('stage-drop-', '');
            const customerId = active.id as string;
            const originalCustomer = customers.find(c => c.id === customerId);

            if (!originalCustomer || originalCustomer.status === newStageId) {
                setActiveId(null);
                return;
            }

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
        
        setActiveId(null);
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    const filteredCustomers = activeStageId === null 
        ? customers 
        : customers.filter(c => c.status === activeStageId);

    return (
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
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
                           onAddStage={() => handleOpenStageModal()}
                           onEditStage={(stage) => handleOpenStageModal(stage)}
                           onDeleteStage={setStageToDelete}
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
            <StageFormModal 
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                onSave={handleStageSave}
                stage={stageToEdit}
            />
            <AlertDialog open={!!stageToDelete} onOpenChange={(isOpen) => !isOpen && setStageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o estágio. Os clientes neste estágio não serão excluídos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStageConfirm}>
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <DragOverlay>
                {activeId && activeItemType === 'Customer' && activeCustomer ? <CustomerCard customer={activeCustomer} isOverlay /> : null}
                {activeId && activeItemType === 'Stage' && stages.find(s => s.id === activeId) ? (
                     <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-lg">{stages.find(s => s.id === activeId)?.name}</div>
                 ) : null}
             </DragOverlay>
        </DndContext>
    );
}

    
