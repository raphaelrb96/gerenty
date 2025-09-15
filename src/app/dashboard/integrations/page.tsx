
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield } from "lucide-react";
import Image from "next/image";
import { usePermissions } from "@/context/permissions-context";
import { EmptyState } from "@/components/common/empty-state";

type Integration = {
  name: string;
  description: string;
  logo: string;
  isConnected?: boolean;
};

type IntegrationCategory = {
  title: string;
  integrations: Integration[];
};

const integrationsData: IntegrationCategory[] = [
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
      { name: "Shopify", description: "Sincronize seus produtos e pedidos com sua loja Shopify.", logo: "/logos/shopify.svg", isConnected: true },
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
      { name: "Mercado Pago", description: "Receba pagamentos com a solução do Mercado Livre.", logo: "/logos/mercado-pago.svg", isConnected: true },
      { name: "PagSeguro", description: "Integre com uma das maiores plataformas de pagamento do Brasil.", logo: "/logos/pagseguro.svg" },
    ],
  },
   {
    title: "Marketing e Comunicação",
    integrations: [
      { name: "Meta (Facebook/Instagram)", description: "Sincronize seu catálogo e crie anúncios dinâmicos.", logo: "/logos/meta.svg" },
      { name: "Google Ads", description: "Monitore o desempenho de suas campanhas de publicidade.", logo: "/logos/google-ads.svg" },
      { name: "Mailchimp", description: "Automatize seu e-mail marketing com base nas vendas.", logo: "/logos/mailchimp.svg" },
      { name: "Twilio", description: "Envie notificações por SMS ou WhatsApp para seus clientes.", logo: "/logos/twilio.svg" },
    ],
  },
];

const IntegrationCard = ({ integration }: { integration: Integration }) => (
  <Card className="flex flex-col h-full transition-transform transform hover:-translate-y-1 hover:shadow-lg">
    <CardHeader className="flex flex-row items-start gap-4">
      <div className="relative w-12 h-12">
        <Image src={integration.logo} alt={`${integration.name} logo`} layout="fill" objectFit="contain" />
      </div>
      <div>
        <CardTitle>{integration.name}</CardTitle>
        <CardDescription className="mt-1">{integration.description}</CardDescription>
      </div>
    </CardHeader>
    <CardFooter className="mt-auto">
      {integration.isConnected ? (
        <Button variant="outline" className="w-full" disabled>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Conectado
        </Button>
      ) : (
        <Button variant="default" className="w-full" disabled>
          Conectar
        </Button>
      )}
    </CardFooter>
  </Card>
);

export default function IntegrationsPage() {
  const { hasAccess } = usePermissions();

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
        {integrationsData.map((category) => (
          <div key={category.title}>
            <h2 className="text-2xl font-bold font-headline mb-4">{category.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.integrations.map((integration) => (
                <IntegrationCard key={integration.name} integration={integration} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
