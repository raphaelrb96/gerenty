
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { CreateCompanyForm } from "@/components/companies/create-company-form";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function CreateCompanyPage() {
  const { userData, loading: authLoading } = useAuth();
  const { companies, loading: companyLoading } = useCompany();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for both user and company data to be loaded
    if (!authLoading && !companyLoading) {
      // Rule: Only company owners can create new companies.
      if (userData?.role !== 'empresa') {
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: "Você não tem permissão para criar novas empresas.",
        });
        router.push('/dashboard');
        return;
      }

      const companyLimit = userData?.plan?.limits?.companies ?? 1;
      
      if (companies.length >= companyLimit) {
        toast({
          variant: "destructive",
          title: "Limite de Empresas Atingido",
          description: "Você atingiu o limite de empresas para o seu plano atual. Considere fazer um upgrade.",
        });
        router.push('/dashboard/companies');
      }
    }
  }, [userData, companies, authLoading, companyLoading, router, toast]);

  // Show a loading state while we verify the limits
  if (authLoading || companyLoading) {
    return <LoadingSpinner />;
  }
  
  // Block access if the user is not a company owner or if limit is reached
  if (userData?.role !== 'empresa' || companies.length >= (userData?.plan?.limits?.companies ?? 1)) {
    // This is a fallback while redirecting, to avoid showing the form briefly
    return null; 
  }

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
