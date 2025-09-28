
"use client";

import { PageHeader } from "@/components/common/page-header";
import { WhatsAppConfigForm } from "@/components/integrations/whatsapp-config-form";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import { Building, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/context/i18n-context";

function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompany();

    const getDisplayName = () => {
        if (!activeCompany) {
            return "Selecione uma empresa";
        }
        return activeCompany.name;
    };

    if (companies.length === 0) {
        return null; // Don't show selector if there are no companies
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-[300px] justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="truncate max-w-[250px]">{getDisplayName()}</span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width)]">
                {companies.map((company) => (
                    <DropdownMenuItem key={company.id} onSelect={() => setActiveCompany(company)}>
                        {company.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export default function WhatsAppIntegrationPage() {
  const { activeCompany } = useCompany();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração do WhatsApp Business"
        description="Conecte sua conta da API Cloud da Meta para automatizar conversas."
      />

      <CompanySelector />

      {!activeCompany ? (
        <div className="flex items-center justify-center h-full pt-16">
            <EmptyState
                icon={<Building className="h-16 w-16" />}
                title="Nenhuma empresa selecionada"
                description="Por favor, selecione uma empresa acima para configurar a integração com o WhatsApp."
                action={<Button asChild><Link href="/dashboard/companies">Gerenciar Empresas</Link></Button>}
            />
        </div>
      ) : (
         <div className="max-w-4xl mx-auto">
            <WhatsAppConfigForm company={activeCompany} />
        </div>
      )}
    </div>
  );
}
