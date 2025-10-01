
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import type { Conversation, Consumer, Customer, Stage } from "@/lib/types";
import { getConversations } from "@/services/conversation-service";
import { getConsumersByCompany } from "@/services/consumer-service";
import { getStagesByUser } from "@/services/stage-service";

import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatArea } from "@/components/inbox/chat-area";
import { ConsumerProfile } from "@/components/inbox/consumer-profile";
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
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    useEffect(() => {
        if (activeCompany && effectiveOwnerId) {
            setLoading(true);
            Promise.all([
                getConversations(activeCompany.id),
                getConsumersByCompany(activeCompany.id),
                getStagesByUser(effectiveOwnerId)
            ]).then(([convos, consumerList, userStages]) => {
                setConversations(convos);
                
                const consumerMap = consumerList.reduce((acc, consumer) => {
                    acc[consumer.id] = consumer;
                    return acc;
                }, {} as Record<string, Consumer>);
                setConsumers(consumerMap);

                setStages(userStages);

                if (convos.length > 0) {
                    setSelectedConversation(convos[0]);
                }

                setLoading(false);
            }).catch(error => {
                console.error("Failed to fetch inbox data:", error);
                setLoading(false);
            });
        } else {
            setConversations([]);
            setConsumers({});
            setStages([]);
            setSelectedConversation(null);
            setLoading(false);
        }
    }, [activeCompany, effectiveOwnerId]);
    
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
    
    if (conversations.length === 0) {
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

    const selectedConsumer = selectedConversation ? consumers[selectedConversation.consumerId] : null;

    return (
        <>
            <ResizablePanelGroup direction="horizontal" className="h-full max-h-[calc(100vh-8rem)] w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                    <ConversationList
                        conversations={conversations}
                        consumers={consumers}
                        onSelectConversation={setSelectedConversation}
                        selectedConversationId={selectedConversation?.id}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                 <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                    <ConsumerProfile 
                        consumer={selectedConsumer} 
                        stages={stages} 
                        onEdit={() => handleEditConsumer(selectedConsumer)} 
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
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
