"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getCustomersByUser, Customer } from "@/services/customer-service";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateCustomerModal } from "@/components/crm/create-customer-modal";

export default function CrmPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCustomers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userCustomers = await getCustomersByUser(user.uid);
            setCustomers(userCustomers);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [user]);

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer]);
        fetchCustomers(); // Re-fetch to ensure data consistency
    };

    const handleCustomerUpdated = (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)]">
            <PageHeader
                title="CRM de Clientes"
                description="Gerencie o funil de relacionamento com seus clientes."
                action={
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Cliente
                    </Button>
                }
            />
            <div className="flex-1 mt-4 overflow-hidden">
                <KanbanBoard 
                    customers={customers} 
                    onCustomerUpdated={handleCustomerUpdated} 
                />
            </div>
             <CreateCustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
}
