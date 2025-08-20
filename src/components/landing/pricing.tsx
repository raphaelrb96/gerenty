"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";

export function Pricing() {
  const { t } = useTranslation();

  const tiers = [
    {
      name: t('landing.pricing.free.name'),
      price: t('landing.pricing.free.price'),
      priceDescription: t('landing.pricing.free.priceDescription'),
      description: t('landing.pricing.free.description'),
      features: t('landing.pricing.free.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.free.cta'),
      href: "/auth/signup",
      isFeatured: false,
    },
    {
      name: t('landing.pricing.pro.name'),
      price: t('landing.pricing.pro.price'),
      priceDescription: t('landing.pricing.pro.priceDescription'),
      description: t('landing.pricing.pro.description'),
      features: t('landing.pricing.pro.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      href: "/checkout",
      isFeatured: true,
    },
    {
      name: t('landing.pricing.enterprise.name'),
      price: t('landing.pricing.enterprise.price'),
      priceDescription: t('landing.pricing.enterprise.priceDescription'),
      description: t('landing.pricing.enterprise.description'),
      features: t('landing.pricing.enterprise.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.enterprise.cta'),
      href: "/checkout",
      isFeatured: false,
    }, // Corrected closing curly brace
  ];


  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            {t('landing.pricing.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.pricing.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-start">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col h-full ${tier.isFeatured ? "border-primary shadow-lg" : "border-border"}`}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                 <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.priceDescription}</span>
                </div>
                <CardDescription className="mt-2 h-12">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  asChild 
                  className="w-full" 
                  variant={tier.isFeatured ? "default" : "outline"} 
                  style={tier.isFeatured ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : {}}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
