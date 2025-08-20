
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, BarChart2, Users } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { motion } from "framer-motion";

export function BenefitCards() {
  const { t } = useTranslation();

  const features = [
    { icon: <Package size={40} className="text-primary" />, title: t('landing.features.feature1.title'), description: t('landing.features.feature1.description') },
    { icon: <BarChart2 size={40} className="text-primary" />, title: t('landing.features.feature2.title'), description: t('landing.features.feature2.description') },
    { icon: <Users size={40} className="text-primary" />, title: t('landing.features.feature3.title'), description: t('landing.features.feature3.description') },
  ];

  return (
    <section id="funcionalidades" className="bg-muted/40 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">{t('landing.features.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="p-8 rounded-lg shadow-lg border text-center transition-transform transform hover:scale-105 hover:shadow-2xl h-full">
                  <div className="mb-4 flex justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
