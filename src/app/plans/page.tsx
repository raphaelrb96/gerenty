
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/i18n-context";

export default function PlansPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-background">
      <div className="container py-12 md:py-24 flex flex-col items-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            {t('plans.title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('plans.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Grátis Plan Card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{t('plans.free.title')}</CardTitle>
              <CardDescription>{t('plans.free.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('plans.free.price')}</div>
              <ul className="mt-4 text-muted-foreground">
                <li>{t('plans.free.feature1')}</li>
                <li>{t('plans.free.feature2')}</li>
                <li>{t('plans.free.feature3')}</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">{t('plans.free.button')}</Button>
            </CardFooter>
          </Card>

          {/* Básico Plan Card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{t('plans.basic.title')}</CardTitle>
              <CardDescription>{t('plans.basic.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('plans.basic.price')}</div>
              <ul className="mt-4 text-muted-foreground">
                <li>{t('plans.basic.feature1')}</li>
                <li>{t('plans.basic.feature2')}</li>
                <li>{t('plans.basic.feature3')}</li>
                <li>{t('plans.basic.feature4')}</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">{t('plans.basic.button')}</Button>
            </CardFooter>
          </Card>

          {/* Pro Plan Card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{t('plans.pro.title')}</CardTitle>
              <CardDescription>{t('plans.pro.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('plans.pro.price')}</div>
              <ul className="mt-4 text-muted-foreground">
                <li>{t('plans.pro.feature1')}</li>
                <li>{t('plans.pro.feature2')}</li>
                <li>{t('plans.pro.feature3')}</li>
                <li>{t('plans.pro.feature4')}</li>
                <li>{t('plans.pro.feature5')}</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">{t('plans.pro.button')}</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
