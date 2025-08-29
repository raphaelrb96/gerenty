
"use client";

import { PageHeader } from "@/components/common/page-header";

export default function TeamPage() {
    return (
        <div className="space-y-4">
            <PageHeader 
                title="Gestão de Equipe"
                description="Gerencie seus vendedores e entregadores."
            />
             <div className="flex items-center justify-center h-[50vh] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Página de Equipe em construção.</p>
            </div>
        </div>
    );
}
