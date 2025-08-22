
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  PlusCircle,
  CreditCard,
  Building,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { signOut } from "@/services/auth-service";

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const menuItems = [
    { href: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/products", label: t("Products"), icon: Package },
    { href: "/dashboard/orders", label: t("Orders"), icon: ShoppingCart },
    { href: "/dashboard/pos", label: "PDV", icon: PlusCircle },
    { href: "/dashboard/billing", label: t("Billing"), icon: CreditCard },
    { href: "/dashboard/companies", label: "Empresas", icon: Building },
    { href: "/dashboard/profile", label: t("Profile"), icon: User },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && item.href !== "/dashboard" ? pathname.startsWith(item.href) : pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={t("Logout")}>
                  <LogOut />
                  <span>{t("Logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
