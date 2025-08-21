
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BenefitCards } from "@/components/landing/BenefitCards";
import Image from "next/image";
import { useTranslation } from "@/context/i18n-context";

export default function Home() {
  const { t } = useTranslation();

  const testimonials = [
    { quote: t('landing.testimonials.quote1'), author: t('landing.testimonials.author1') },
    { quote: t('landing.testimonials.quote2'), author: t('landing.testimonials.author2') },
    { quote: t('landing.testimonials.quote3'), author: t('landing.testimonials.author3') },
  ];

  const faqs = [
    { question: t('landing.faq.question1'), answer: t('landing.faq.answer1') },
    { question: t('landing.faq.question2'), answer: t('landing.faq.answer2') },
    { question: t('landing.faq.question3'), answer: t('landing.faq.answer3') },
    { question: t('landing.faq.question4'), answer: t('landing.faq.answer4') },
    { question: t('landing.faq.question5'), answer: t('landing.faq.answer5') },
    { question: t('landing.faq.question6'), answer: t('landing.faq.answer6') },
  ];

  const logos = [
    { src: "https://placehold.co/120x40/E5E7EB/9CA3AF?text=Loja+ABC", alt: "Loja ABC" },
    { src: "https://placehold.co/120x40/E5E7EB/9CA3AF?text=Moda+Online", alt: "Moda Online" },
    { src: "https://placehold.co/120x40/E5E7EB/9CA3AF?text=Tech+Gadgets", alt: "Tech Gadgets" },
    { src: "https://placehold.co/120x40/E5E7EB/9CA3AF?text=Artesanato", alt: "Artesanato" },
    { src: "https://placehold.co/120x40/E5E7EB/9CA3AF?text=Pet+Shop", alt: "Pet Shop" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 ">
        {/* 1. Proposta de Valor Impactante */}
        <section className="w-full py-20 md:py-24 lg:py-32">
          <div className="px-4 md:px-6">
            <div className="mx-auto max-w-7xl text-center">
              <motion.h1 
                className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {t('landing.hero.title.line1')} <span className="mt-2 block text-primary sm:inline-block">{t('landing.hero.title.line2')}</span>
              </motion.h1>
              <motion.p 
                className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                {t('landing.hero.subtitle')}
              </motion.p>
              <motion.div 
                className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              >
                <Button asChild size="lg" className="transform transition-transform hover:scale-105" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                  <Link href="/auth/signup">{t('landing.hero.ctaPrimary')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="transform transition-transform hover:scale-105">
                  <Link href="#planos">{t('landing.hero.ctaSecondary')}</Link>
                </Button>
              </motion.div>
              <motion.div 
                className="mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-xl bg-muted shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              >
                <div className="aspect-video flex items-center justify-center">
                  <Image src="https://placehold.co/1280x720.png" alt={t('landing.hero.videoAlt')} width={1280} height={720} className="object-cover" data-ai-hint="dashboard analytics" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. Prova Social e Autoridade */}
        <section className="bg-muted/40 py-16">
          <div className=" px-4 md:px-6">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">{t('landing.socialProof.title')}</h2>
              <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                {testimonials.map((t, index) => (
                  <Card key={index} className="border p-6 text-left shadow-md">
                    <CardContent className="p-0">
                      <p className="mb-4 italic text-muted-foreground">"{t.quote}"</p>
                      <p className="font-semibold text-foreground">- {t.author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="mb-4 text-sm font-semibold tracking-widest text-muted-foreground">{t('landing.socialProof.subtitle')}</p>
              <div className="hidden flex-wrap items-center justify-center gap-6 opacity-70">
                {logos.map((logo, index) => (
                  <Image key={index} src={logo.src} alt={logo.alt} width={120} height={40} className="mx-auto" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Seção de Dor e Solução */}
        <section className="py-16 md:py-24">
          <div className=" px-8 md:px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-center">
                <h2 className="mb-2 text-3xl font-bold sm:text-4xl">{t('landing.painSolution.title')}</h2>
                <p className="text-xl text-muted-foreground">{t('landing.painSolution.subtitle')}</p>
              </div>
              <div className="max-w-screen-md grid mx-auto items-start gap-12 md:grid-cols-2">
                <div className="space-y-6">
                  <h3 className="mb-4 text-2xl font-bold text-destructive">{t('landing.painSolution.realityToday')}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-destructive p-3 text-destructive-foreground"><X size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.pain1')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                     <div className="flex-shrink-0 rounded-full bg-destructive p-3 text-destructive-foreground"><X size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.pain2')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-destructive p-3 text-destructive-foreground"><X size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.pain3')}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="mb-4 text-2xl font-bold text-green-500">{t('landing.painSolution.realityWithEnterprisy')}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-green-500 p-3 text-white"><Check size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.solution1')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-green-500 p-3 text-white"><Check size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.solution2')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-green-500 p-3 text-white"><Check size={24} /></div>
                    <p className="text-lg">{t('landing.painSolution.solution3')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Funcionalidades como Benefícios */}
        <BenefitCards />

        {/* 5. Seção de Planos e Preços */}
        <div id="planos">
          <Pricing />
        </div>

        {/* 6. Seção de Perguntas Frequentes (FAQ) */}
        <section className="bg-muted/40 py-16 md:py-24">
          <div className=" px-6 md:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold sm:text-4xl">{t('landing.faq.title')}</h2>
                <p className="text-lg text-muted-foreground">{t('landing.faq.subtitle')}</p>
              </div>
              <Accordion type="multiple" className="mx-auto max-w-3xl">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b">
                    <AccordionTrigger className="w-full justify-between py-4 text-left text-lg font-semibold hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="py-2 text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* 7. Último CTA */}
        <section className="py-16 text-center">
          <div className=" px-4 md:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t('landing.finalCta.title')}</h2>
              <p className="mb-8 text-xl text-muted-foreground">{t('landing.finalCta.subtitle')}</p>
              <Button asChild size="lg" className="transform transition-transform hover:scale-105" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/auth/signup">
                  {t('landing.finalCta.cta')} <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
