
"use client";

import { Logo } from "@/components/logo";
import { useTranslation } from "@/context/i18n-context";
import Link from "next/link";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="w-full border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <Logo />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            {t('landing.footer.copy', { year: new Date().getFullYear() })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('landing.footer.terms')}
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t('landing.footer.privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
