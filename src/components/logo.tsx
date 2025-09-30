import Link from "next/link";
import Image from "next/image";
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
      <Image src="/favicon.svg" alt="Gerenty Logo" width={28} height={28} />
      <span className="font-headline text-2xl ml-1 font-bold">Gerenty</span>
    </Link>
  );
}
