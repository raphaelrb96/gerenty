
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Paperclip, Send, UserCircle, ShoppingCart, MessageSquare } from "lucide-react";

export default function InboxPage() {

    const conversations = [
        { id: 1, name: "João Silva", lastMessage: "Olá! Gostaria de saber mais sobre o produto X e se ainda está disponível em estoque.", unread: 2, timestamp: "10:45", avatar: "https://placehold.co/40x40/E5E7EB/9CA3AF?text=JS" },
        { id: 2, name: "Maria Clara", lastMessage: "Recebi o pedido, obrigada! Chegou tudo certo.", unread: 0, timestamp: "Ontem", avatar: "https://placehold.co/40x40/E5E7EB/9CA3AF?text=MC" },
        { id: 3, name: "Lead Site (11) 98765-4321", lastMessage: "Qual o valor do frete para 12345-678?", unread: 0, timestamp: "2d atrás", avatar: "https://placehold.co/40x40/E5E7EB/9CA3AF?text=LS" },
        { id: 4, name: "Ana Beatriz", lastMessage: "Vocês têm cupom de primeira compra?", unread: 1, timestamp: "3d atrás", avatar: "https://placehold.co/40x40/E5E7EB/9CA3AF?text=AB" },
        { id: 5, name: "Carlos Souza", lastMessage: "O link de pagamento expirou, pode me enviar outro?", unread: 0, timestamp: "5d atrás", avatar: "https://placehold.co/40x40/E5E7EB/9CA3AF?text=CS" },
    ];

  return (
    <div className="h-screen w-full flex flex-col">
       <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 flex-shrink-0">
         <h1 className="text-xl font-semibold">Inbox</h1>
         {/* Adicionar filtros e ações aqui se necessário */}
       </header>
       <main className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] gap-0 overflow-hidden">
        
        {/* Coluna 1: Lista de Conversas */}
        <div className="flex flex-col h-full bg-background border-r">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar conversas..." className="pl-9" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-0">
                    {conversations.map(convo => (
                         <div key={convo.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted border-b">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={convo.avatar} />
                                <AvatarFallback>{convo.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm truncate">{convo.name}</p>
                                    <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                                </div>
                                <div className="flex justify-between items-start mt-1">
                                    <p className="text-xs text-muted-foreground truncate pr-2">{convo.lastMessage}</p>
                                    {convo.unread > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{convo.unread}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Coluna 2: Chat Ativo */}
        <div className="flex flex-col h-full bg-muted/30">
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                    <p className="text-sm">Suas mensagens e detalhes do contato aparecerão aqui.</p>
                </div>
                <div className="p-4 border-t bg-background/95">
                    <div className="relative">
                        <Input placeholder="Digite sua mensagem..." className="pr-16" disabled />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                             <Button variant="ghost" size="icon" disabled><Paperclip className="h-5 w-5" /></Button>
                             <Button size="icon" disabled><Send className="h-5 w-5" /></Button>
                        </div>
                    </div>
                </div>
        </div>
      </main>
    </div>
  );
}
