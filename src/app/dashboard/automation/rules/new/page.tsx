
"use client";

import { PageHeader } from "@/components/common/page-header";
import { RuleBuilderForm } from "@/components/automation/rule-builder-form";

export default function NewAutomationRulePage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Criar Nova Regra de Automação"
                description="Configure um gatilho e uma ação para automatizar tarefas repetitivas."
            />
            <div className="max-w-4xl mx-auto">
                <RuleBuilderForm />
            </div>
        </div>
    );
}
