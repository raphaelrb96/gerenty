
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getEmployeesByUser } from "@/services/employee-service";
import { getUnassignedOrders } from "@/services/order-service";
import type { Employee, Order } from "@/lib/types";

import { PageHeader } from "@/components/common/page-header";
import { RouteForm } from "@/components/logistics/route-form";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Users, Shield } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { usePermissions } from "@/context/permissions-context";


export default function CreateRoutePage() {
    const { effectiveOwnerId } = useAuth();
    const { activeCompany, companies } = useCompany();
    const router = useRouter();
    const { hasAccess } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Employee[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

     useEffect(() => {
        const fetchData = async () => {
            if (!effectiveOwnerId) return;
            setLoading(true);
            try {
                const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
                const [userDrivers, unassignedOrders] = await Promise.all([
                    getEmployeesByUser(effectiveOwnerId),
                    getUnassignedOrders(companyIds)
                ]);
                setDrivers(userDrivers.filter(d => d.role === 'entregador' && d.isActive));
                setOrders(unassignedOrders);
            } catch (error) {
                console.error("Error loading data for route creation:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [effectiveOwnerId, activeCompany, companies]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (drivers.length === 0) {
        if (hasAccess('team')) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6">
                    <EmptyState
                        icon={<Users className="h-16 w-16" />}
                        title="Nenhum Entregador Cadastrado"
                        description="Você precisa ter pelo menos um entregador ativo cadastrado para criar uma rota."
                        action={
                            <Button onClick={() => router.push('/dashboard/team')}>
                                Cadastrar Entregador
                            </Button>
                        }
                    />
                </div>
            );
        } else {
             return (
                <div className="flex flex-col items-center justify-center h-full p-6">
                    <EmptyState
                        icon={<Shield className="h-16 w-16" />}
                        title="Nenhum Entregador Disponível"
                        description="Não há entregadores ativos para criar uma nova rota. Por favor, contate o administrador da sua conta."
                    />
                </div>
            );
        }
    }


    return (
        <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="Criar Nova Rota"
                description="Selecione um entregador e os pedidos para montar uma nova rota de entrega."
            />
            <div className="flex-1 overflow-hidden">
                <RouteForm drivers={drivers} orders={orders} />
            </div>
        </div>
    );
}

