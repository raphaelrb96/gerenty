"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Package, BarChart, ShoppingCart } from "lucide-react"; // Using relevant icons
import { useTranslation } from "@/context/i18n-context"; // Assuming you use translation
import { motion } from "framer-motion"; // For animations
import { useInView } from "react-intersection-observer"; // To trigger animations on scroll

export function BenefitCards() {
  const { t } = useTranslation(); // Assuming translation

  const benefits = [
    {
      icon: <Package className="h-12 w-12 text-primary" />, // Increased icon size
      title: "Cresça sem Limites", // Hardcoded for now, can use t() later
      description: "Gerencie suas vendas online e catálogos.", // Hardcoded for now
      videoPlaceholder: true, // Placeholder flag
    },
    {
      icon: <BarChart className="h-12 w-12 text-primary" />, // Increased icon size
      title: "Controle Total nas Suas Mãos", // Hardcoded for now
      description: "Tenha dashboards e relatórios financeiros detalhados.", // Hardcoded for now
      videoPlaceholder: true, // Placeholder flag
    },
    {
      icon: <ShoppingCart className="h-12 w-12 text-primary" />, // Increased icon size
      title: "Menos Burocracia, Mais Lucro", // Hardcoded for now
      description: "Otimize gestão de pedidos e utilize PDV integrado.", // Hardcoded for now
      videoPlaceholder: true, // Placeholder flag
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const [ref, inView] = useInView({
    triggerOnce: true, // Animation triggers only once
    threshold: 0.1, // Percentage of the element in view to trigger
  });

  return (
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            Funcionalidades que Geram Resultados
          </h2> {/* Example section title */}
          <p className="mt-4 text-lg text-muted-foreground">
            Veja como o Enterprisy pode transformar o seu dia a dia.
          </p> {/* Example section subtitle */}
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" // Responsive grid
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full flex flex-col"> {/* Ensure cards have equal height */}
                <CardHeader className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"> {/* Larger circle */}
                    {benefit.icon}
                  </div>
                  <CardTitle className="font-headline text-xl font-bold">{benefit.title}</CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">{benefit.description}</CardDescription>
                </CardHeader>
                {benefit.videoPlaceholder && (
                  <CardContent className="flex-grow flex items-center justify-center"> {/* Placeholder area */}
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-md">
                      <p className="text-sm text-gray-500">Placeholder para Vídeo</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}