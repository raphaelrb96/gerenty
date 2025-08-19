import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <h1 className="font-headline text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Simplify Your Business Operations Today
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground">
            Enterprisy Lite offers a suite of tools to manage your products,
            orders, and customer data with ease. Focus on growth, we'll handle
            the rest.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <Link href="/auth/signup">Get Started for Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="https://placehold.co/600x400.png"
            alt="Dashboard preview"
            width={600}
            height={400}
            className="rounded-lg shadow-2xl"
            data-ai-hint="dashboard analytics"
          />
        </div>
      </div>
    </section>
  );
}
