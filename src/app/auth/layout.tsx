
"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/i18n-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

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
    <div className="relative flex min-h-screen flex-col">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
        </div>
        <main className="flex-1">
            {children}
        </main>
    </div>
  );
}
