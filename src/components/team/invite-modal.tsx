
"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@/lib/types";
import { sendInvitationEmail } from "@/services/auth-service";

import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type InviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  member: Employee | null;
};

export function InviteModal({ isOpen, onClose, member }: InviteModalProps) {
  const { toast } = useToast();
  const [isInviting, setIsInviting] = React.useState(false);

  const handleInviteUser = async () => {
    if (!member || !member.email) {
      toast({
        variant: "destructive",
        title: "Erro de Convite",
        description: "O membro precisa ter um e-mail cadastrado para ser convidado.",
      });
      return;
    }
    setIsInviting(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/login`;
      await sendInvitationEmail(member.email, redirectUrl);
      toast({
        title: "Convite Enviado!",
        description: `Um link de criação de conta foi enviado para ${member.email}.`,
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao Enviar Convite",
        description: "Não foi possível enviar o convite. Tente novamente.",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Convidar {member?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Um e-mail será enviado para <span className="font-bold">{member?.email}</span> com
            instruções para criar uma senha e acessar a plataforma. As permissões
            já definidas serão aplicadas à conta dele.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleInviteUser} disabled={isInviting}>
            {isInviting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Confirmar e Enviar Convite
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
