
"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { XCircleIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BenefitCards } from "@/components/landing/BenefitCards";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* 1. Proposta de Valor Impactante */}
        <section className="w-full py-20 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div 
              className="flex flex-col justify-center space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Chega de apagar incêndios! Transforme sua loja em um negócio organizado e lucrativo.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Uma única plataforma para gerenciar vendas, estoque e finanças com total controle, de qualquer lugar.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                  <Link href="/auth/signup">Começar Agora de Graça</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#pricing">Ver Planos</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              className="relative aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last flex items-center justify-center shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
               <Image
                src="https://placehold.co/600x400.png"
                alt="Dashboard preview"
                fill
                className="object-cover rounded-lg shadow-2xl transform transition-transform duration-300"
                data-ai-hint="dashboard analytics"
              />
            </motion.div>
          </div>
        </section>

        {/* 2. Seção de Dor e Solução */}
        <section className="w-full py-20 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
             <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Sua Realidade Hoje vs. Seu Futuro com o Enterprisy</h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl/relaxed mt-4">
               Entendemos seus desafios e construímos a solução definitiva.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 items-start">
              <Card className="space-y-6 p-6 shadow-sm border-destructive/50">
                <h3 className="text-2xl font-bold font-headline flex items-center gap-3"><XCircleIcon className="w-8 h-8 text-destructive flex-shrink-0" /> Sua Realidade Hoje</h3>
                <ul className="space-y-4 text-lg text-muted-foreground pl-4 list-disc list-inside">
                  <li>Perder vendas por falta de estoque?</li>
                  <li>Passar horas em planilhas financeiras?</li>
                  <li>Se sentir perdido com a bagunça dos pedidos?</li>
                </ul>
              </Card>
              <Card className="space-y-6 p-6 shadow-lg border-primary/50 bg-card">
                <h3 className="text-2xl font-bold font-headline flex items-center gap-3"><CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" /> Sua Realidade com Enterprisy</h3>
                <ul className="space-y-4 text-lg pl-4 list-disc list-inside">
                  <li>Estoque atualizado em tempo real.</li>
                  <li>Relatórios financeiros automáticos.</li>
                  <li>Pedidos organizados em um só lugar.</li>
                </ul>
              </Card>
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
              <Card className="bg-card text-left p-6 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col h-full">
                    <p className="text-muted-foreground flex-grow">"Enterprisy mudou a forma como gerencio meu estoque. Agora tenho tudo sob controle e perdi muito menos vendas."</p>
                    <div className="flex items-center mt-4 pt-4 border-t">
                      <Avatar>
                        <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="man portrait" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-semibold text-card-foreground">Carlos N.</p>
                        <p className="text-sm text-muted-foreground">Loja de Roupas</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
              <Card className="bg-card text-left p-6 shadow-sm hover:shadow-md transition-shadow">
                 <CardContent className="p-0 flex flex-col h-full">
                    <p className="text-muted-foreground flex-grow">"Os relatórios financeiros automáticos me poupam horas de trabalho toda semana. Posso focar no que realmente importa: meus clientes!"</p>
                    <div className="flex items-center mt-4 pt-4 border-t">
                       <Avatar>
                        <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="woman portrait" />
                        <AvatarFallback>AM</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-semibold text-card-foreground">Ana M.</p>
                        <p className="text-sm text-muted-foreground">Cafeteria</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
               <Card className="bg-card text-left p-6 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col h-full">
                    <p className="text-muted-foreground flex-grow">"A gestão de pedidos ficou muito mais simples. Agora consigo processar tudo rapidamente e manter meus clientes felizes."</p>
                    <div className="flex items-center mt-4 pt-4 border-t">
                      <Avatar>
                        <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="man glasses" />
                        <AvatarFallback>RP</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="font-semibold text-card-foreground">Roberto P.</p>
                        <p className="text-sm text-muted-foreground">Loja de Eletrônicos</p>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <p className="text-2xl font-bold text-foreground">Mais de <span className="text-primary">5.000 negócios</span> já usam Enterprisy para crescer</p>
              <p className="text-xl text-muted-foreground mt-2">Economize até <span className="font-bold text-primary">15 horas</span> por semana em gestão</p>
            </div>
          </div>
        </section>

        {/* 4. Seção de Funcionalidades como Benefícios */}
        <BenefitCards />

        {/* 5. Seção de Planos e Preços */}
        <div id="pricing">
         <Pricing />
        </div>

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
                <AccordionTrigger className="text-lg">Como funciona a cobrança?</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  A cobrança é mensal ou anual, dependendo do plano escolhido. Você pode cancelar a qualquer momento diretamente no seu painel de controle.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg">Meus dados estão seguros?</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  Sim, a segurança dos seus dados é nossa prioridade máxima. Utilizamos as melhores práticas e criptografia de ponta para garantir a proteção das suas informações.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg">Qual a diferença entre os planos?</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  Cada plano oferece diferentes níveis de recursos e limites, adaptados às necessidades de diferentes tamanhos de negócio. Consulte a seção de preços para uma comparação detalhada.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
             <div className="mt-16 text-center">
                <h3 className="text-2xl md:text-3xl font-bold font-headline">Pronto para decolar?</h3>
                <p className="text-muted-foreground md:text-xl mt-2">Experimente agora o Enterprisy e transforme seu negócio.</p>
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
