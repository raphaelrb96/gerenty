
"use client";

import { PageHeader } from "@/components/common/page-header";

export default function LogisticsPage() {
    return (
        <div className="space-y-4">
            <PageHeader 
                title="Logística e Entregas"
                description="Gerencie suas rotas e acompanhe o status das entregas."
            />
            <div className="flex items-center justify-center h-[50vh] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Página de Logística em construção.</p>
            </div>
        </div>
    );
}
