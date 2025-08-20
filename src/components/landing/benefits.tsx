
"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Package, ShoppingCart, Bot } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";

export function Benefits() {
  const { t } = useTranslation();

  const benefitsList = [
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: t('landing.benefits.benefit1.title'),
      description: t('landing.benefits.benefit1.description'),
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: t('landing.benefits.benefit2.title'),
      description: t('landing.benefits.benefit2.description'),
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      title: t('landing.benefits.benefit3.title'),
      description: t('landing.benefits.benefit3.description'),
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: t('landing.benefits.benefit4.title'),
      description: t('landing.benefits.benefit4.description'),
    },
  ];

  return (
    <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            {t('landing.benefits.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.benefits.subtitle')}
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefitsList.map((benefit) => (
            <Card key={benefit.title} className="text-center transform hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="items-center p-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  {benefit.icon}
                </div>
                <CardTitle className="font-headline text-xl">{benefit.title}</CardTitle>
                <CardDescription className="mt-2">{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
