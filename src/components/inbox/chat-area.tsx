
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Conversation, Consumer, Message, MessageTemplate } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { LoadingSpinner } from "../common/loading-spinner";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { getTemplatesByCompany } from "@/services/template-service";
import { sendMessage } from "@/services/integration-service";
import { MessageSquare } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";

type ChatAreaProps = {
    conversation: Conversation | null;
    consumer: Consumer | null;
}

// 24 hours in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function ChatArea({ conversation, consumer }: ChatAreaProps) {
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isOutsideWindow, setIsOutsideWindow] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        if (conversation?.lastMessageTimestamp) {
            const lastMessageTime = (conversation.lastMessageTimestamp as any).toDate ? 
                (conversation.lastMessageTimestamp as any).toDate().getTime() : 
                new Date(conversation.lastMessageTimestamp as any).getTime();

            const timeDiff = Date.now() - lastMessageTime;
            setIsOutsideWindow(timeDiff > TWENTY_FOUR_HOURS_MS);
        } else {
            setIsOutsideWindow(false);
        }
    }, [conversation]);


    useEffect(() => {
        if (!conversation?.id || !activeCompany?.id) {
            setMessages([]);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const messagesCol = collection(db, `companies/${activeCompany.id}/conversations/${conversation.id}/messages`);
        const q = query(messagesCol, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMessages: Message[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                newMessages.push({
                    id: doc.id,
                    ...data,
                    timestamp: (data.timestamp as Timestamp)?.toDate() || new Date()
                } as Message);
            });
            setMessages(newMessages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        getTemplatesByCompany(activeCompany.id)
            .then(setTemplates)
            .catch(() => toast({ variant: "destructive", title: "Erro ao carregar templates" }));

        return () => unsubscribe();
    }, [conversation?.id, activeCompany?.id, toast]);
    
    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [messages, loading, scrollToBottom]);

    const handleSendMessage = useCallback(async (messageContent: string, type: 'text' | 'template' = 'text') => {
        if (!consumer || !activeCompany) return;

        setIsSending(true);
        try {
            await sendMessage( consumer.phone, activeCompany.id, messageContent, type);
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Enviar Mensagem",
                description: error.message || "Não foi possível enviar a mensagem."
            });
        } finally {
            setIsSending(false);
        }
    }, [consumer, activeCompany, toast]);


    if (!conversation || !consumer) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-background">
                <MessageSquare className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                <p className="text-sm">As mensagens e detalhes do contato aparecerão aqui.</p>
            </div>
        );
    }
    
    const displayName = consumer.name && consumer.name.toLowerCase() !== 'unknown' 
        ? consumer.name 
        : consumer.phone;

    return (
        <div className="flex flex-col h-full bg-background border rounded-lg">
            <header className="p-4 border-b flex-shrink-0">
                <h2 className="font-semibold">{displayName}</h2>
                <p className="text-xs text-muted-foreground">{consumer.phone}</p>
            </header>

            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <LoadingSpinner />
                        ) : messages.length === 0 ? (
                             <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Nenhuma mensagem nesta conversa ainda.</p>
                            </div>
                        ) : (
                            messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
                        )}
                    </div>
                </ScrollArea>
            </div>
            
            <footer className="p-4 border-t bg-background/95 flex-shrink-0 space-y-2">
                 {isOutsideWindow && (
                    <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                        <AlertCircle className="h-4 w-4 !text-yellow-600" />
                        <AlertTitle>Janela de 24h Expirada</AlertTitle>
                        <AlertDescription>
                            Apenas mensagens de template podem iniciar conversas. O sistema tentará enviar como template se uma mensagem de texto normal falhar.
                        </AlertDescription>
                    </Alert>
                )}
                <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
            </footer>
        </div>
    );
}
