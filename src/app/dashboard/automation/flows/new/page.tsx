
"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { createFlow } from "@/services/flow-service";
import { LoadingSpinner } from "@/components/common/loading-spinner";


export default function NewConversationFlowPage() {
    const { effectiveOwnerId } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const initializeFlow = async () => {
            if (!effectiveOwnerId || !activeCompany) return;
            
            try {
                const newFlow = await createFlow(effectiveOwnerId, activeCompany.id);
                // Redirect to the new edit page
                router.push(`/dashboard/automation/flows/edit/${newFlow.id}`);
            } catch (error) {
                toast({ variant: 'destructive', title: "Erro ao criar fluxo", description: "Não foi possível iniciar um novo fluxo." });
                router.push('/dashboard/automation');
            }
        };

        if (effectiveOwnerId && activeCompany) {
            initializeFlow();
        }
    }, [effectiveOwnerId, activeCompany, toast, router]);

    // Show a loader while the creation and redirection is in progress
    return <LoadingSpinner />;
}
