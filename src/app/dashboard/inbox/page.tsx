
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import type { Conversation, Consumer, Stage, Customer } from "@/lib/types";
import { getConversations, markConversationAsRead } from "@/services/conversation-service";
import { getConsumersByCompany } from "@/services/consumer-service";
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
    const [consumers, setConsumers] = useState<Record<string, Consumer>>({});
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    useEffect(() => {
        if (activeCompany && effectiveOwnerId) {
            setLoading(true);
            const unsubscribeConvos = getConversations(activeCompany.id, (convos) => {
                setConversations(convos);
                
                // Auto-select the first conversation only if no conversation is currently selected.
                // This prevents the selection from changing on new messages.
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

            const unsubscribeConsumers = getConsumersByCompany(activeCompany.id, (consumerList) => {
                 const consumerMap = consumerList.reduce((acc, consumer) => {
                    acc[consumer.id] = consumer;
                    return acc;
                }, {} as Record<string, Consumer>);
                setConsumers(consumerMap);
            });

            getStagesByUser(effectiveOwnerId).then(setStages);

            return () => {
                unsubscribeConvos();
                unsubscribeConsumers();
            };
        } else {
            setConversations([]);
            setConsumers({});
            setStages([]);
            setSelectedConversationId(null);
            setLoading(false);
        }
    }, [activeCompany, effectiveOwnerId]);
    
    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversationId(conversation.id);
        if (conversation.unreadMessagesCount > 0 && activeCompany) {
            markConversationAsRead(activeCompany.id, conversation.id);
        }
    };
    
    const handleEditConsumer = (consumer: Consumer | null) => {
        if (!consumer || !activeCompany) return;
        // The modal expects a Customer object. We need to map the Consumer to it.
        const customerData: Customer = {
            id: consumer.id,
            ownerId: activeCompany.ownerId,
            name: consumer.name,
            email: consumer.email,
            phone: consumer.phone,
            status: consumer.type, // Map consumer type to a default status if needed
            document: '',
            tags: [],
            createdAt: consumer.createdAt as any,
            updatedAt: new Date().toISOString(),
        };
        setCustomerToEdit(customerData);
        setCustomerModalOpen(true);
    };

    const handleCustomerSave = (savedCustomer: Customer) => {
        // Update the consumer map in state to reflect the changes
        const updatedConsumer: Consumer = {
            ...consumers[savedCustomer.id],
            id: savedCustomer.id,
            name: savedCustomer.name,
            email: savedCustomer.email,
            phone: savedCustomer.phone,
            type: savedCustomer.status as any, // Update type from customer status
        };
        setConsumers(prev => ({
            ...prev,
            [savedCustomer.id]: updatedConsumer
        }));
        
        setCustomerModalOpen(false);
    };

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [conversations, selectedConversationId]);

    const selectedConsumer = useMemo(() => {
        return selectedConversation ? consumers[selectedConversation.consumerId] : null;
    }, [selectedConversation, consumers]);

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
                        consumers={consumers}
                        onSelectConversation={handleSelectConversation}
                        selectedConversationId={selectedConversationId}
                        stages={stages}
                        onEditConsumer={handleEditConsumer}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={65} minSize={30}>
                    <ChatArea 
                        conversation={selectedConversation} 
                        consumer={selectedConsumer}
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
