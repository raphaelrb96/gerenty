
import { Header } from "@/components/dashboard/header";
import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex w-full min-h-screen bg-muted/40">
          <MainSidebar />
          <SidebarInset>
            <Header />
            <main className="flex-1">
              <div className="w-full p-6 md:p-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
