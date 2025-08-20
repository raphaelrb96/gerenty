
"use client";

import { Pricing } from "@/components/landing/pricing";
import { useTranslation } from "@/context/i18n-context";

export default function PlansPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-background">
      <div className="container py-12 md:py-24">
         <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            {t('landing.pricing.title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.pricing.subtitle')}
          </p>
        </div>
         <Pricing />
      </div>
    </div>
  );
}
