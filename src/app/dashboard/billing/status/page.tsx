
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

function BillingStatusContent() {
    const searchParams = useSearchParams();
    const urlStatus = searchParams.get('status');
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const [status, setStatus] = useState<'processing' | 'success' | 'cancelled'>(
      urlStatus === 'cancelled' ? 'cancelled' : 'processing'
    );

    useEffect(() => {
        if (!user || status === 'cancelled') return;

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            const userData = doc.data() as User;
            if (userData?.statusPlan === 'ativo' && userData.assignedDate) {
                const assignedDate = (userData.assignedDate as Timestamp).toDate();
                const now = new Date();
                const hoursDiff = Math.abs(now.getTime() - assignedDate.getTime()) / 36e5;

                // Check if the plan was assigned in the last 48 hours
                if (hoursDiff <= 48) {
                    setStatus('success');
                }
            }
        });

        // Cleanup subscription on unmount
        return () => unsub();

    }, [user, status]);


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
    
    // Default to processing
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
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
                <BillingStatusContent />
            </Suspense>
        </div>
    )
}
