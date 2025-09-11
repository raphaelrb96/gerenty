"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  CreditCard,
  Building,
  Users,
  Truck,
  HeartHandshake,
  BarChart,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { signOut } from "@/services/auth-service";

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const menuItems = [
    { href: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/products", label: t("Products"), icon: Package },
    { href: "/dashboard/orders", label: t("Orders"), icon: ShoppingCart },
    { href: "/dashboard/crm", label: "CRM", icon: HeartHandshake },
    { href: "/dashboard/logistics", label: "Logística", icon: Truck },
    { href: "/dashboard/reports", label: "Relatórios", icon: BarChart },
    { href: "/dashboard/team", label: "Equipe", icon: Users },
    { href: "/dashboard/billing", label: t("Billing"), icon: CreditCard },
    { href: "/dashboard/companies", label: t("companiesPage.sidebarTitle"), icon: Building },
    { href: "/dashboard/profile", label: t("Profile"), icon: User },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
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
                onClick={handleLinkClick}
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
              <SidebarMenuButton onClick={() => { handleLogout(); handleLinkClick(); }} tooltip={t("Logout")}>
                  <LogOut />
                  <span>{t("Logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
