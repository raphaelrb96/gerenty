
"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/i18n-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Logo } from '@/components/logo';

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
    return (
        <div className="flex min-h-screen items-center justify-center">
            {/* You can add a loader here if you want */}
        </div>
    );
  }

  return (
    <div className="relative grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 lg:right-6 lg:top-6">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="hidden bg-accent p-12 text-accent-foreground lg:flex flex-col justify-between">
          <Logo href="/" className="text-accent-foreground hover:text-accent-foreground/80" />
          <div className="mb-24">
            <h2 className="font-headline text-3xl font-bold">{t('authLayout.headline')}</h2>
            <p className="mt-2 text-lg text-accent-foreground/80">{t('authLayout.tagline')}</p>
          </div>
          <footer className="text-sm text-accent-foreground/60">
             {t('landing.footer.copy', { year: new Date().getFullYear() })}
          </footer>
      </div>
      <main className="flex items-center justify-center p-6 lg:p-8">
          {children}
      </main>
    </div>
  );
}
