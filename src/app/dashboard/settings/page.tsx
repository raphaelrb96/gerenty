
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { createApiKey, getApiKeys, revokeApiKey } from "@/services/api-key-service";
import { createWebhook, getWebhooks, deleteWebhook } from "@/services/webhook-service";
import { ApiKey, Webhook as WebhookType, WebhookEvent } from "@/lib/types";
import { usePermissions } from "@/context/permissions-context";
import { EmptyState } from "@/components/common/empty-state";
import { KeyRound, Webhook, Copy, PlusCircle, Trash2, MoreVertical, Loader2, Shield } from "lucide-react";


function ApiKeysTab() {
    const { user, effectiveOwnerId } = useAuth();
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
        if (!effectiveOwnerId || !activeCompany) return;
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
        if (activeCompany && effectiveOwnerId) fetchKeys();
    }, [activeCompany, effectiveOwnerId]);

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
        <div className="space-y-6">
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
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Como Usar as Chaves de API</CardTitle>
                    <CardDescription>
                        Instruções sobre como usar Chaves de API para integrar com o Gerenty.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground mb-2">
                            As chaves de API permitem que seus sistemas externos acessem seus dados do Gerenty de forma segura.
                        </p>
                        <p className="mb-2">
                            1. Gere uma chave. Guarde-a em um local seguro, pois ela não será exibida novamente.
                        </p>
                        <p className="mb-2">
                            2. Para autenticar suas requisições, inclua a chave no cabeçalho `Authorization` como um Bearer Token.
                        </p>
                        <pre className="p-2 rounded-md bg-muted font-mono text-xs overflow-x-auto"><code>{`fetch('https://api.gerenty.com/v1/orders', {
  headers: {
    'Authorization': 'Bearer SUA_CHAVE_DE_API_AQUI'
  }
})`}</code></pre>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
}

const webhookEventsConfig: { category: string, events: { name: WebhookEvent, description: string }[] }[] = [
    {
        category: 'Pedidos',
        events: [
            { name: 'order.created', description: 'Disparado quando um novo pedido é criado.' },
            { name: 'order.updated', description: 'Disparado quando um pedido existente é atualizado.' },
            { name: 'order.paid', description: 'Disparado quando o pagamento de um pedido é confirmado.' },
            { name: 'order.shipped', description: 'Disparado quando um pedido é marcado como enviado.' },
            { name: 'order.cancelled', description: 'Disparado quando um pedido é cancelado.' },
        ],
    },
    {
        category: 'Clientes',
        events: [
            { name: 'customer.created', description: 'Disparado quando um novo cliente é cadastrado.' },
            { name: 'customer.updated', description: 'Disparado quando os dados de um cliente são atualizados.' },
        ],
    },
    {
        category: 'Produtos',
        events: [
            { name: 'product.created', description: 'Disparado quando um novo produto é criado.' },
            { name: 'product.updated', description: 'Disparado quando um produto é atualizado.' },
        ],
    },
    {
        category: 'Estoque',
        events: [
            { name: 'stock.low', description: 'Disparado quando o estoque de um produto atinge o nível baixo.' },
            { name: 'stock.out_of_stock', description: 'Disparado quando o estoque de um produto se esgota.' },
        ],
    },
];

function WebhooksTab() {
  const { user, effectiveOwnerId } = useAuth();
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

  const handleSaveWebhook = async (values: { url: string, events: WebhookEvent[], useAuth: boolean, secret: string }) => {
    if (!effectiveOwnerId || !activeCompany) return;
    
    try {
      if (webhookToEdit) {
        // Update logic not implemented in service, skipping for now.
      } else {
        await createWebhook({
          ownerId: effectiveOwnerId,
          companyId: activeCompany.id,
          url: values.url,
          events: values.events,
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
    <div className="space-y-6">
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
                    <p className="font-mono text-xs">{hook.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {hook.events.map(event => <Badge key={event} variant="secondary">{event}</Badge>)}
                    </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteWebhook(hook.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                ))}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={() => { setWebhookToEdit(null); setIsSheetOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Webhook</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Como Configurar Webhooks</CardTitle>
                <CardDescription>
                    Webhooks notificam seus sistemas em tempo real quando eventos específicos acontecem no Gerenty.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                 <div>
                    <h4 className="font-semibold mb-2">O que é um Webhook?</h4>
                    <p className="text-muted-foreground mb-4">
                        Imagine que um webhook é como uma notificação automática para seus outros sistemas. Em vez de você precisar verificar no Gerenty se algo novo aconteceu (como um novo pedido), o Gerenty avisa seu sistema na mesma hora.
                    </p>
                    <h4 className="font-semibold mb-2">Passo a Passo:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>
                            <strong>Crie um "Ouvinte" no seu sistema:</strong> Você precisa ter uma URL pública (um link) no seu site ou sistema que seja capaz de receber informações. Ex: `https://seu-site.com/api/gerenty-notifications`.
                        </li>
                        <li>
                            <strong>Configure o Webhook aqui:</strong> Clique em "Adicionar Webhook", insira a URL que você criou e escolha qual evento você quer que dispare a notificação (Ex: "Pedido Criado").
                        </li>
                        <li>
                            <strong>(Opcional) Adicione Segurança:</strong> Se você preencher o campo "Secret", nós enviaremos um código secreto em cada notificação. Isso permite que seu sistema verifique se a notificação veio mesmo do Gerenty.
                        </li>
                        <li>
                            <strong>Pronto!</strong> Agora, sempre que o evento escolhido acontecer, o Gerenty enviará os detalhes para a sua URL, permitindo que você automatize tarefas como enviar emails, atualizar planilhas, etc.
                        </li>
                    </ol>
                </div>
            </CardContent>
        </Card>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <WebhookFormSheetContent onSave={handleSaveWebhook} onCancel={() => setIsSheetOpen(false)} />
        </Sheet>
    </div>
  );
}

function WebhookFormSheetContent({ onSave, onCancel }: { onSave: (v: any) => void, onCancel: () => void }) {
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
    const [useAuth, setUseAuth] = useState(false);
    const [secret, setSecret] = useState('');
    
    const handleSubmit = () => {
        onSave({ url, events: selectedEvents, useAuth, secret });
    };

    const handleEventToggle = (event: WebhookEvent) => {
        setSelectedEvents(prev => 
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        );
    }

    return (
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader className="px-6 pt-6 flex-shrink-0">
          <SheetTitle>Adicionar Webhook</SheetTitle>
          <SheetDescription>Crie uma notificação para um ou mais eventos específicos.</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-2">
                <Label htmlFor="webhook-url">URL do Endpoint</Label>
                <Input id="webhook-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-servico.com/webhook" />
            </div>

            <div>
                <Label>Eventos de Disparo</Label>
                <Card className="mt-2">
                    <CardContent className="p-4 space-y-4">
                        {webhookEventsConfig.map(category => (
                            <div key={category.category}>
                                <h4 className="font-semibold mb-2">{category.category}</h4>
                                <div className="space-y-2">
                                    {category.events.map(event => (
                                        <div key={event.name} className="flex items-start space-x-2">
                                            <Checkbox
                                                id={event.name}
                                                checked={selectedEvents.includes(event.name)}
                                                onCheckedChange={() => handleEventToggle(event.name)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor={event.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {event.name}
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    {event.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
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
        
        <SheetFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    );
}

export default function SettingsPage() {
    const { hasAccess } = usePermissions();

    // Security Check
    if (!hasAccess('settings')) {
        return (
            <div className="flex items-center justify-center h-full">
                <EmptyState
                    icon={<Shield className="h-16 w-16" />}
                    title="Acesso Negado"
                    description="Você não tem permissão para acessar as configurações avançadas."
                />
            </div>
        );
    }

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
