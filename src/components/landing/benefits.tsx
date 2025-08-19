import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Package, ShoppingCart, Bot } from "lucide-react";

const benefits = [
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Dashboard Intuitivo",
    description: "Visão clara do seu negócio com métricas e análises essenciais.",
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: "Gestão de Produtos",
    description: "Adicione, edite e organize seus produtos de forma simples e eficaz.",
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: "Controle de Pedidos",
    description: "Gerencie pedidos, atualize status e acompanhe seu funil de vendas.",
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "Descrições com IA",
    description: "Poupe tempo gerando descrições de produtos atraentes com nossa IA.",
  },
];

export function Benefits() {
  return (
    <section className="bg-secondary py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            Tudo o que Você Precisa para o Sucesso
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nossa plataforma foi projetada para otimizar seu fluxo de trabalho e impulsionar sua produtividade.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="text-center transform hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="items-center">
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