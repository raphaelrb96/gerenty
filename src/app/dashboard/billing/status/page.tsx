
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useTranslation } from '@/context/i18n-context';

function BillingStatusContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const { t } = useTranslation();

    if (status === 'success') {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="items-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">{t('billingStatus.success.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        {t('billingStatus.success.description')}
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">{t('billingStatus.success.cta')}</Link>
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
                    <CardTitle className="text-2xl">{t('billingStatus.cancelled.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                       {t('billingStatus.cancelled.description')}
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/billing">{t('billingStatus.cancelled.cta')}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="items-center">
                <Loader2 className="h-16 w-16 text-muted-foreground animate-spin mb-4" />
                <CardTitle className="text-2xl">{t('billingStatus.processing.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                    {t('billingStatus.processing.description')}
                </p>
            </CardContent>
        </Card>
    );
}


export default function BillingStatusPage() {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center h-full">
            <Suspense fallback={<div>{t('Loading')}...</div>}>
                <BillingStatusContent />
            </Suspense>
        </div>
    )
}
