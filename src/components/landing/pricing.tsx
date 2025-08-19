import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small teams getting started.",
    features: ["10 Products", "100 Orders/month", "Basic Analytics"],
    cta: "Start for Free",
    href: "/signup",
    isFeatured: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For growing businesses that need more power.",
    features: ["Unlimited Products", "Unlimited Orders", "Advanced Analytics", "AI Description Credits"],
    cta: "Choose Pro",
    href: "/signup",
    isFeatured: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For large-scale operations with custom needs.",
    features: ["Everything in Pro", "Priority Support", "Custom Integrations", "Dedicated Account Manager"],
    cta: "Contact Us",
    href: "/contact",
    isFeatured: false,
  },
];

export function Pricing() {
  return (
    <section className="py-12 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold">
            Find the Perfect Plan
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Start for free and scale as you grow. No credit card required.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={tier.isFeatured ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="font-headline">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/ month</span>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={tier.isFeatured ? "default" : "outline"} style={tier.isFeatured ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : {}}>
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
