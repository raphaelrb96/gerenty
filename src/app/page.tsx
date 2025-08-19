import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Benefits />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
