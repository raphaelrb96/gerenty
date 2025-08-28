import Link from "next/link";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-foreground transition-colors hover:text-primary",
        className
      )}
    >
      <Building2 className="h-6 w-6" />
      <span className="font-headline text-2xl ml-1 font-bold">Gerenty</span>
    </Link>
  );
}
