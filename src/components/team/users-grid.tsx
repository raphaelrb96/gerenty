
"use client";

import * as React from "react";
import { MoreHorizontal, Mail, Phone, KeyRound, ShieldAlert, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Employee } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";
import { usePermissions } from "@/context/permissions-context";

type UsersGridProps = {
  data: Employee[];
  onEdit: (member: Employee) => void;
  onDelete: (memberId: string) => Promise<void>;
  onManageAccess: (member: Employee) => void;
  onInvite: (member: Employee) => void;
};

export function UsersGrid({ data, onEdit, onDelete, onManageAccess, onInvite }: UsersGridProps) {
  const [memberToDelete, setMemberToDelete] = React.useState<Employee | null>(null);
  const { getPermissions } = usePermissions();


  const handleDelete = async () => {
    if (memberToDelete) {
      await onDelete(memberToDelete.id);
      setMemberToDelete(null);
    }
  }

  const getStatusVariant = (isActive: boolean) => {
    return isActive ? "bg-green-600/20 text-green-700" : "bg-yellow-600/20 text-yellow-700";
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  const canInvite = (memberId: string): boolean => {
      const perms = getPermissions(memberId);
      if (!perms) return false;
      
      const hasModulePermission = Object.values(perms.modules).some(v => v === true);
      const hasCompanyPermission = Object.values(perms.companies).some(v => v === true);

      return hasModulePermission && hasCompanyPermission;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.map((member) => (
              <Card key={member.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{member.name}</CardTitle>
                             <Badge variant="outline" className="capitalize mt-1">{member.role}</Badge>
                        </div>
                   </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => onEdit(member)}>Editar Dados</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onManageAccess(member)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Gerenciar Acesso
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setMemberToDelete(member)} className="text-destructive focus:text-destructive">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Remover da Equipe
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{member.email || 'Nenhum e-mail'}</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone || 'Não informado'}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2">
                    <Badge variant={"secondary"} className={cn("w-full justify-center text-xs", getStatusVariant(member.isActive))}>
                        {member.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                </CardFooter>
              </Card>
            ))}
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={(isOpen) => !isOpen && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o membro da equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
