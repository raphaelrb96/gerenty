
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
  DollarSign,
  Puzzle,
  TrendingUp,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { signOut } from "@/services/auth-service";
import { useAuth } from "@/context/auth-context";
import { usePermissions } from "@/context/permissions-context";

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user, userData } = useAuth();
  const { hasAccess } = usePermissions();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const allMenuItems = [
    { href: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard, module: 'dashboard' as const },
    { href: "/dashboard/products", label: t("Products"), icon: Package, module: 'products' as const },
    { href: "/dashboard/orders", label: t("Orders"), icon: ShoppingCart, module: 'orders' as const },
    { href: "/dashboard/crm", label: "CRM", icon: HeartHandshake, module: 'crm' as const },
    { href: "/dashboard/financials", label: "Financeiro", icon: TrendingUp, module: 'financials' as const },
    { href: "/dashboard/logistics", label: "Logística", icon: Truck, module: 'logistics' as const },
    { href: "/dashboard/reports", label: "Relatórios", icon: BarChart, module: 'reports' as const },
    { href: "/dashboard/team", label: "Equipe", icon: Users, module: 'team' as const },
    { href: "/dashboard/companies", label: t("companiesPage.sidebarTitle"), icon: Building, module: 'companies' as const },
    { href: "/dashboard/integrations", label: "Integrações", icon: Puzzle, module: 'integrations' as const },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings, module: 'settings' as const },
  ];

  const getFilteredMenuItems = () => {
    if (!user || !userData) {
      return [];
    }
    // If the user is the company owner, show all items.
    if (userData.role === 'empresa') {
      return allMenuItems;
    }

    // For sub-accounts, filter based on permissions.
    return allMenuItems.filter(item => {
      // The main dashboard page is always visible to logged-in users.
      if (item.href === '/dashboard') {
        return true;
      }
      // For all other modules, check for access permission.
      return hasAccess(user.uid, item.module);
    });
  }

  const filteredMenuItems = getFilteredMenuItems();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredMenuItems.map((item) => (
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
