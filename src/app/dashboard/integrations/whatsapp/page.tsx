
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
import { Card, CardContent } from "@/components/ui/card";


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
        return null;
    }

    return (
        <Card className="mb-6">
            <CardContent className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-md bg-muted">
                        <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Empresa Ativa</p>
                        <h2 className="text-lg font-bold">{getDisplayName()}</h2>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Trocar Empresa
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {companies.map((company) => (
                            <DropdownMenuItem key={company.id} onSelect={() => setActiveCompany(company)}>
                                {company.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
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
