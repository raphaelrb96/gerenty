
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import type { Conversation, Customer, Stage } from "@/lib/types";
import { getConversations, markConversationAsRead } from "@/services/conversation-service";
import { getCustomersByUser } from "@/services/customer-service"; 
import { getStagesByUser } from "@/services/stage-service";

import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatArea } from "@/components/inbox/chat-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EmptyState } from "@/components/common/empty-state";
import { MessageSquare } from "lucide-react";
import { CreateCustomerModal } from "@/components/crm/create-customer-modal";

export default function InboxPage() {
    const { activeCompany } = useCompany();
    const { effectiveOwnerId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [customers, setCustomers] = useState<Record<string, Customer>>({});
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    useEffect(() => {
        if (activeCompany && effectiveOwnerId) {
            setLoading(true);
            const unsubscribeConvos = getConversations(activeCompany.id, (convos) => {
                setConversations(convos);
                
                setSelectedConversationId(prevId => {
                    if (prevId && convos.some(c => c.id === prevId)) {
                        return prevId;
                    }
                    if (!prevId && convos.length > 0) {
                        const firstConvo = convos[0];
                        if (firstConvo.unreadMessagesCount > 0) {
                            markConversationAsRead(activeCompany.id, firstConvo.id);
                        }
                        return firstConvo.id;
                    }
                    return prevId;
                });
                setLoading(false);
            });

            // Fetch all customers for the owner once
            getCustomersByUser(effectiveOwnerId).then(customerList => {
                 const customerMap = customerList.reduce((acc, customer) => {
                    acc[customer.id] = customer;
                    return acc;
                }, {} as Record<string, Customer>);
                setCustomers(customerMap);
            });

            getStagesByUser(effectiveOwnerId).then(setStages);

            return () => {
                unsubscribeConvos();
            };
        } else {
            setConversations([]);
            setCustomers({});
            setStages([]);
            setSelectedConversationId(null);
            setLoading(false);
        }
    }, [activeCompany, effectiveOwnerId]);
    
    const handleSelectConversation = (conversation: Conversation) => {
        const newId = conversation.id;
        
        if (selectedConversationId === newId) {
            setSelectedConversationId(null);
        } else {
            setSelectedConversationId(newId);
            if (conversation.unreadMessagesCount > 0 && activeCompany) {
                markConversationAsRead(activeCompany.id, newId);
            }
        }
    };
    
    const handleEditConsumer = (customer: Customer | null) => {
        if (!customer) return;
        setCustomerToEdit(customer);
        setCustomerModalOpen(true);
    };

    const handleCustomerSave = (savedCustomer: Customer) => {
        // Update the customers map in state to reflect the changes
        setCustomers(prev => ({
            ...prev,
            [savedCustomer.id]: savedCustomer
        }));
        
        setCustomerModalOpen(false);
    };

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [conversations, selectedConversationId]);

    const selectedCustomer = useMemo(() => {
        return selectedConversation ? customers[selectedConversation.consumerId] : null;
    }, [selectedConversation, customers]);

    if (loading) {
        return <LoadingSpinner />;
    }
    
    if (!activeCompany) {
        return (
             <div className="flex items-center justify-center h-full">
                <EmptyState
                    icon={<MessageSquare className="h-16 w-16" />}
                    title="Nenhuma empresa selecionada"
                    description="Por favor, selecione uma empresa no painel principal para visualizar o inbox."
                />
            </div>
        );
    }
    
    if (conversations.length === 0 && !loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <EmptyState
                    icon={<MessageSquare className="h-16 w-16" />}
                    title="Nenhuma conversa encontrada"
                    description="Quando você receber novas mensagens, elas aparecerão aqui."
                />
            </div>
        )
    }

    return (
        <>
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={35} minSize={25} maxSize={40}>
                    <ConversationList
                        conversations={conversations}
                        customers={customers}
                        onSelectConversation={handleSelectConversation}
                        selectedConversationId={selectedConversationId}
                        stages={stages}
                        onEditCustomer={handleEditConsumer}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={65} minSize={30}>
                    <ChatArea 
                        conversation={selectedConversation} 
                        customer={selectedCustomer}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
            
            <CreateCustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                onCustomerSaved={handleCustomerSave}
                customer={customerToEdit}
                allTags={[]}
            />
        </>
    );
}
