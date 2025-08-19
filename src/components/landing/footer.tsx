
"use client";

import { Logo } from "@/components/logo";
import { useTranslation } from "@/context/i18n-context";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-between">
        <Logo className="text-sm" />
        <p className="text-sm text-muted-foreground">
          {t('landing.footer.copy', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
