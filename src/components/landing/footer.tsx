import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-between">
        <Logo className="text-sm" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Enterprisy Lite. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
