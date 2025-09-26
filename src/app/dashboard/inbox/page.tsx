
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import type { Conversation, Consumer } from "@/lib/types";
import { getConversations } from "@/services/conversation-service";
import { getConsumersByCompany } from "@/services/consumer-service";

import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatArea } from "@/components/inbox/chat-area";
import { ConsumerProfile } from "@/components/inbox/consumer-profile";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { EmptyState } from "@/components/common/empty-state";
import { MessageSquare } from "lucide-react";

export default function InboxPage() {
    const { activeCompany } = useCompany();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [consumers, setConsumers] = useState<Record<string, Consumer>>({});
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    useEffect(() => {
        if (activeCompany) {
            setLoading(true);
            Promise.all([
                getConversations(activeCompany.id),
                getConsumersByCompany(activeCompany.id)
            ]).then(([convos, consumerList]) => {
                setConversations(convos);
                
                const consumerMap = consumerList.reduce((acc, consumer) => {
                    acc[consumer.id] = consumer;
                    return acc;
                }, {} as Record<string, Consumer>);
                setConsumers(consumerMap);

                setLoading(false);
            }).catch(error => {
                console.error("Failed to fetch inbox data:", error);
                setLoading(false);
            });
        }
    }, [activeCompany]);

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
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                <ConversationList
                    conversations={conversations}
                    consumers={consumers}
                    onSelectConversation={setSelectedConversation}
                    selectedConversationId={selectedConversation?.id}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
                 <ChatArea 
                    conversation={selectedConversation} 
                    consumer={selectedConsumer}
                 />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                <ConsumerProfile consumer={selectedConsumer} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
