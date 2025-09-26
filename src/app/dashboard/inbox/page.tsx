
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Paperclip, Send } from "lucide-react";

export default function InboxPage() {

    const conversations = [
        { id: 1, name: "João Silva", lastMessage: "Olá! Gostaria de saber mais sobre o produto X.", unread: 2, timestamp: "10:45" },
        { id: 2, name: "Maria Clara", lastMessage: "Recebi o pedido, obrigada!", unread: 0, timestamp: "Ontem" },
        { id: 3, name: "Lead Site", lastMessage: "Qual o valor do frete para 12345-678?", unread: 0, timestamp: "2d atrás" },
    ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="p-6 pb-2">
        <PageHeader
            title="Inbox"
            description="Centralize a comunicação com seus clientes e leads via WhatsApp."
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 overflow-hidden">
        {/* Painel de Conversas */}
        <Card className="lg:col-span-1 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
                <div className="relative mb-4">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar conversas..." className="pl-8" />
                </div>
                <div className="flex-1 overflow-y-auto -mx-4 px-4">
                    <div className="space-y-2">
                        {conversations.map(convo => (
                             <div key={convo.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{convo.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm truncate">{convo.name}</p>
                                        <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                                        {convo.unread > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{convo.unread}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Interface de Chat e Perfil */}
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6 h-full overflow-hidden">
            
            {/* Conversa Ativa */}
            <Card className="xl:col-span-2 flex flex-col h-full">
                 <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Selecione uma conversa para começar</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t pt-4">
                        <Button variant="ghost" size="icon" disabled><Paperclip className="h-5 w-5" /></Button>
                        <Input placeholder="Digite sua mensagem..." disabled/>
                        <Button disabled><Send className="h-5 w-5" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* Perfil do Contato */}
            <Card className="hidden xl:flex xl:flex-col">
                 <CardContent className="p-4 flex-1">
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <p>Os detalhes do contato aparecerão aqui.</p>
                    </div>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
