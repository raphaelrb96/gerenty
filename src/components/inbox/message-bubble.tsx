
"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { MapPin } from "lucide-react";

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

    const renderMessageContent = () => {
        const { type, content } = message;

        // Ensure content exists before trying to access its properties
        if (!content) {
            return <p className="text-sm italic text-muted-foreground">[{type}] Conteúdo indisponível</p>;
        }

        if (type === 'text' && content.text?.body) {
            return <p className="text-sm whitespace-pre-wrap">{content.text.body}</p>;
        }
        
        if (type === 'interactive') {
            if (content.interactive?.button_reply?.title) {
                return <p className="text-sm italic text-muted-foreground">Resposta: "{content.interactive.button_reply.title}"</p>;
            }
            if (content.interactive?.list_reply?.title) {
                return <p className="text-sm italic text-muted-foreground">Resposta da Lista: "{content.interactive.list_reply.title}"</p>;
            }
        }
        
        if (type === 'image' && content.image?.url) {
            return <Image src={content.image.url} alt={content.image.caption || "Imagem enviada"} width={300} height={200} className="rounded-md object-cover" />;
        }
        if (type === 'audio' && content.audio?.url) {
            return <audio controls src={content.audio.url} className="w-full max-w-xs" />;
        }
        if (type === 'video' && content.video?.url) {
             return <video controls src={content.video.url} className="rounded-md w-full max-w-xs" />;
        }
        if (type === 'document' && content.document?.url) {
             return <a href={content.document.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">Baixar Documento: {content.document.filename || 'Arquivo'}</a>;
        }
        if (type === 'location' && content.location) {
            const { latitude, longitude, name, address } = content.location;
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            return (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 hover:underline">
                    <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4" />
                        <span>{name || 'Localização'}</span>
                    </div>
                    {address && <p className="text-xs">{address}</p>}
                </a>
            )
        }
        
        // Fallbacks for media if URL is not yet available but ID is
        if (type === 'image' && content.image?.id) {
            return <div className="p-2 bg-muted-foreground/20 rounded-md text-center text-xs">Imagem recebida (ID: ...{content.image.id.slice(-10)})</div>;
        }
        if (type === 'audio' && content.audio?.id) {
             return <div className="p-2 bg-muted-foreground/20 rounded-md text-center text-xs">Áudio recebido (ID: ...{content.audio.id.slice(-10)})</div>;
        }
        if (type === 'video' && content.video?.id) {
             return <div className="p-2 bg-muted-foreground/20 rounded-md text-center text-xs">Vídeo recebido (ID: ...{content.video.id.slice(-10)})</div>;
        }
        if (type === 'document' && content.document?.id) {
             return <div className="p-2 bg-muted-foreground/20 rounded-md text-center text-xs">Documento: {content.document.filename || 'Arquivo'}</div>;
        }

        // Fallback for other types or missing content
        return <p className="text-sm italic text-muted-foreground">[{type}] Mensagem não suportada</p>;
    };

    return (
        <div className={cn("flex items-end gap-2", isOutbound ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[75%] p-3 rounded-lg shadow-sm",
                isOutbound ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                {renderMessageContent()}
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
