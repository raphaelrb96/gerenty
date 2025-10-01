
"use client";

import type { Conversation, Consumer, Stage } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { ConsumerProfile } from "./consumer-profile";
import { motion, AnimatePresence } from "framer-motion";

type ConversationListItemProps = {
    conversation: Conversation;
    consumer?: Consumer;
    stages: Stage[];
    isSelected: boolean;
    onSelect: () => void;
    onEditConsumer: (consumer: Consumer | null) => void;
}

export function ConversationListItem({ conversation, consumer, stages, isSelected, onSelect, onEditConsumer }: ConversationListItemProps) {
    const getInitials = (name: string) => {
        if (!name || name.trim().toLowerCase() === 'unknown') return '?';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    const displayName = consumer?.name && consumer.name.toLowerCase() !== 'unknown' 
        ? consumer.name 
        : consumer?.phone || "Desconhecido";

    const lastMessageDate = conversation.lastMessageTimestamp ? new Date(conversation.lastMessageTimestamp as any) : new Date();

    const getTypeConfig = (type: Consumer['type'] | undefined) => {
        switch (type) {
            case 'lead':
                return { color: 'text-blue-500' };
            case 'buyer':
                return { color: 'text-green-500' };
            case 'contact':
                return { color: 'text-purple-500' };
            default:
                return { color: 'text-gray-500' };
        }
    };
    
    const typeConfig = getTypeConfig(consumer?.type);

    return (
       <motion.div
            layout
            initial={{ borderRadius: 8 }}
            className={cn(
                "relative overflow-hidden border",
                isSelected ? "bg-background shadow-sm border-primary/50" : "bg-muted/50 border-transparent"
            )}
        >
            <button 
                className="w-full text-left p-3 "
                onClick={onSelect}
            >
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-border">
                        <AvatarFallback>
                            {consumer ? <User className={cn("h-5 w-5", typeConfig.color)} /> : '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-sm truncate">{displayName}</p>
                            {conversation.unreadMessagesCount > 0 && 
                                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                    {conversation.unreadMessagesCount}
                                </span>
                            }
                        </div>
                        <p className="text-xs text-muted-foreground truncate pr-2 mt-1">{conversation.lastMessage}</p>
                        <div className="flex justify-end mt-1">
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(lastMessageDate, { addSuffix: true, locale: ptBR })}
                            </p>
                        </div>
                    </div>
                </div>
            </button>
            <AnimatePresence>
                {isSelected && (
                     <motion.section
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <ConsumerProfile 
                            consumer={consumer || null} 
                            stages={stages} 
                            onEdit={() => onEditConsumer(consumer || null)} 
                        />
                    </motion.section>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
