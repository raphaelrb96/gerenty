
"use client";

import { CreateCompanyForm } from "@/components/companies/create-company-form";
import { PageHeader } from "@/components/common/page-header";

export default function CreateCompanyPage() {

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Criar Nova Empresa"
        description="Preencha os detalhes abaixo para cadastrar uma nova empresa em sua conta."
      />
      <div className="max-w-4xl mx-auto">
        <CreateCompanyForm />
      </div>
    </div>
  );
}
