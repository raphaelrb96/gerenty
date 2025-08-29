
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck } from "lucide-react";

export default function LogisticsPage() {
    return (
        <div className="space-y-4">
            <PageHeader 
                title="Logística e Entregas"
                description="Gerencie suas rotas e acompanhe o status das entregas."
            />

            <Tabs defaultValue="processing">
                <TabsList>
                    <TabsTrigger value="processing">A Processar</TabsTrigger>
                    <TabsTrigger value="in_transit">Em Trânsito</TabsTrigger>
                    <TabsTrigger value="delivered">Entregue</TabsTrigger>
                    <TabsTrigger value="others">Outros</TabsTrigger>
                </TabsList>

                <TabsContent value="processing" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rotas a Processar</CardTitle>
                            <CardDescription>Rotas que foram criadas mas ainda não saíram para entrega.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-[40vh] border-2 border-dashed rounded-lg">
                                <div className="text-center text-muted-foreground">
                                    <Truck className="mx-auto h-12 w-12 mb-4" />
                                    <p>Nenhuma rota a processar no momento.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="in_transit" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Rotas em Trânsito</CardTitle>
                            <CardDescription>Rotas que já saíram para entrega e estão em andamento.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-[40vh] border-2 border-dashed rounded-lg">
                                <div className="text-center text-muted-foreground">
                                    <Truck className="mx-auto h-12 w-12 mb-4 animate-pulse" />
                                    <p>Nenhuma rota em trânsito no momento.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="delivered" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Rotas Entregues</CardTitle>
                            <CardDescription>Histórico de rotas que já foram concluídas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-[40vh] border-2 border-dashed rounded-lg">
                                 <div className="text-center text-muted-foreground">
                                    <Truck className="mx-auto h-12 w-12 mb-4" />
                                    <p>Nenhuma rota entregue recentemente.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="others" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Outras Rotas</CardTitle>
                            <CardDescription>Rotas com status diversos, como canceladas ou com problemas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-[40vh] border-2 border-dashed rounded-lg">
                                 <div className="text-center text-muted-foreground">
                                    <Truck className="mx-auto h-12 w-12 mb-4" />
                                    <p>Nenhuma rota com outros status.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
