
"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Conversation, Consumer } from "@/lib/types";
import { ConversationListItem } from "./conversation-list-item";
import { useState } from "react";

type ConversationListProps = {
    conversations: Conversation[];
    consumers: Record<string, Consumer>;
    onSelectConversation: (conversation: Conversation) => void;
    selectedConversationId?: string | null;
}

export function ConversationList({ conversations, consumers, onSelectConversation, selectedConversationId }: ConversationListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter(convo => {
        const consumer = consumers[convo.consumerId];
        if (!consumer) return false;
        return consumer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               consumer.phone.includes(searchTerm);
    });

    return (
        <div className="flex flex-col h-full bg-muted/50 border-r">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar conversas..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredConversations.map(convo => (
                        <ConversationListItem
                            key={convo.id}
                            conversation={convo}
                            consumer={consumers[convo.consumerId]}
                            isSelected={selectedConversationId === convo.id}
                            onSelect={() => onSelectConversation(convo)}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
