
"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/context/i18n-context";

export default function PreferencesPage() {
    const { t } = useTranslation();
    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">{t('preferencesPage.title')}</h1>
                <p className="text-muted-foreground">
                    {t('preferencesPage.description')}
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('preferencesPage.appearance')}</CardTitle>
                    <CardDescription>
                        {t('preferencesPage.appearanceDesc')}
                    </CardDescription>
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
                </CardContent>
            </Card>
        </div>
    )
}
