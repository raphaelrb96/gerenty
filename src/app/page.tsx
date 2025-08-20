
"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { XCircleIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BenefitCards } from "@/components/landing/BenefitCards";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* 1. Proposta de Valor Impactante */}
        <section className="w-full py-20 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Chega de apagar incêndios! Transforme sua loja em um negócio organizado e lucrativo.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Uma única plataforma para gerenciar vendas, estoque e finanças com total controle, de qualquer lugar.
                </p>
              </div>
              <motion.div
                className="flex flex-col gap-4 min-[400px]:flex-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                  <Link href="/auth/signup">Começar Agora de Graça</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#">Experimente sem Compromisso</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last bg-muted flex items-center justify-center shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-muted-foreground">Placeholder para Vídeo/GIF</span>
            </motion.div>
          </div>
        </section>

        {/* 2. Seção de Dor e Solução */}
        <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-2xl font-bold font-headline">Sua Realidade Hoje</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Perdeu uma venda por falta de estoque?</p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Passa horas em planilhas financeiras?</p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Se sente perdido com a bagunça dos pedidos?</p>
                </li>
              </ul>
            </div>
             <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-2xl font-bold font-headline">Sua Realidade com Enterprisy</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Estoque atualizado em tempo real.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Relatórios financeiros automáticos.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-card-foreground">Pedidos organizados em um só lugar.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Prova Social e Autoridade */}
        <section className="w-full py-20 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
              Quem já está transformando o negócio
            </h2>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl/relaxed mt-4">
              Veja o que nossos clientes satisfeitos dizem sobre os resultados que alcançaram.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-card text-left p-6">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="man portrait" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-card-foreground">Carlos N.</p>
                    <p className="text-sm text-muted-foreground">Loja de Roupas</p>
                  </div>
                </div>
                <p className="text-muted-foreground">"Enterprisy mudou a forma como gerencio meu estoque. Agora tenho tudo sob controle e perdi muito menos vendas."</p>
              </Card>
              <Card className="bg-card text-left p-6">
                <div className="flex items-center mb-4">
                   <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="woman portrait" />
                    <AvatarFallback>AM</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-card-foreground">Ana M.</p>
                    <p className="text-sm text-muted-foreground">Cafeteria</p>
                  </div>
                </div>
                <p className="text-muted-foreground">"Os relatórios financeiros automáticos me poupam horas de trabalho toda semana. Posso focar no que realmente importa: meus clientes!"</p>
              </Card>
               <Card className="bg-card text-left p-6">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="man glasses" />
                    <AvatarFallback>RP</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-card-foreground">Roberto P.</p>
                    <p className="text-sm text-muted-foreground">Loja de Eletrônicos</p>
                  </div>
                </div>
                <p className="text-muted-foreground">"A gestão de pedidos ficou muito mais simples. Agora consigo processar tudo rapidamente e manter meus clientes felizes."</p>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <p className="text-2xl font-bold text-foreground">Mais de <span className="text-primary">5.000 negócios</span> já usam Enterprisy para crescer</p>
              <p className="text-2xl font-bold text-foreground">Economize até <span className="text-primary">15 horas</span> por semana em gestão</p>
            </div>
          </div>
        </section>

        {/* 4. Seção de Funcionalidades como Benefícios */}
        <BenefitCards />

        {/* 5. Seção de Planos e Preços */}
        <Pricing />

        {/* 6. Seção de Perguntas Frequentes (FAQ) e Último CTA */}
        <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Perguntas Frequentes</h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl/relaxed mt-4">
                Encontre respostas para as dúvidas mais comuns sobre o Enterprisy.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto bg-card p-4 rounded-lg shadow-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger>Como funciona a cobrança?</AccordionTrigger>
                <AccordionContent>
                  A cobrança é mensal ou anual, dependendo do plano escolhido. Você pode cancelar a qualquer momento diretamente no seu painel de controle.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                <AccordionContent>
                  Sim, a segurança dos seus dados é nossa prioridade máxima. Utilizamos as melhores práticas e criptografia de ponta para garantir a proteção das suas informações.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Qual a diferença entre os planos?</AccordionTrigger>
                <AccordionContent>
                  Cada plano oferece diferentes níveis de recursos e limites, adaptados às necessidades de diferentes tamanhos de negócio. Consulte a seção de preços para uma comparação detalhada.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
             <div className="mt-16 text-center">
                <h3 className="text-2xl md:text-3xl font-bold font-headline">Pronto para decolar?</h3>
                <p className="text-muted-foreground mt-2">Experimente agora o Enterprisy e transforme seu negócio.</p>
                <Button asChild size="lg" className="mt-6" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                  <Link href="/auth/signup">Começar Agora de Graça</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
