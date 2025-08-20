
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function BillingStatusContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const fromCheckout = searchParams.get('from_checkout');

    if (status === 'success') {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="items-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">Pagamento Bem-Sucedido!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Sua assinatura foi ativada. Você já pode aproveitar todos os recursos do seu novo plano.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">Ir para o Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    if (status === 'cancelled') {
         return (
            <Card className="w-full max-w-lg">
                <CardHeader className="items-center">
                    <XCircle className="h-16 w-16 text-red-500 mb-4" />
                    <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        O processo de pagamento foi cancelado. Você pode tentar novamente a qualquer momento.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/billing">Ver Planos</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center">
                <Loader2 className="h-16 w-16 text-muted-foreground animate-spin mb-4" />
                <CardTitle className="text-2xl">Processando...</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                    Aguarde enquanto processamos as informações da sua assinatura.
                </p>
            </CardContent>
        </Card>
    );
}


export default function BillingStatusPage() {
    return (
        <div className="flex items-center justify-center h-full">
            <Suspense fallback={<div>Carregando...</div>}>
                <BillingStatusContent />
            </Suspense>
        </div>
    )
}
