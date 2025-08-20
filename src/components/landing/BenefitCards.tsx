
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, BarChart, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";

export function BenefitCards() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary" />,
      title: "Menos Burocracia, Mais Lucro",
      description: "Otimize a gestão de pedidos, automatize tarefas e utilize um PDV integrado e eficiente para vender mais, mais rápido.",
      image: "https://placehold.co/400x300.png",
      imageHint: "pos interface"
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: "Controle Total nas Suas Mãos",
      description: "Tenha dashboards e relatórios financeiros detalhados para tomar decisões inteligentes e estratégicas para seu negócio.",
      image: "https://placehold.co/400x300.png",
      imageHint: "financial charts"
    },
    {
      icon: <Package className="h-10 w-10 text-primary" />,
      title: "Cresça sem Limites",
      description: "Gerencie suas vendas online e catálogos com integração total para e-commerce, expandindo seu alcance sem complicações.",
      image: "https://placehold.co/400x300.png",
      imageHint: "e-commerce products"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="w-full py-20 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Funcionalidades que Geram Resultados
          </h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Transforme funcionalidades em ganhos reais para o seu negócio.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full flex flex-col text-center shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
                <CardHeader className="flex flex-col items-center p-6 bg-card">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {benefit.icon}
                  </div>
                  <CardTitle className="font-headline text-xl font-bold">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between p-6 pt-0">
                    <p className="text-muted-foreground mb-6 flex-grow">{benefit.description}</p>
                    <div className="relative w-full h-48 bg-muted rounded-lg">
                        <Image 
                        src={benefit.image} 
                        alt={`${benefit.title} placeholder`} 
                        fill
                        className="w-full h-full object-cover rounded-lg"
                        data-ai-hint={benefit.imageHint}
                        />
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

    