import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Gratuito",
    price: "R$0",
    priceDescription: "/mês",
    description: "Para indivíduos e pequenos times que estão começando.",
    features: ["10 Produtos", "100 Pedidos/mês", "Análises Básicas"],
    cta: "Comece de Graça",
    href: "/auth/signup",
    isFeatured: false,
  },
  {
    name: "Pro",
    price: "R$29",
    priceDescription: "/mês",
    description: "Para negócios em crescimento que precisam de mais poder.",
    features: ["Produtos Ilimitados", "Pedidos Ilimitados", "Análises Avançadas", "Créditos de IA"],
    cta: "Escolher o Pro",
    href: "/auth/signup",
    isFeatured: true,
  },
  {
    name: "Enterprise",
    price: "R$99",
    priceDescription: "/mês",
    description: "Para operações de larga escala com necessidades customizadas.",
    features: ["Tudo do Pro", "Suporte Prioritário", "Integrações Customizadas"],
    cta: "Fale Conosco",
    href: "/contact",
    isFeatured: false,
  },
];

export function Pricing() {
  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            Encontre o Plano Perfeito para Você
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece de graça e escale conforme cresce. Sem necessidade de cartão de crédito.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 items-center">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col h-full ${tier.isFeatured ? "border-primary shadow-2xl scale-105" : "border-border"}`}>
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                 <div className="flex items-baseline justify-center gap-2 mt-4">
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