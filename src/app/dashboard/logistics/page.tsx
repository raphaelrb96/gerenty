
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, PlusCircle, User, Box, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { getRoutes, Route } from "@/services/logistics-service";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { RouteForm } from "@/components/logistics/route-form";
import { useCurrency } from "@/context/currency-context";


export default function LogisticsPage() {
    const { user } = useAuth();
    const { formatCurrency } = useCurrency();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    const fetchRoutes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userRoutes = await getRoutes(user.uid);
            setRoutes(userRoutes);
        } catch (error) {
            console.error("Failed to fetch routes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRoutes();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleFormFinished = () => {
        setCreateModalOpen(false);
        fetchRoutes(); // Refresh routes after creation
    };

    const handleViewDetails = (route: Route) => {
        setSelectedRoute(route);
        // Open details modal here in the future
    };

    const routesByStatus = (status: Route['status']) => routes.filter(r => r.status === status);

    const renderRouteList = (status: Route['status']) => {
        const filteredRoutes = routesByStatus(status);
        
        if (loading) {
            return <LoadingSpinner />;
        }

        if (filteredRoutes.length === 0) {
            return (
                <div className="flex items-center justify-center h-[40vh] border-2 border-dashed rounded-lg">
                    <div className="text-center text-muted-foreground">
                        <Truck className="mx-auto h-12 w-12 mb-4" />
                        <p>Nenhuma rota com este status no momento.</p>
                    </div>
                </div>
            )
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRoutes.map((route) => (
                    <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(route)}>
                        <CardHeader>
                            <CardTitle>Rota #{route.id.substring(0, 7)}</CardTitle>
                            <CardDescription>Criada em: {new Date(route.createdAt as string).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                           <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{route.driverName}</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                <span>{route.orders.length} entrega(s)</span>
                           </div>
                        </CardContent>
                         <CardFooter className="flex justify-between items-center text-sm font-semibold">
                            <span>Total da Rota</span>
                            <span>{formatCurrency(route.totalValue)}</span>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <PageHeader 
                title="Logística e Entregas"
                description="Gerencie suas rotas e acompanhe o status das entregas."
                action={
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Rota
                    </Button>
                }
            />

            <Tabs defaultValue="A Processar">
                <TabsList>
                    <TabsTrigger value="A Processar">A Processar</TabsTrigger>
                    <TabsTrigger value="Em Trânsito">Em Trânsito</TabsTrigger>
                    <TabsTrigger value="Entregue">Entregue</TabsTrigger>
                    <TabsTrigger value="Outro">Outros</TabsTrigger>
                </TabsList>

                <TabsContent value="A Processar" className="mt-4">
                    {renderRouteList("A Processar")}
                </TabsContent>
                <TabsContent value="Em Trânsito" className="mt-4">
                    {renderRouteList("Em Trânsito")}
                </TabsContent>
                <TabsContent value="Entregue" className="mt-4">
                    {renderRouteList("Entregue")}
                </TabsContent>
                 <TabsContent value="Outro" className="mt-4">
                    {renderRouteList("Outro")}
                </TabsContent>
            </Tabs>

            <Sheet open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <SheetContent className="sm:max-w-xl flex flex-col">
                    <SheetHeader className="px-6 pt-6">
                        <SheetTitle>Criar Nova Rota</SheetTitle>
                    </SheetHeader>
                    <RouteForm onFinished={handleFormFinished} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
