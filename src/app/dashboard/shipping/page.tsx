
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, Search, Truck, CheckCircle } from "lucide-react";

// Mock data for shipping options
const mockShippingOptions = [
    { id: 'pac', name: 'Correios PAC', time: '8 dias úteis', cost: 25.50 },
    { id: 'sedex', name: 'Correios SEDEX', time: '3 dias úteis', cost: 45.70 },
    { id: 'jadlog', name: 'Jadlog .Package', time: '5 dias úteis', cost: 32.00 },
];

// Mock data for tracking status
const mockTrackingHistory = [
    { status: 'Objeto postado', location: 'Agência de Correios - São Paulo, SP', date: '20/07/2024 14:30' },
    { status: 'Objeto em trânsito', location: 'De Unidade de Tratamento, em INDAIATUBA - SP para Unidade de Tratamento, em RIO DE JANEIRO - RJ', date: '21/07/2024 09:15' },
    { status: 'Objeto saiu para entrega ao destinatário', location: 'Do Centro de Distribuição - Rio de Janeiro, RJ', date: '22/07/2024 08:00' },
];


export default function ShippingPage() {
    const [isCalculating, setIsCalculating] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [shippingOptions, setShippingOptions] = useState<typeof mockShippingOptions>([]);
    const [trackingHistory, setTrackingHistory] = useState<typeof mockTrackingHistory>([]);

    const handleCalculateShipping = () => {
        setIsCalculating(true);
        setTimeout(() => {
            setShippingOptions(mockShippingOptions);
            setIsCalculating(false);
        }, 1500);
    };

    const handleTrackPackage = () => {
        setIsTracking(true);
        setTimeout(() => {
            setTrackingHistory(mockTrackingHistory);
            setIsTracking(false);
        }, 1500);
    }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Módulo de Fretes"
        description="Calcule fretes, rastreie encomendas e gerencie suas entregas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Shipping Calculator Section */}
        <Card>
          <CardHeader>
            <CardTitle>Calcular Frete</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para obter as cotações de frete em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cep-origin">CEP de Origem</Label>
                    <Input id="cep-origin" placeholder="00000-000" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cep-dest">CEP de Destino</Label>
                    <Input id="cep-dest" placeholder="00000-000" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Dimensões e Peso</Label>
                <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Comprimento (cm)" />
                    <Input placeholder="Largura (cm)" />
                    <Input placeholder="Altura (cm)" />
                </div>
                 <Input placeholder="Peso (kg)" />
            </div>
            <Button onClick={handleCalculateShipping} disabled={isCalculating} className="w-full">
              {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calcular Frete
            </Button>
            {shippingOptions.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium">Opções de Frete</h4>
                    {shippingOptions.map(option => (
                        <div key={option.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div>
                                <p className="font-semibold">{option.name}</p>
                                <p className="text-sm text-muted-foreground">{option.time}</p>
                            </div>
                            <p className="font-bold text-lg">R$ {option.cost.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Package Tracker Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rastrear Encomenda</CardTitle>
            <CardDescription>
              Insira o código de rastreio para ver o status da entrega.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
                <Input placeholder="Insira o código de rastreio" className="flex-1" />
                <Button onClick={handleTrackPackage} disabled={isTracking} size="icon">
                    {isTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>

             {trackingHistory.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                     <h4 className="font-medium">Histórico de Rastreamento</h4>
                     <div className="relative pl-6">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border"></div>
                        {trackingHistory.map((event, index) => (
                             <div key={index} className="relative mb-6">
                                <div className="absolute -left-[23px] top-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                                </div>
                                <p className="font-semibold text-sm">{event.status}</p>
                                <p className="text-xs text-muted-foreground">{event.location}</p>
                                <p className="text-xs text-muted-foreground">{event.date}</p>
                            </div>
                        ))}
                     </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
