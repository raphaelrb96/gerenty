"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRightIcon } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { XCircleIcon, CheckCircleIcon } from "lucide-react"; // Import icons

import Link from "next/link";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BenefitCards } from "@/components/landing/BenefitCards"; // Import BenefitCards
import { useInView } from "framer-motion";
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6 grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Chega de apagar incêndios! Transforme sua loja em um negócio organizado e lucrativo.</h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">Uma única plataforma para gerenciar vendas, estoque e finanças com total controle, de qualquer lugar.</p>
              </div>
              <motion.div className="flex flex-col gap-2 min-[400px]:flex-row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Button asChild>
                  <Link href="#">Começar Agora de Graça</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="#">Experimente sem Compromisso</Link>
                </Button>
              </motion.div>
            </div>
            <div className="aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              {/* Placeholder for Video/GIF */}
              <span className="text-gray-500 dark:text-gray-400">Placeholder para Vídeo/GIF</span>
            </div>
          </div>
        </section>

        {/* Seção de Dor e Solução */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Sua Realidade Hoje</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Perdeu uma venda por falta de estoque?</p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Passa horas em planilhas financeiras?</p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Se sente perdido com a bagunça dos pedidos?</p>
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Sua Realidade com Enterprisy</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Estoque atualizado em tempo real</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Relatórios financeiros automáticos</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">Pedidos organizados em um só lugar.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Seção de Prova Social e Autoridade */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Quem já está transformando o negócio com Enterprisy</h2>
            <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mt-4">
              Veja o que nossos clientes satisfeitos dizem sobre a Enterprisy e os resultados que alcançaram.
            </p>

            {/* Depoimentos Placeholder */}
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg text-left">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Carlos N.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loja de Roupas</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">"Enterprisy mudou a forma como gerencio meu estoque. Agora tenho tudo sob controle e perdi muito menos vendas."</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg text-left">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>AM</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Ana M.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cafeteria</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">"Os relatórios financeiros automáticos me poupam horas de trabalho toda semana. Posso focar no que realmente importa: meus clientes!"</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg text-left">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>RP</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Roberto P.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loja de Eletrônicos</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">"A gestão de pedidos ficou muito mais simples. Agora consigo processar tudo rapidamente e manter meus clientes felizes."</p>
              </div>
            </div>

            {/* Logos e Estatísticas Placeholder */}
            <div className="mt-12 space-y-8">
              <div className="flex flex-wrap justify-center gap-8">
                {/* Placeholder for Customer Logos */}
                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded">Logo Cliente 1</div>
                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded">Logo Cliente 2</div>
                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded">Logo Cliente 3</div>
                {/* Add more logo placeholders as needed */}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mais de <span className="text-primary">5.000 negócios</span> já usam Enterprisy para crescer</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Economize até <span className="text-primary">15 horas</span> por semana em gestão</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Funcionalidades como Benefícios */}
        <BenefitCards />

        {/* Seção de Planos e Preços - Já refatorada em Pricing.tsx */}
        <Pricing />

        {/* Seção de Perguntas Frequentes (FAQ) e Último CTA */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Perguntas Frequentes</h2>
              <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mt-4">
                Encontre respostas para as dúvidas mais comuns sobre o Enterprisy.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
              <AccordionItem value="item-1">
                <AccordionTrigger>Como funciona a cobrança?</AccordionTrigger>
                <AccordionContent>
                  A cobrança é mensal ou anual, dependendo do plano escolhido. Você pode cancelar a qualquer momento.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                <AccordionContent>
                  Sim, utilizamos as melhores práticas de segurança para garantir a proteção dos seus dados.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Qual a diferença entre os planos?</AccordionTrigger>
                <AccordionContent>
                  Cada plano oferece diferentes níveis de recursos e funcionalidades, adaptados às necessidades de diferentes tamanhos de negócio. Consulte a seção de preços para detalhes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
