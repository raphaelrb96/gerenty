

"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getCustomersByUser, Customer, updateCustomerStatus, deleteCustomer as deleteCustomerService, updateCustomer as updateCustomerService, batchUpdateCustomerOrder } from "@/services/customer-service";
import { getStagesByUser, addStage, updateStage, deleteStage, Stage, batchUpdateStageOrder } from "@/services/stage-service";

import { DndContext, DragEndEvent, DragOverlay, closestCorners, DragStartEvent, DragOverEvent, useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
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
import { CrmFilterBar } from "@/components/crm/crm-filter-bar";

const CUSTOMERS_PER_PAGE = 50;


function CrmPageComponent() {
    const { user, effectiveOwnerId } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const searchParams = useSearchParams();

    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [detailsModalCustomer, setDetailsModalCustomer] = useState<Customer | null>(null);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
    const [stageToEdit, setStageToEdit] = useState<Stage | null>(null);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [searchField, setSearchField] = useState("name");

    const [visibleCount, setVisibleCount] = useState(CUSTOMERS_PER_PAGE);

    const allAvailableTags = useMemo(() => {
        const tagSet = new Set<string>();
        allCustomers.forEach(c => c.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet);
    }, [allCustomers]);

    // Effect to handle opening customer details from URL
    useEffect(() => {
        const customerIdFromUrl = searchParams.get('customerId');
        if (customerIdFromUrl && allCustomers.length > 0) {
            const customerToShow = allCustomers.find(c => c.id === customerIdFromUrl);
            if (customerToShow) {
                setDetailsModalCustomer(customerToShow);
            }
        }
    }, [allCustomers, searchParams]);


    const fetchCustomers = async () => {
        if (!effectiveOwnerId) return;
        try {
            const userCustomers = await getCustomersByUser(effectiveOwnerId);
            setAllCustomers(userCustomers);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao buscar clientes." });
        }
    };

    useEffect(() => {
        if (!effectiveOwnerId) return;

        const fetchAndInitializeData = async () => {
            setLoading(true);
            try {
                const userStages = await getStagesByUser(effectiveOwnerId);
                await fetchCustomers();

                if (userStages.length === 0 && user?.uid === effectiveOwnerId) {
                    const defaultStageNames = ['Lead', 'Contact', 'Active', 'VIP'];
                    const createdStages: Stage[] = [];
                    for (let i = 0; i < defaultStageNames.length; i++) {
                        const newStage = await addStage({ 
                            name: t(`crmStages.${defaultStageNames[i].toLowerCase()}`), 
                            ownerId: effectiveOwnerId, 
                            order: i 
                        });
                        createdStages.push(newStage);
                    }
                    setStages(createdStages);
                    setActiveStageId(createdStages[0]?.id || null);
                } else {
                    const sortedStages = userStages.sort((a, b) => a.order - b.order);
                    setStages(sortedStages);
                    if (!activeStageId || !sortedStages.some(s => s.id === activeStageId)) {
                        setActiveStageId(sortedStages[0]?.id || null);
                    }
                }
                
            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar os dados do CRM." });
            } finally {
                setLoading(false);
            }
        };
        
        fetchAndInitializeData();
    }, [effectiveOwnerId, toast, t]);

    const activeCustomer = activeId ? allCustomers.find(c => c.id === activeId) : null;
    const activeItemType = activeId ? (stages.some(s => s.id === activeId) ? 'Stage' : 'Customer') : null;

    const handleOpenCreateModal = (customer: Customer | null) => {
        setEditingCustomer(customer);
        setCreateModalOpen(true);
    };
    
    const handleCustomerSave = (savedCustomer: Customer) => {
        if (editingCustomer) {
            setAllCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
        } else {
            setAllCustomers(prev => [...prev, savedCustomer]);
        }
    };
    
    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        try {
            await deleteCustomerService(customerToDelete.id);
            setAllCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            toast({ title: "Cliente excluído com sucesso!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir cliente" });
        } finally {
            setCustomerToDelete(null);
        }
    };


    const handleOpenStageModal = (stage: Stage | null = null) => {
        setStageToEdit(stage);
        setIsStageModalOpen(true);
    }

    const handleStageSave = async (data: { name: string }) => {
        if (!effectiveOwnerId) return;

        try {
            if (stageToEdit) {
                const updatedStage = await updateStage(stageToEdit.id, { name: data.name });
                setStages(prev => prev.map(s => s.id === stageToEdit.id ? updatedStage : s));
                toast({ title: "Estágio atualizado com sucesso!" });
            } else {
                const newStage = await addStage({ name: data.name, ownerId: effectiveOwnerId, order: stages.length });
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
            const remainingStages = stages.filter(s => s.id !== stageToDelete.id);
            setStages(remainingStages);

            if (activeStageId === stageToDelete.id) {
                setActiveStageId(remainingStages.length > 0 ? remainingStages[0].id : null);
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
        
        // --- Stage Reordering ---
        if (isActiveAStage && isOverAStage) {
            setStages((currentStages) => {
                const oldIndex = currentStages.findIndex(s => s.id === active.id);
                const overId = over.id.toString().replace('stage-drop-', '');
                const newIndex = currentStages.findIndex(s => s.id === overId);
    
                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    return arrayMove(currentStages, oldIndex, newIndex);
                }
                return currentStages;
            });
            return;
        }

        // --- Customer Reordering ---
        const isActiveACustomer = allCustomers.some(c => c.id === active.id);
        const isOverACustomer = allCustomers.some(c => c.id === over.id);

        if (isActiveACustomer && isOverACustomer) {
            setAllCustomers((currentCustomers) => {
                const activeCustomer = currentCustomers.find(c => c.id === active.id);
                const overCustomer = currentCustomers.find(c => c.id === over.id);

                if (!activeCustomer || !overCustomer) return currentCustomers;

                const isSameStageContext = activeStageId ? activeCustomer.status === overCustomer.status : true;

                if (isSameStageContext) {
                    const oldIndex = currentCustomers.findIndex(c => c.id === active.id);
                    const newIndex = currentCustomers.findIndex(c => c.id === over.id);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        return arrayMove(currentCustomers, oldIndex, newIndex);
                    }
                }
                return currentCustomers;
            });
        }
    };
    
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
    
        if (!over || active.id === over.id) return;
    
        // --- Stage Reordering Persistence ---
        if (activeItemType === 'Stage' && stages.some(s => s.id === over.id)) {
            const oldIndex = stages.findIndex(s => s.id === active.id);
            const newIndex = stages.findIndex(s => s.id === over.id);

            if (oldIndex !== newIndex) {
                const newOrder = arrayMove(stages, oldIndex, newIndex);
                setStages(newOrder); // Update UI instantly

                const finalStagesToSave = newOrder.map((stage, index) => ({ id: stage.id, order: index }));

                try {
                    await batchUpdateStageOrder(finalStagesToSave);
                } catch (error) {
                    console.error("Error persisting stage order:", error);
                    // Revert to original order on error
                    setStages(stages); 
                    toast({ variant: "destructive", title: "Erro ao reordenar estágios." });
                }
            }
            return; 
        }
    
        // --- Customer Operations ---
        if (activeItemType === 'Customer') {
            const customerId = active.id as string;
            const originalCustomer = allCustomers.find(c => c.id === customerId);
            if (!originalCustomer) return;
    
            // Case 1: Customer is dropped onto a Stage (Changing status)
            const overIsStage = over.data.current?.type === 'Stage';
            if (overIsStage) {
                const newStageId = over.id.toString().replace('stage-drop-', '');
                if (originalCustomer.status !== newStageId) {
                    setAllCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStageId } : c));
                    try {
                        await updateCustomerStatus(customerId, newStageId);
                    } catch (error) {
                        console.error("Error updating customer status:", error);
                        setAllCustomers(prev => prev.map(c => c.id === customerId ? originalCustomer : c));
                    }
                }
                return;
            }
            
            // Case 2: Customer is dropped onto another Customer (Reordering)
            if (over.data.current?.type === 'Customer' && active.id !== over.id) {
                const fieldToUpdate = activeStageId ? 'stageOrder' : 'globalOrder';

                const listToReorder = allCustomers.filter(c => {
                    return activeStageId ? c.status === activeStageId : true;
                }).sort((a,b) => (a[fieldToUpdate] || 0) - (b[fieldToUpdate] || 0));


                const oldIndex = listToReorder.findIndex(c => c.id === active.id);
                const newIndex = listToReorder.findIndex(c => c.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderedSubset = arrayMove(listToReorder, oldIndex, newIndex);
                    
                    const updatedOrders = reorderedSubset.map((c, index) => ({
                        id: c.id,
                        [fieldToUpdate]: index,
                    }));
    
                    // Update local state immediately for responsiveness
                    setAllCustomers(prev => {
                        const otherCustomers = prev.filter(c => 
                            activeStageId ? c.status !== activeStageId : false
                        );
                        const updatedAndSortedSubset = reorderedSubset.map((c, index) => ({
                            ...c,
                            [fieldToUpdate]: index,
                        }));

                        const finalCustomers = activeStageId ? [...otherCustomers, ...updatedAndSortedSubset] : updatedAndSortedSubset;
                        return finalCustomers;
                    });
    
                    // Update database in the background
                    try {
                        await batchUpdateCustomerOrder(updatedOrders, fieldToUpdate);
                    } catch (error) {
                         console.error("Error persisting customer order:", error);
                         // Optionally revert local state on error
                         setAllCustomers(prev => [...prev]); // A simple way to trigger a re-render with original state
                    }
                }
            }
        }
    };

    const filteredCustomers = allCustomers.filter(customer => {
        // Stage filter
        const stageMatch = !activeStageId || customer.status === activeStageId;
        if (!stageMatch) return false;

        // Search filter
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        
        const targetField = customer[searchField as keyof Customer];

        if (searchField === 'tags' && Array.isArray(targetField)) {
            return targetField.some(tag => tag.toLowerCase().includes(lowercasedTerm));
        }

        if (typeof targetField === 'string') {
            return targetField.toLowerCase().includes(lowercasedTerm);
        }
        
        return false;
    });

    // Sort the final list based on the active view
    const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
        const fieldToSort = activeStageId ? 'stageOrder' : 'globalOrder';
        return (a[fieldToSort] || 0) - (b[fieldToSort] || 0);
    });

    const paginatedCustomers = sortedAndFilteredCustomers.slice(0, visibleCount);

    if (loading) {
        return <LoadingSpinner />;
    }

    const getStageName = (stageId: string | null) => {
        if (!stageId) return '';
        return stages.find(s => s.id === stageId)?.name || '';
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="flex flex-col h-full">
                <PageHeader
                    title="CRM de Clientes"
                    description="Gerencie o funil de relacionamento com seus clientes."
                    action={
                        <Button onClick={() => handleOpenCreateModal(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Cliente
                        </Button>
                    }
                />
                 <CrmFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchField={searchField}
                    setSearchField={setSearchField}
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
                        <SortableContext items={paginatedCustomers.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            <CustomerList
                                customers={paginatedCustomers}
                                getStageName={getStageName}
                                onViewDetails={setDetailsModalCustomer}
                                onEdit={handleOpenCreateModal}
                                onDelete={setCustomerToDelete}
                            />
                        </SortableContext>
                         {sortedAndFilteredCustomers.length > visibleCount && (
                            <div className="text-center mt-4">
                                <Button onClick={() => setVisibleCount(prev => prev + CUSTOMERS_PER_PAGE)} variant="outline">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregar Mais
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <CreateCustomerModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCustomerSaved={handleCustomerSave}
                customer={editingCustomer}
                allTags={allAvailableTags}
            />
            <CustomerDetailsModal
                customer={detailsModalCustomer}
                isOpen={!!detailsModalCustomer}
                onClose={() => setDetailsModalCustomer(null)}
                stages={stages.map(s => ({ id: s.id, name: s.name }))}
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
            <AlertDialog open={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <DragOverlay>
                {activeId && activeItemType === 'Customer' && activeCustomer ? <CustomerCard customer={activeCustomer} stageName={getStageName(activeCustomer.status)} isOverlay /> : null}
                {activeId && activeItemType === 'Stage' && stages.find(s => s.id === activeId) ? (
                     <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-lg">{stages.find(s => s.id === activeId)?.name}</div>
                 ) : null}
             </DragOverlay>
        </DndContext>
    );
}

export default function CrmPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <CrmPageComponent />
        </Suspense>
    );
}

    

    

    