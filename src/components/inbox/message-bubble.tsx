
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { MapPin, Check, CheckCheck, Play, Pause } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// New Custom Audio Player Component
const AudioPlayer = ({ src }: { src: string }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);

    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        }

        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener("loadeddata", setAudioData);
        audio.addEventListener("timeupdate", setAudioTime);
        audio.addEventListener("play", () => setIsPlaying(true));
        audio.addEventListener("pause", () => setIsPlaying(false));
        audio.addEventListener("ended", () => setIsPlaying(false));

        return () => {
            audio.removeEventListener("loadeddata", setAudioData);
            audio.removeEventListener("timeupdate", setAudioTime);
            audio.removeEventListener("play", () => setIsPlaying(true));
            audio.removeEventListener("pause", () => setIsPlaying(false));
            audio.removeEventListener("ended", () => setIsPlaying(false));
        }
    }, []);

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-3 w-full max-w-xs">
            <audio ref={audioRef} src={src} preload="metadata" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 flex items-center gap-2">
                <Progress value={progress} className="h-2 w-full" />
                <span className="text-xs font-mono w-12 text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
        </div>
    );
};


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

    const renderMessageStatus = () => {
        if (!isOutbound) return null;

        const status = message.status;
        if (status === 'read') {
            return <CheckCheck className="h-4 w-4 ml-1 text-blue-500" />;
        }
        if (status === 'delivered') {
            return <CheckCheck className="h-4 w-4 ml-1" />;
        }
        if (status === 'sent') {
            return <Check className="h-4 w-4 ml-1" />;
        }
        return null;
    }

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
                return <p className="text-sm italic text-muted-foreground">Resposta do botão: "{content.interactive.button_reply.title}"</p>;
            }
            if (content.interactive?.list_reply?.title) {
                return <p className="text-sm italic text-muted-foreground">Resposta da lista: "{content.interactive.list_reply.title}"</p>;
            }
        }
        
        if (type === 'image' && content.image?.url) {
            return <Image src={content.image.url} alt={content.image.caption || "Imagem enviada"} width={300} height={200} className="rounded-md object-cover" />;
        }
        if (type === 'audio' && content.audio?.url) {
            return <AudioPlayer src={content.audio.url} />;
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
                <div className="flex items-center justify-end mt-1">
                    <p className={cn(
                        "text-xs",
                        isOutbound ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    )}>
                        {timeFormatted}
                    </p>
                    {renderMessageStatus()}
                 </div>
            </div>
        </div>
    );
}
