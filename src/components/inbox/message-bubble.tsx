
"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

type MessageBubbleProps = {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';
    
    const getTimestamp = () => {
        if (!message.timestamp) return new Date();

        if (message.timestamp instanceof Timestamp) {
            return message.timestamp.toDate();
        }
        if (typeof message.timestamp === 'string') {
            return new Date(message.timestamp);
        }
        if (message.timestamp instanceof Date) {
            return message.timestamp;
        }
        // Fallback for other potential timestamp-like objects from Firebase
        if ('seconds' in (message.timestamp as any) && 'nanoseconds' in (message.timestamp as any)) {
            const ts = message.timestamp as any;
            return new Timestamp(ts.seconds, ts.nanoseconds).toDate();
        }
        return new Date(message.timestamp as any);
    };

    const timestamp = getTimestamp();
    const timeFormatted = format(timestamp, "HH:mm");

    return (
        <div className={cn("flex items-end gap-2", isOutbound ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[75%] p-3 rounded-lg shadow-sm",
                isOutbound ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p className="text-sm whitespace-pre-wrap">{message.content?.text?.body || '[Mensagem sem texto]'}</p>
                 <p className={cn(
                     "text-xs mt-1 text-right",
                     isOutbound ? "text-primary-foreground/70" : "text-muted-foreground/70"
                 )}>
                    {timeFormatted}
                </p>
            </div>
        </div>
    );
}
