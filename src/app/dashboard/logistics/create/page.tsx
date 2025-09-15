
"use client";

import { PageHeader } from "@/components/common/page-header";
import { RouteForm } from "@/components/logistics/route-form";

export default function CreateRoutePage() {
    return (
        <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="Criar Nova Rota"
                description="Selecione um entregador e os pedidos para montar uma nova rota de entrega."
            />
            <div className="flex-1 overflow-hidden">
                <RouteForm />
            </div>
        </div>
    );
}

