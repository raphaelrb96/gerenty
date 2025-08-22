
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/context/currency-context";

export default function BillingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const tiers = [
     {
      id: "bronze",
      name: t('landing.pricing.bronze.name'),
      price: 14,
      priceSuffix: t('landing.pricing.bronze.priceSuffix'),
      description: t('landing.pricing.bronze.description'),
      features: t('landing.pricing.bronze.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      isFeatured: true,
    },
    {
      id: "silver",
      name: t('landing.pricing.silver.name'),
      price: 28,
      priceSuffix: t('landing.pricing.silver.priceSuffix'),
      description: t('landing.pricing.silver.description'),
      features: t('landing.pricing.silver.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      isFeatured: false,
    },
    {
      id: "gold",
      name: t('landing.pricing.gold.name'),
      price: 47,
      priceSuffix: t('landing.pricing.gold.priceSuffix'),
      description: t('landing.pricing.gold.description'),
      features: t('landing.pricing.gold.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      isFeatured: false,
    },
    {
      id: "premium",
      name: t('landing.pricing.premium.name'),
      price: 79,
      priceSuffix: t('landing.pricing.premium.priceSuffix'),
      description: t('landing.pricing.premium.description'),
      features: t('landing.pricing.premium.features', { returnObjects: true }) as unknown as string[],
      cta: t('landing.pricing.enterprise.cta'),
      isFeatured: false,
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
        toast({
            title: t('billingPage.authError.title'),
            description: t('billingPage.authError.description'),
            variant: "destructive",
        });
        return;
    }

    setLoadingPlanId(planId);

    // Simulate calling a Cloud Function to get a Stripe Checkout URL
    console.log(`User ${user.uid} is subscribing to plan ${planId}`);
    
    // In a real app, this would be an async call to your backend:
    // const { url } = await createStripeCheckoutSession({ userId: user.uid, planId });
    // window.location.href = url;

    // For this prototype, we'll simulate a delay and redirect to a status page
    setTimeout(() => {
        // This is where you would redirect to the Stripe URL.
        // For now, we redirect to a success page.
        router.push('/dashboard/billing/status?status=success');
        setLoadingPlanId(null);
    }, 2000);
  };


  return (
    <div className="space-y-8">
        <div>
            <h1 className="font-headline text-3xl font-bold">{t('billingPage.title')}</h1>
            <p className="text-muted-foreground">
                {t('billingPage.description')}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {tiers.map((tier) => (
            <Card key={tier.id} className={`flex flex-col h-full ${tier.isFeatured ? "border-primary shadow-lg" : "border-border"}`}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                 <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-bold">{formatCurrency(tier.price)}</span>
                    <span className="text-muted-foreground">{tier.priceSuffix}</span>
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
                  onClick={() => handleSubscribe(tier.id)}
                  className="w-full" 
                  variant={tier.isFeatured ? "default" : "outline"} 
                  style={tier.isFeatured ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : {}}
                  disabled={loadingPlanId === tier.id}
                >
                  {loadingPlanId === tier.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
    </div>
  );
}
