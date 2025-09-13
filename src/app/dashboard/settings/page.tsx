
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Webhook, Copy, PlusCircle, Trash2, CheckCircle, MoreVertical, Loader2, Calendar as CalendarIcon, FileText, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiKey, Webhook as WebhookType } from "@/lib/types";
import { createApiKey, getApiKeys, revokeApiKey } from "@/services/api-key-service";
import { createWebhook, getWebhooks, deleteWebhook } from "@/services/webhook-service";
import { format } from 'date-fns';
import { DatePicker } from "@/components/ui/date-picker";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

function ApiKeysTab() {
    const { user } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();

    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyExpiry, setNewKeyExpiry] = useState<Date | undefined>();
    const [generatedKey, setGeneratedKey] = useState<{ name: string; key: string } | null>(null);
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

    const fetchKeys = async () => {
        if (!user || !activeCompany) return;
        setLoading(true);
        try {
            const userKeys = await getApiKeys(activeCompany.id);
            setKeys(userKeys);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao buscar chaves de API" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeCompany) fetchKeys();
    }, [activeCompany]);

    const handleGenerateKey = async () => {
        if (!user || !activeCompany || !newKeyName) {
            toast({ variant: 'destructive', title: 'Preencha o nome da chave.' });
            return;
        }

        try {
            const { plainTextKey } = await createApiKey(activeCompany.id, newKeyName, newKeyExpiry);
            setGeneratedKey({ name: newKeyName, key: plainTextKey });
            setIsSheetOpen(false);
            setNewKeyName("");
            setNewKeyExpiry(undefined);
            fetchKeys();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao gerar chave" });
        }
    };
    
    const handleRevokeKey = async () => {
        if (!keyToRevoke) return;
        try {
            await revokeApiKey(keyToRevoke.id);
            toast({ title: "Chave de API revogada com sucesso" });
            fetchKeys();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao revogar chave" });
        } finally {
            setKeyToRevoke(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Chave copiada para a área de transferência!" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" /> Chaves de API
                </CardTitle>
                <CardDescription>Gere e gerencie chaves de API para integrar com serviços externos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && <Loader2 className="animate-spin" />}
                {!loading && keys.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma chave de API encontrada.</p>
                )}
                {!loading && keys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 font-mono">
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground">{key.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {key.keyPrefix}...{key.status === 'revoked' && <span className="text-destructive font-sans ml-2">(Revogada)</span>}
                            </span>
                             <span className="text-xs text-muted-foreground font-sans">Expira em: {key.expiresAt ? format(new Date(key.expiresAt as string), 'dd/MM/yyyy') : 'Nunca'}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={key.status === 'revoked'}><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setKeyToRevoke(key)} className="text-destructive">Revogar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Gerar Nova Chave
                </Button>
            </CardFooter>

            {/* Sheet for creating new key */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Gerar Nova Chave de API</SheetTitle>
                        <SheetDescription>Dê um nome para sua chave e, opcionalmente, uma data de expiração.</SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key-name">Nome da Chave</Label>
                            <Input id="key-name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Ex: Integração Bling" />
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Expiração (Opcional)</Label>
                            <DatePicker date={newKeyExpiry} onDateChange={setNewKeyExpiry} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateKey}>Gerar Chave</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Alert for showing generated key */}
            <AlertDialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Chave de API Gerada: {generatedKey?.name}</AlertDialogTitle>
                        <AlertDialogDescription>Copie sua chave. Por motivos de segurança, você não poderá vê-la novamente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="p-4 bg-muted rounded-md font-mono text-sm flex items-center justify-between">
                        <span>{generatedKey?.key}</span>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey?.key || '')}><Copy className="h-4 w-4"/></Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setGeneratedKey(null)}>Entendi</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Alert for revoking key */}
             <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revogar Chave de API?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja revogar a chave "{keyToRevoke?.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevokeKey} className="bg-destructive hover:bg-destructive/90">Revogar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function WebhooksTab() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [webhookToEdit, setWebhookToEdit] = useState<WebhookType | null>(null);

  const fetchWebhooks = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const companyWebhooks = await getWebhooks(activeCompany.id);
      setWebhooks(companyWebhooks);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao buscar webhooks." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompany) fetchWebhooks();
  }, [activeCompany]);

  const handleSaveWebhook = async (values: { url: string, event: WebhookType['event'], useAuth: boolean, secret: string }) => {
    if (!user || !activeCompany) return;
    
    try {
      if (webhookToEdit) {
        // Update logic not implemented in service, skipping for now.
      } else {
        await createWebhook({
          ownerId: user.uid,
          companyId: activeCompany.id,
          url: values.url,
          event: values.event,
          authentication: values.useAuth ? 'header' : 'none',
          secret: values.useAuth ? values.secret : undefined,
        });
        toast({ title: "Webhook criado com sucesso!" });
      }
      setIsSheetOpen(false);
      setWebhookToEdit(null);
      fetchWebhooks();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar webhook." });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await deleteWebhook(webhookId);
      toast({ title: "Webhook excluído com sucesso." });
      fetchWebhooks();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir webhook." });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Webhook /> Webhooks</CardTitle>
        <CardDescription>Configure URLs para receber notificações de eventos em tempo real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <Loader2 className="animate-spin" />}
        {!loading && webhooks.length === 0 && <p className="text-sm text-muted-foreground">Nenhum webhook configurado.</p>}
        {!loading && webhooks.map(hook => (
          <div key={hook.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div>
              <p className="font-semibold text-sm">{hook.event}</p>
              <p className="text-xs text-muted-foreground font-mono">{hook.url}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteWebhook(hook.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={() => { setWebhookToEdit(null); setIsSheetOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Webhook</Button>
      </CardFooter>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <WebhookFormSheetContent onSave={handleSaveWebhook} onCancel={() => setIsSheetOpen(false)} />
      </Sheet>
    </Card>
  );
}

function WebhookFormSheetContent({ onSave, onCancel }: { onSave: (v: any) => void, onCancel: () => void }) {
    const [url, setUrl] = useState('');
    const [event, setEvent] = useState<WebhookType['event']>('order.created');
    const [useAuth, setUseAuth] = useState(false);
    const [secret, setSecret] = useState('');
    
    const handleSubmit = () => {
        onSave({ url, event, useAuth, secret });
    };

    return (
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Webhook</SheetTitle>
          <SheetDescription>Crie uma notificação para um evento específico.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Endpoint</Label>
            <Input id="webhook-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-servico.com/webhook" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-event">Evento de Disparo</Label>
            <Select value={event} onValueChange={(v: WebhookType['event']) => setEvent(v)}>
              <SelectTrigger id="webhook-event"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="order.created">Pedido Criado</SelectItem>
                <SelectItem value="order.updated">Pedido Atualizado</SelectItem>
                <SelectItem value="stock.low">Estoque Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="webhook-auth" checked={useAuth} onCheckedChange={(checked) => setUseAuth(checked as boolean)} />
            <Label htmlFor="webhook-auth">Usar autenticação de cabeçalho (Secret)</Label>
          </div>
          {useAuth && (
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret</Label>
              <Input id="webhook-secret" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Seu_segredo_super_secreto" />
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações Avançadas"
        description="Gerencie chaves de API, webhooks e outras configurações técnicas."
      />

       <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-6">
          <WebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
