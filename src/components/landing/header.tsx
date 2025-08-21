
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "../theme-toggle";
import { LanguageToggle } from "../language-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { CurrencyToggle } from "../currency-toggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center">
        <div className="ml-4">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-between mr-4 space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Input de busca pode ser adicionado aqui */}
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <CurrencyToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t('landing.header.login')}</Link>
            </Button>
            <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
              <Link href="/auth/signup">{t('landing.header.signup')}</Link>
            </Button>
          </nav>
        </div>

        <div className="md:hidden flex items-center">
          <ThemeToggle />
          <LanguageToggle />
          <CurrencyToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-4 p-6">
                <Logo />

                <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="justify-center text-lg mt-4">
                  <Link href="/auth/login">{t('landing.header.login')}</Link>
                </Button>
                <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="justify-center text-lg">
                  <Link href="/auth/signup">{t('landing.header.signup')}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
