
"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/landing/header';
import { useTranslation } from '@/context/i18n-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      toast({
        title: t('auth.loggedIn.title'),
        description: t('auth.loggedIn.description'),
      });
      router.push('/dashboard');
    }
  }, [user, loading, router, toast, t]);

  if (loading || user) {
    // Render a loading state or nothing while checking auth/redirecting
    return (
        <div className="flex min-h-screen items-center justify-center">
            {/* You can add a loader here if you want */}
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
            {children}
        </main>
    </div>
  );
}
