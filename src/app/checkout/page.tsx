
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/context/i18n-context";
import { CreditCard, Lock } from "lucide-react";

export default function CheckoutPage() {
    const { t } = useTranslation();

    return (
        <div className="bg-muted/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
                        {t('checkout.title', {defaultValue: 'Finalize sua Compra'})}
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {t('checkout.subtitle', {defaultValue: 'Complete os detalhes abaixo para iniciar sua assinatura.'})}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('checkout.paymentDetails', {defaultValue: 'Detalhes do Pagamento'})}</CardTitle>
                                <CardDescription>{t('checkout.paymentDescription', {defaultValue: 'Insira as informações do seu cartão de crédito.'})}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="card-number">{t('checkout.cardNumber', {defaultValue: 'Número do Cartão'})}</Label>
                                    <div className="relative">
                                        <Input id="card-number" placeholder="0000 0000 0000 0000" />
                                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry-date">{t('checkout.expiryDate', {defaultValue: 'Data de Validade'})}</Label>
                                        <Input id="expiry-date" placeholder="MM / AA" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvc">{t('checkout.cvc', {defaultValue: 'CVC'})}</Label>
                                        <Input id="cvc" placeholder="123" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name-on-card">{t('checkout.nameOnCard', {defaultValue: 'Nome no Cartão'})}</Label>
                                    <Input id="name-on-card" placeholder="João da Silva" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('checkout.summary', {defaultValue: 'Resumo'})}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('landing.pricing.pro.name')}</span>
                                    <span className="font-semibold">R$29,00 / mês</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('orderDetails.total')}</span>
                                    <span>R$29,00</span>
                                </div>
                                <Button className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                                    <Lock className="mr-2 h-4 w-4" />
                                    {t('checkout.payButton', {defaultValue: 'Pagar com Segurança'})}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    {t('checkout.securityNote', {defaultValue: 'Pagamento seguro processado pela Stripe.'})}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
