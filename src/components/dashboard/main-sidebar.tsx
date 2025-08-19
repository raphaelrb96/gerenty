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
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";

export function MainSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems = [
    { href: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/products", label: t("Products"), icon: Package },
    { href: "/dashboard/orders", label: t("Orders"), icon: ShoppingCart },
    { href: "/dashboard/profile", label: t("Profile"), icon: User },
    { href: "/dashboard/preferences", label: t("Preferences"), icon: Settings },
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
                isActive={pathname === item.href}
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
              <SidebarMenuButton asChild tooltip={t("Logout")}>
                <Link href="/auth/login">
                  <LogOut />
                  <span>{t("Logout")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
