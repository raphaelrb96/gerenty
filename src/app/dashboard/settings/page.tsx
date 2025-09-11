
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Webhook, Puzzle, Copy, PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações Avançadas"
        description="Gerencie chaves de API, webhooks e integrações."
      />

      <div className="grid grid-cols-1 gap-8">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Chaves de API
            </CardTitle>
            <CardDescription>
              Gere e gerencie chaves de API para integrar com serviços externos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="flex flex-col">
                <span className="font-semibold">Chave Padrão</span>
                <span className="text-sm text-muted-foreground font-mono">
                  pk_live_******************xyz
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Copiar">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Revogar" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
             <p className="text-xs text-muted-foreground">
                As chaves de API serão implementadas em uma fase futura.
            </p>
          </CardContent>
          <CardFooter className="border-t pt-6">
             <Button variant="outline" disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              Gerar Nova Chave
            </Button>
          </CardFooter>
        </Card>

        {/* Webhooks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configure URLs para receber notificações de eventos do sistema em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="webhook-url" className="text-sm font-medium">URL do Endpoint</label>
                <Input id="webhook-url" placeholder="https://seu-servico.com/webhook" disabled />
              </div>
              <Button disabled>Adicionar Webhook</Button>
            </div>
             <p className="text-xs text-muted-foreground">
                A configuração de Webhooks será implementada em uma fase futura.
            </p>
          </CardContent>
        </Card>
        
        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5" />
              Integrações
            </CardTitle>
            <CardDescription>
              Conecte o Gerenty a outras plataformas para automatizar seu fluxo de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-center text-muted-foreground py-8">
                O módulo de integrações será implementado em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
