
"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { signOut } from "@/services/auth-service";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Badge } from "@/components/ui/badge";
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const getStatusVariant = (status: string | undefined) => {
    switch (status) {
        case 'ativo':
            return 'bg-green-600/20 text-green-700 hover:bg-green-600/30';
        case 'pendente':
            return 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30';
        case 'inativo':
        default:
            return 'bg-red-600/20 text-red-700 hover:bg-red-600/30';
    }
  };

    const daysUntilExpiry = userData?.validityDate
    ? differenceInCalendarDays(parseISO(userData.validityDate as string), new Date())
    : null;
    
    const isCompanyOwner = userData?.role === 'empresa';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('profilePage.title')}</h1>
        <p className="text-muted-foreground">
          {t('profilePage.description')}
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('profilePage.personalInfo')}</CardTitle>
                    <CardDescription>{t('profilePage.personalInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('preferencesPage.title')}</CardTitle>
                    <CardDescription>{t('preferencesPage.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label>{t('preferencesPage.theme')}</Label>
                        <ThemeToggle />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label>{t('preferencesPage.language')}</Label>
                        <LanguageToggle />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label>{t('preferencesPage.currency')}</Label>
                        <CurrencyToggle />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleLogout}>{t('Logout')}</Button>
                </CardFooter>
            </Card>
        </div>

        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>
                {t('profilePage.subscription.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
             <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('profilePage.subscription.status')}</p>
                <Badge className={getStatusVariant(userData?.statusPlan)}>{userData?.statusPlan || 'inativo'}</Badge>
            </div>
             <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('profilePage.subscription.currentPlan')}</p>
                <p className="font-semibold">{userData?.plan?.name || "Nenhum"}</p>
            </div>

            {userData?.statusPlan === 'ativo' && (
                <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">
                        {daysUntilExpiry !== null ? t('profilePage.subscription.daysRemaining') : t('profilePage.subscription.validity')}
                    </p>
                    <p className={cn("font-bold text-lg", daysUntilExpiry !== null && daysUntilExpiry < 7 && "text-destructive")}>
                        {daysUntilExpiry !== null ? `${daysUntilExpiry} dias` : t('dashboard.accountCards.lifetime')}
                    </p>
                </div>
            )}
             <p className="text-xs text-muted-foreground pt-2">
                {userData?.statusPlan === 'ativo' && userData.validityDate ? t('profilePage.subscription.renewalDate', {date: new Date(userData?.validityDate as any).toLocaleDateString()}) : t('profilePage.subscription.inactiveText')}
            </p>
          </CardContent>
           {isCompanyOwner && (
            <CardFooter className="border-t pt-4">
              <Button onClick={() => router.push('/dashboard/billing')} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="w-full">
                  {t('profilePage.manageButton')}
              </Button>
            </CardFooter>
           )}
        </Card>
      </div>
    </div>
  );
}
