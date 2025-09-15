
"use client";

import { useAuth } from '@/context/auth-context';
import { usePermissions } from '@/context/permissions-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../common/loading-spinner';

// Mapeamento de rotas para os módulos de permissão correspondentes
const protectedRoutes: Record<string, keyof ReturnType<typeof usePermissions>['hasAccess']['__function'>> = {
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
    if (authLoading) {
      return; // Aguarda a autenticação e os dados do usuário serem carregados
    }

    // 1. Redireciona para login se não estiver autenticado
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // 2. Se for sub-conta, verifica permissões de rota
    if (userData && userData.role !== 'empresa') {
        // Encontra a rota base (ex: /dashboard/products/edit/123 -> /dashboard/products)
        const baseRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));

        if (baseRoute) {
            const requiredModule = protectedRoutes[baseRoute];
            if (!hasAccess(requiredModule)) {
                // Redireciona se não tiver acesso
                router.push('/dashboard');
            }
        }
    }

  }, [user, userData, authLoading, router, pathname, hasAccess]);


  if (authLoading || !user || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Verifica novamente o acesso antes de renderizar (dupla camada de segurança)
  const baseRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route));
  if (baseRoute && userData.role !== 'empresa' && !hasAccess(protectedRoutes[baseRoute])) {
      // Enquanto o redirecionamento acontece, não renderiza nada para evitar flash de conteúdo
      return null;
  }

  return <>{children}</>;
};
