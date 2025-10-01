
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2 } from "lucide-react";

type ChatInputProps = {
    onSendMessage: (message: string, type: 'text') => Promise<void>;
    isSending: boolean;
};

export function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message, 'text');
            setMessage("");
        }
    };

    return (
        <div className="relative">
            <Input
                placeholder="Digite sua mensagem..."
                className="pr-20"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
                disabled={isSending}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <Button variant="ghost" size="icon" disabled={isSending}>
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Button size="icon" onClick={handleSend} disabled={isSending || !message.trim()}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}
