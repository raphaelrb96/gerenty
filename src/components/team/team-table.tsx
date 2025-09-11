
"use client";

import * as React from "react";
import { MoreHorizontal, Mail, Phone, User, Briefcase } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

type TeamTableProps = {
  data: Employee[];
  onEdit: (member: Employee) => void;
  onDelete: (memberId: string) => Promise<void>;
};

export function TeamTable({ data, onEdit, onDelete }: TeamTableProps) {
  const [memberToDelete, setMemberToDelete] = React.useState<Employee | null>(null);

  const handleDelete = async () => {
    if (memberToDelete) {
      await onDelete(memberToDelete.id);
      setMemberToDelete(null);
    }
  }

  const getStatusVariant = (isActive: boolean) => {
    return isActive ? "bg-green-600/20 text-green-700" : "bg-red-600/20 text-red-700";
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((member) => (
              <Card key={member.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{member.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
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
                        <DropdownMenuItem onSelect={() => onEdit(member)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setMemberToDelete(member)} className="text-destructive">
                            Excluir
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{member.email}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{member.phone || 'Não informado'}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{member.document || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{member.type}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Badge variant={"secondary"} className={cn("w-full justify-center", getStatusVariant(member.isActive))}>
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
