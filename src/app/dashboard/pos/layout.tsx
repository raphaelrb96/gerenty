
"use client";

import { CompanyProvider } from "@/context/company-context";

// Este layout se aplica apenas à rota /dashboard/pos
export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <div className="bg-muted/40">{children}</div>
    </CompanyProvider>
  );
}
