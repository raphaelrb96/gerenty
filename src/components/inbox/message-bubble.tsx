
"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { format } from "date-fns";

type MessageBubbleProps = {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';
    
    // Safely handle different timestamp formats
    const getTimestamp = () => {
        if (!message.timestamp) return new Date();
        if (typeof message.timestamp === 'string') return new Date(message.timestamp);
        // Assumes it's a Firebase Timestamp-like object if not a string
        if ('toDate' in (message.timestamp as any)) {
            return (message.timestamp as any).toDate();
        }
        return new Date(message.timestamp as any);
    };

    const timestamp = getTimestamp();
    const timeFormatted = format(timestamp, "HH:mm");

    return (
        <div className={cn("flex items-end gap-2", isOutbound ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[75%] p-3 rounded-lg",
                isOutbound ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p className="text-sm whitespace-pre-wrap">{message.content?.text || '[Mensagem sem texto]'}</p>
                 <p className={cn(
                     "text-xs mt-1",
                     isOutbound ? "text-primary-foreground/70" : "text-muted-foreground/70"
                 )}>
                    {timeFormatted}
                </p>
            </div>
        </div>
    );
}
