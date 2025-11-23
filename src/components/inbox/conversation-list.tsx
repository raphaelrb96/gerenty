
"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Conversation, Customer, Stage } from "@/lib/types";
import { ConversationListItem } from "./conversation-list-item";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

type ConversationListProps = {
    conversations: Conversation[];
    customers: Record<string, Customer>;
    stages: Stage[];
    onSelectConversation: (conversation: Conversation) => void;
    selectedConversationId?: string | null;
    onEditCustomer: (customer: Customer | null) => void;
}

export function ConversationList({ conversations, customers, stages, onSelectConversation, selectedConversationId, onEditCustomer }: ConversationListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredConversations = conversations.filter(convo => {
        const customer = customers[convo.consumerId];
        if (!customer) return false;
        const name = customer.name?.toLowerCase() || '';
        const phone = customer.phone || '';
        const term = searchTerm.toLowerCase();

        return name.includes(term) || phone.includes(term);
    });

    return (
        <div className="flex flex-col h-full bg-muted/50 border-r">
            <div className="p-4 border-b flex-shrink-0">
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
            <ScrollArea className="flex-1 h-full">
                <div className="p-2 space-y-1">
                    <AnimatePresence initial={false}>
                        {filteredConversations.map(convo => (
                            <ConversationListItem
                                key={convo.id}
                                conversation={convo}
                                customer={customers[convo.consumerId]}
                                stages={stages}
                                isSelected={selectedConversationId === convo.id}
                                onSelect={() => onSelectConversation(convo)}
                                onEditCustomer={onEditCustomer}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        </div>
    );
}
