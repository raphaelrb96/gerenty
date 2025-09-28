
"use client";

import { PageHeader } from "@/components/common/page-header";
import { WhatsAppConfigForm } from "@/components/integrations/whatsapp-config-form";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import { Building } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WhatsAppIntegrationPage() {
  const { activeCompany } = useCompany();

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
            icon={<Building className="h-16 w-16" />}
            title="Nenhuma empresa selecionada"
            description="Por favor, selecione uma empresa para configurar a integração com o WhatsApp."
            action={<Button asChild><Link href="/dashboard/companies">Gerenciar Empresas</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração do WhatsApp Business"
        description="Conecte sua conta da API Cloud da Meta para automatizar conversas."
      />
      <div className="max-w-4xl mx-auto">
        <WhatsAppConfigForm company={activeCompany} />
      </div>
    </div>
  );
}
