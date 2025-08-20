
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";

export function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const tiers = [
     {
      name: t('landing.pricing.premium.name'),
      price: 89,
      priceSuffix: t('landing.pricing.premium.priceSuffix'),
      description: t('landing.pricing.premium.description'),
      features: t('landing.pricing.premium.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.enterprise.cta'),
      href: user ? "/dashboard/billing" : "/auth/signup",
      isPopular: true,
    },
    {
        name: t('landing.pricing.gold.name'),
        price: 57,
        priceSuffix: t('landing.pricing.gold.priceSuffix'),
        description: t('landing.pricing.gold.description'),
        features: t('landing.pricing.gold.features', { returnObjects: true }) as unknown as string[],
        cta: t('landing.pricing.pro.cta'),
        href: user ? "/dashboard/billing" : "/auth/signup",
        isPopular: false,
    },
    {
        name: t('landing.pricing.silver.name'),
        price: 26,
        priceSuffix: t('landing.pricing.silver.priceSuffix'),
        description: t('landing.pricing.silver.description'),
        features: t('landing.pricing.silver.features', { returnObjects: true }) as unknown as string[],
        cta: t('landing.pricing.pro.cta'),
        href: user ? "/dashboard/billing" : "/auth/signup",
        isPopular: false,
    },
    {
      name: t('landing.pricing.bronze.name'),
      price: 14,
      priceSuffix: t('landing.pricing.bronze.priceSuffix'),
      description: t('landing.pricing.bronze.description'),
      features: t('landing.pricing.bronze.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      href: user ? "/dashboard/billing" : "/auth/signup",
      isPopular: false,
    },
    {
      name: t('landing.pricing.free.name'),
      price: 0,
      priceSuffix: t('landing.pricing.free.priceSuffix'),
      description: t('landing.pricing.free.description'),
      features: t('landing.pricing.free.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.free.cta'),
      href: "/auth/signup",
      isPopular: false,
    },
  ];

  const handleCtaClick = (href: string) => {
    router.push(href);
  };


  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            {t('landing.pricing.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.pricing.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start justify-center max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col h-full rounded-xl shadow-lg border-2 ${tier.isPopular ? "border-primary" : "border-border"}`}>
               {tier.isPopular && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full inline-block mb-4 -mt-4 mx-auto">
                    {t('landing.pricing.mostPopular')}
                  </div>
                )}
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                <CardDescription className="mt-2 h-12">{tier.description}</CardDescription>
                 <div className="flex items-baseline justify-center gap-2 mt-4">
                    <span className="text-4xl font-bold">{tier.price > 0 ? formatCurrency(tier.price) : t('landing.pricing.free.price')}</span>
                     {tier.price > 0 && <span className="text-muted-foreground">{tier.priceSuffix}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-left">
                  {(tier.features as string[]).map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleCtaClick(tier.href)}
                  className="w-full transform hover:scale-105 transition-transform" 
                  variant={tier.isPopular ? "default" : "outline"} 
                  style={tier.isPopular ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : {}}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
