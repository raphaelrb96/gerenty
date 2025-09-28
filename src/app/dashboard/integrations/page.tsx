

"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, ArrowRight, Puzzle, XCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import { usePermissions } from "@/context/permissions-context";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import Link from "next/link";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WhatsAppIntegration } from "@/lib/types";

type Integration = {
  name: string;
  description: string;
  logo?: string;
  isConnected?: boolean;
  isConfigurable?: boolean;
  href?: string;
};

type IntegrationCategory = {
  title: string;
  integrations: Integration[];
};

const allIntegrationsData: IntegrationCategory[] = [
  {
    title: "Comunicação e Marketing",
    integrations: [
      { name: "Meta (Facebook/Instagram)", description: "Sincronize seu catálogo e crie anúncios dinâmicos.", logo: "/logos/meta.svg" },
      { name: "Google Ads", description: "Monitore o desempenho de suas campanhas de publicidade.", logo: "/logos/google-ads.svg" },
      { name: "Mailchimp", description: "Automatize seu e-mail marketing com base nas vendas.", logo: "/logos/mailchimp.svg" },
      { name: "Twilio", description: "Envie notificações por SMS ou WhatsApp para seus clientes.", logo: "/logos/twilio.svg" },
    ],
  },
  {
    title: "Marketplaces",
    integrations: [
      { name: "Mercado Livre", description: "Venda seus produtos no maior marketplace da América Latina.", logo: "/logos/mercado-livre.svg" },
      { name: "Amazon", description: "Alcance milhões de clientes na Amazon.", logo: "/logos/amazon.svg" },
      { name: "Shopee", description: "Conecte-se à plataforma de compras que mais cresce.", logo: "/logos/shopee.svg" },
      { name: "Magazine Luiza", description: "Integre com um dos maiores varejistas do Brasil.", logo: "/logos/magalu.svg" },
    ],
  },
  {
    title: "E-commerce",
    integrations: [
      { name: "Shopify", description: "Sincronize seus produtos e pedidos com sua loja Shopify.", logo: "/logos/shopify.svg" },
      { name: "Nuvemshop", description: "Gerencie seu e-commerce Nuvemshop diretamente daqui.", logo: "/logos/nuvemshop.svg" },
      { name: "WooCommerce", description: "Conecte sua loja baseada em WordPress.", logo: "/logos/woocommerce.svg" },
    ],
  },
  {
    title: "Logística e Frete",
    integrations: [
      { name: "Melhor Envio", description: "Calcule fretes e gere etiquetas com múltiplas transportadoras.", logo: "/logos/melhor-envio.svg" },
      { name: "Frenet", description: "Automatize seus envios e cotações de frete.", logo: "/logos/frenet.svg" },
      { name: "Correios", description: "Integração direta com os serviços dos Correios.", logo: "/logos/correios.svg" },
    ],
  },
  {
    title: "Pagamentos",
    integrations: [
      { name: "Stripe", description: "Processe pagamentos online e assinaturas com segurança.", logo: "/logos/stripe.svg" },
      { name: "Mercado Pago", description: "Receba pagamentos com a solução do Mercado Livre.", logo: "/logos/mercado-pago.svg" },
      { name: "PagSeguro", description: "Integre com uma das maiores plataformas de pagamento do Brasil.", logo: "/logos/pagseguro.svg" },
    ],
  },
];

const WhatsAppIntegrationCard = ({ status }: { status: WhatsAppIntegration['status'] }) => {
    const isConnected = status === 'connected';
    const isError = status === 'error';

    const getStatusInfo = () => {
        if (isConnected) {
            return {
                text: 'Conectado',
                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                buttonText: 'Configurar',
                buttonIcon: <ArrowRight className="ml-2 h-4 w-4" />
            };
        }
        if (isError) {
             return {
                text: 'Erro na Conexão',
                icon: <AlertCircle className="h-4 w-4 text-destructive" />,
                buttonText: 'Verificar',
                buttonIcon: <ArrowRight className="ml-2 h-4 w-4" />
            };
        }
        return {
            text: 'Desconectado',
            icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
            buttonText: 'Conectar Agora',
            buttonIcon: <ArrowRight className="ml-2 h-4 w-4" />
        };
    }

    const statusInfo = getStatusInfo();
    
    return (
      <Card className="flex flex-col md:flex-row items-center justify-between p-6 transition-transform transform hover:-translate-y-1 hover:shadow-lg border-primary/20 shadow-md">
         <div className="flex items-center gap-6">
            <div className="relative w-16 h-16">
                <Image src="/logos/whatsapp.svg" alt="WhatsApp logo" layout="fill" objectFit="contain" />
            </div>
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    API do WhatsApp
                    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        {statusInfo.icon}
                        {statusInfo.text}
                    </span>
                </h3>
                <p className="text-muted-foreground">Conecte a API Cloud oficial para automatizar conversas e notificações.</p>
            </div>
         </div>
         <Button asChild className="mt-4 md:mt-0">
            <Link href={'/dashboard/integrations/whatsapp'}>
                {statusInfo.buttonText}
                {statusInfo.buttonIcon}
            </Link>
         </Button>
      </Card>
    );
};


const AvailableIntegrationCard = ({ integration }: { integration: Integration }) => (
  <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
    <CardHeader>
        <CardTitle className="text-base">{integration.name}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
        <CardDescription className="mt-1 text-xs">{integration.description}</CardDescription>
    </CardContent>
    <CardFooter className="mt-auto">
        <Button variant="secondary" className="w-full" disabled>
          Em breve
        </Button>
    </CardFooter>
  </Card>
);

export default function IntegrationsPage() {
  const { hasAccess } = usePermissions();
  const { activeCompany } = useCompany();
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppIntegration['status']>('disconnected');

  useEffect(() => {
    if (activeCompany) {
      const unsub = onSnapshot(doc(db, "companies", activeCompany.id, "integrations", "whatsapp"), (doc) => {
        if (doc.exists()) {
          const data = doc.data() as WhatsAppIntegration;
          setWhatsAppStatus(data.status);
        } else {
          setWhatsAppStatus('disconnected');
        }
      });
      return () => unsub();
    }
  }, [activeCompany]);

  // Security Check
  if (!hasAccess('integrations')) {
      return (
          <div className="flex items-center justify-center h-full">
              <EmptyState
                  icon={<Shield className="h-16 w-16" />}
                  title="Acesso Negado"
                  description="Você não tem permissão para gerenciar integrações."
              />
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrações"
        description="Conecte o Gerenty a outras plataformas para automatizar seu fluxo de trabalho."
      />

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Integrações Disponíveis</h2>
          <WhatsAppIntegrationCard status={whatsAppStatus} />
        </div>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Integrações em Desenvolvimento</h2>
            {allIntegrationsData.map((category) => (
            <div key={category.title} className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{category.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.integrations.map((integration) => (
                    <AvailableIntegrationCard key={integration.name} integration={integration} />
                ))}
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}
