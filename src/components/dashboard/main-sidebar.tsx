

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
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
  MessageSquare,
  Bot,
  MessageCircle
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { signOut } from "@/services/auth-service";
import { useAuth } from "@/context/auth-context";
import { usePermissions } from "@/context/permissions-context";
import { useMemo } from "react";

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
    { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare, module: 'inbox' as const },
    { href: "/dashboard/automation", label: "Automação", icon: Bot, module: 'automation' as const },
    { href: "/dashboard/products", label: t("Products"), icon: Package, module: 'products' as const },
    { href: "/dashboard/orders", label: t("Orders"), icon: ShoppingCart, module: 'orders' as const },
    { href: "/dashboard/crm", label: "Clientes", icon: HeartHandshake, module: 'crm' as const },
    { href: "/dashboard/financials", label: "Financeiro", icon: TrendingUp, module: 'financials' as const },
    { href: "/dashboard/logistics", label: "Logística", icon: Truck, module: 'logistics' as const },
    { href: "/dashboard/reports", label: "Relatórios", icon: BarChart, module: 'reports' as const },
    { href: "/dashboard/team", label: "Equipe", icon: Users, module: 'team' as const },
    { href: "/dashboard/companies", label: t("companiesPage.sidebarTitle"), icon: Building, module: 'companies' as const },
    {
      href: "/dashboard/integrations", label: "Integrações", icon: Puzzle, module: 'integrations' as const,
      subItems: [
          { href: "/dashboard/integrations/whatsapp", label: "WhatsApp" },
      ]
    },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings, module: 'settings' as const },
  ];

  const filteredMenuItems = useMemo(() => {
    if (!userData) {
      return [];
    }
    // Company owner sees all items.
    if (userData.role === 'empresa') {
      return allMenuItems;
    }
    // Sub-accounts see only what they have access to.
    return allMenuItems.filter(item => {
        // The main dashboard page is always visible for any logged-in user.
        if (item.module === 'dashboard' || item.module === 'inbox' || item.module === 'automation') { // Allow new pages for all for now
            return true;
        }
        return hasAccess(item.module);
    });
  }, [userData, hasAccess, t, allMenuItems]);

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
                isActive={pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard")}
                tooltip={item.label}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
               {item.subItems && (
                <SidebarMenuSub>
                  {item.subItems.map(subItem => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)} onClick={handleLinkClick}>
                        <Link href={subItem.href}>
                            <MessageCircle />
                            <span>{subItem.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
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
