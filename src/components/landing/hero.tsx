import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Simplifique a Gestão do seu Negócio
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl">
              Enterprisy Lite oferece as ferramentas que você precisa para gerenciar produtos, pedidos e clientes com facilidade. Foque no crescimento, nós cuidamos do resto.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/auth/signup">Começar Gratuitamente</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">Ver o Dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://placehold.co/600x400.png"
              alt="Dashboard preview"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              data-ai-hint="dashboard analytics"
            />
          </div>
        </div>
      </div>
    </section>
  );
}