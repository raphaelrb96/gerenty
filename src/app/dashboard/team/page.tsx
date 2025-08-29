
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getEmployeesByUser, addEmployee, updateEmployee, deleteEmployee } from "@/services/employee-service";
import type { Employee } from "@/lib/types";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { MemberForm } from "@/components/team/member-form";
import { TeamTable } from "@/components/team/team-table";


export default function TeamPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [team, setTeam] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Employee | null>(null);

    const fetchTeam = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userTeam = await getEmployeesByUser(user.uid);
            setTeam(userTeam);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao buscar equipe", description: "Não foi possível carregar os dados da equipe." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTeam();
        }
    }, [user]);

    const handleEditMember = (member: Employee) => {
        setEditingMember(member);
        setIsModalOpen(true);
    }
    
    const handleAddMember = () => {
        setEditingMember(null);
        setIsModalOpen(true);
    }

    const handleDeleteMember = async (memberId: string) => {
        try {
            await deleteEmployee(memberId);
            toast({ title: "Membro excluído com sucesso!" });
            fetchTeam(); // Refresh list
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível excluir o membro da equipe." });
        }
    }


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4">
            <PageHeader 
                title="Gestão de Equipe"
                description="Gerencie seus vendedores, entregadores e outros membros da equipe."
                 action={
                    <Button onClick={handleAddMember}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Membro
                    </Button>
                }
            />

            {team.length === 0 ? (
                 <EmptyState
                    icon={<Users className="h-16 w-16" />}
                    title="Nenhum membro na equipe"
                    description="Comece adicionando membros à sua equipe para gerenciar suas funções e permissões."
                    action={
                        <Button onClick={handleAddMember}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Primeiro Membro
                        </Button>
                    }
                />
            ) : (
                <TeamTable 
                    data={team}
                    onEdit={handleEditMember}
                    onDelete={handleDeleteMember}
                />
            )}

            <MemberForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onFinished={fetchTeam}
                member={editingMember}
                addEmployee={addEmployee}
                updateEmployee={updateEmployee}
            />

        </div>
    );
}
