
"use client";

import { useState, useEffect, useRef } from "react";
import type { Conversation, Consumer, Message } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "../common/loading-spinner";
import { MessageBubble } from "./message-bubble";
import { useCompany } from "@/context/company-context";

type ChatAreaProps = {
    conversation: Conversation | null;
    consumer: Consumer | null;
}

export function ChatArea({ conversation, consumer }: ChatAreaProps) {
    const { activeCompany } = useCompany();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!conversation || !activeCompany) {
            setMessages([]);
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
                    // Convert Firestore Timestamp to JS Date object
                    timestamp: (data.timestamp as Timestamp)?.toDate() || new Date()
                } as Message);
            });
            setMessages(newMessages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversation, activeCompany]);
    
    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);


    if (!conversation || !consumer) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-background">
                <MessageSquare className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                <p className="text-sm">As mensagens e detalhes do contato aparecerão aqui.</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-background">
            <header className="p-4 border-b flex-shrink-0">
                <h2 className="font-semibold">{consumer.name}</h2>
                <p className="text-xs text-muted-foreground">{consumer.phone}</p>
            </header>

            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full" ref={scrollAreaRef as any}>
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
            
            <footer className="p-4 border-t bg-background/95 flex-shrink-0">
                <div className="relative">
                    <Input placeholder="Digite sua mensagem..." className="pr-20" disabled />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                         <Button variant="ghost" size="icon" disabled><Paperclip className="h-5 w-5" /></Button>
                         <Button size="icon" disabled><Send className="h-5 w-5" /></Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
