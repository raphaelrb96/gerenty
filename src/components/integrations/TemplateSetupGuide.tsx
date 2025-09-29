// src/components/integrations/TemplateSetupGuide.tsx - Corrija as props
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Copy, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface TemplateErrorInfo {
    needsTemplateSetup: boolean;
    errorCode?: number;
    errorMessage?: string;
    phoneNumberId?: string;
    templateName?: string;
}

interface TemplateSetupGuideProps {
    templateError: TemplateErrorInfo;
    companyId: string;
    onBack: () => void;
}

export function TemplateSetupGuide({ templateError, companyId, onBack }: TemplateSetupGuideProps) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
    };

    const templateStructure = {
        name: templateError.templateName || 'test_send',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Esta é uma mensagem de teste do sistema Gerenty. Mensagem de teste enviada com sucesso!',
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'QUICK_REPLY',
                        text: '👍 Funcionou'
                    },
                    {
                        type: 'QUICK_REPLY',
                        text: '🔄 Testar Novamente'
                    }
                ]
            }
        ],
        language: 'pt_BR'
    };

    const steps = [
        {
            title: "Acessar o Painel de Templates",
            description: "Vá para o painel da Meta for Developers",
            action: (
                <Button onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Meta for Developers
                </Button>
            )
        },
        {
            title: "Criar Template",
            description: "Use a estrutura abaixo para criar o template",
            action: (
                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(templateStructure, null, 2)}
                        </pre>
                    </div>
                    <Button onClick={() => copyToClipboard(JSON.stringify(templateStructure, null, 2))}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Estrutura
                    </Button>
                </div>
            )
        },
        {
            title: "Aguardar Aprovação",
            description: "O template será aprovado em alguns minutos",
            action: (
                <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                        Após criar o template, aguarde a aprovação e teste novamente.
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Alert>
                <AlertTitle>📋 Configuração de Template Necessária</AlertTitle>
                <AlertDescription>
                    Para enviar mensagens fora da janela de 24h, você precisa configurar um template.
                    {templateError.errorMessage && (
                        <div className="mt-2 text-sm">
                            <strong>Erro:</strong> {templateError.errorMessage}
                        </div>
                    )}
                </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <div className="text-sm text-muted-foreground">
                    Passo {currentStep} de {steps.length}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps[currentStep - 1].action}

                    <div className="flex justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                            disabled={currentStep === steps.length}
                        >
                            Próximo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>💡 Informações Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div><strong>Template:</strong> {templateError.templateName || 'test_send'}</div>
                    <div><strong>Categoria:</strong> UTILITY</div>
                    <div><strong>Phone Number ID:</strong> {templateError.phoneNumberId || 'Não disponível'}</div>
                    {templateError.errorCode && (
                        <div><strong>Código do Erro:</strong> {templateError.errorCode}</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}