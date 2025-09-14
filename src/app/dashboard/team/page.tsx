
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getEmployeesByUser, deleteEmployee } from "@/services/employee-service";
import type { Employee, Role } from "@/lib/types";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { MemberForm } from "@/components/team/member-form";
import { UsersGrid } from "@/components/team/users-grid";
import { UsersFilterBar } from "@/components/team/users-filter-bar";
import { AccessControlModal } from "@/components/team/access-control-modal";

export default function TeamPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [team, setTeam] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for modals
    const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    
    // State for selected member for modals
    const [editingMember, setEditingMember] = useState<Employee | null>(null);
    const [memberForAccess, setMemberForAccess] = useState<Employee | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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

    const handleOpenEditMember = (member: Employee) => {
        setEditingMember(member);
        setIsMemberFormOpen(true);
    }
    
    const handleOpenAddMember = () => {
        setEditingMember(null);
        setIsMemberFormOpen(true);
    }

    const handleOpenAccessControl = (member: Employee) => {
        setMemberForAccess(member);
        setIsAccessModalOpen(true);
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

    const filteredTeam = team.filter(member => {
        const nameMatch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatch = roleFilter === 'all' || member.role === roleFilter;
        const statusMatch = statusFilter === 'all' || (statusFilter === 'active' ? member.isActive : !member.isActive);
        return nameMatch && roleMatch && statusMatch;
    });

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Usuários e Permissões"
                description="Gerencie os membros da sua equipe e seus acessos."
                 action={
                    <Button onClick={handleOpenAddMember}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Membro
                    </Button>
                }
            />

            <UsersFilterBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            {filteredTeam.length === 0 ? (
                 <EmptyState
                    icon={<Users className="h-16 w-16" />}
                    title={team.length === 0 ? "Nenhum membro na equipe" : "Nenhum membro encontrado"}
                    description={team.length === 0 ? "Comece adicionando membros à sua equipe para gerenciar suas funções e permissões." : "Nenhum membro corresponde aos filtros selecionados."}
                    action={team.length === 0 ? (
                        <Button onClick={handleOpenAddMember}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Primeiro Membro
                        </Button>
                    ) : undefined}
                />
            ) : (
                <UsersGrid
                    data={filteredTeam}
                    onEdit={handleOpenEditMember}
                    onDelete={handleDeleteMember}
                    onManageAccess={handleOpenAccessControl}
                />
            )}

            <MemberForm
                isOpen={isMemberFormOpen}
                onClose={() => setIsMemberFormOpen(false)}
                onFinished={fetchTeam}
                member={editingMember}
            />
            
            <AccessControlModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                member={memberForAccess}
            />
        </div>
    );
}
