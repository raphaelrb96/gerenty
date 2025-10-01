
import { Header } from "@/components/dashboard/header";
import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CompanyProvider } from "@/context/company-context";
import { PermissionsProvider } from "@/context/permissions-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <PermissionsProvider>
        <ProtectedRoute>
          <SidebarProvider>
            <div className="flex w-full min-h-screen bg-muted/40">
              <MainSidebar />
              <SidebarInset>
                <div className="flex flex-col h-screen">
                  <Header />
                  <main className="flex-1 overflow-y-auto">
                    <div className="w-full h-full p-6 md:p-8">
                      {children}
                    </div>
                  </main>
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ProtectedRoute>
      </PermissionsProvider>
    </CompanyProvider>
  );
}
