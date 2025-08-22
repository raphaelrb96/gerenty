
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCompanyById } from "@/services/company-service";
import type { Company } from "@/lib/types";
import { EditCompanyForm } from "@/components/companies/edit-company-form";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useCompany as useCompanyContext } from "@/context/company-context";

export default function EditCompanyPage() {
    const params = useParams();
    const { id } = params;
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { setActiveCompany } = useCompanyContext();

    useEffect(() => {
        if (typeof id !== 'string') return;

        const fetchCompany = async () => {
            try {
                setLoading(true);
                const fetchedCompany = await getCompanyById(id);
                if (fetchedCompany) {
                    setCompany(fetchedCompany);
                    setActiveCompany(fetchedCompany);
                } else {
                    setError("Empresa não encontrada.");
                }
            } catch (err) {
                setError("Falha ao carregar os dados da empresa.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [id, setActiveCompany]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <PageHeader 
                title={`Editando: ${company?.name}`}
                description="Atualize os detalhes da sua empresa abaixo."
            />
            <div className="max-w-4xl mx-auto">
                {company && <EditCompanyForm company={company} />}
            </div>
        </div>
    );
}
