
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { signOut } from "@/services/auth-service";
import { SquareTerminal, UserCircle } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex-1">
        {/* Can add breadcrumbs or page title here */}
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/dashboard/pos">
              <SquareTerminal className="mr-2 h-4 w-4" />
              Frente de Caixa
            </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback>
                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('My Account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">{t('Profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>{t('Support')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              {t('Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
