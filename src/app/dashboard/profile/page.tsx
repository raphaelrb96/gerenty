
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

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('profilePage.title')}</h1>
        <p className="text-muted-foreground">
          {t('profilePage.description')}
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
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
            <CardTitle>{t('profilePage.subscription')}</CardTitle>
            <CardDescription>
              {t('profilePage.currentPlan')}{" "}
              <strong>{t('profilePage.proPlan')}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('profilePage.renewal')}</p>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              {t('profilePage.manageButton')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
