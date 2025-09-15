
"use client";

import { useAuth } from '@/context/auth-context';
import { usePermissions } from '@/context/permissions-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '../common/loading-spinner';

// Definindo o tipo para as chaves de permissão do módulo
type ModulePermissionKey = 'products' | 'orders' | 'crm' | 'financials' | 'logistics' | 'reports' | 'team' | 'settings' | 'integrations' | 'companies' | 'billing';

// Mapeamento de rotas para os módulos de permissão correspondentes
const protectedRoutes: Record<string, ModulePermissionKey> = {
  '/dashboard/products': 'products',
  '/dashboard/orders': 'orders',
  '/dashboard/crm': 'crm',
  '/dashboard/financials': 'financials',
  '/dashboard/logistics': 'logistics',
  '/dashboard/reports': 'reports',
  '/dashboard/team': 'team',
  '/dashboard/settings': 'settings',
  '/dashboard/integrations': 'integrations',
  '/dashboard/companies': 'companies',
  '/dashboard/billing': 'billing',
};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading: authLoading } = useAuth();
  const { hasAccess } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        router.push('/auth/login');
      }
      return; 
    }
    
    // Se for sub-conta, verifica permissões de rota
    if (userData && userData.role !== 'empresa') {
        const baseRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));

        if (baseRoute) {
            const requiredModule = protectedRoutes[baseRoute];
            if (requiredModule && !hasAccess(requiredModule)) {
                // Redireciona se não tiver acesso
                router.push('/dashboard');
            }
        }
    }

  }, [user, userData, authLoading, router, pathname, hasAccess]);


  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Fallback de segurança: se o useEffect ainda não redirecionou, não renderiza o conteúdo
  if (userData && userData.role !== 'empresa') {
    const baseRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));
    if (baseRoute) {
        const requiredModule = protectedRoutes[baseRoute];
        if (requiredModule && !hasAccess(requiredModule)) {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <LoadingSpinner />
                </div>
            );
        }
    }
  }


  return <>{children}</>;
};
