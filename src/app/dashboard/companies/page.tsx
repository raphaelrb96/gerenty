
"use client";

import { useCompany } from "@/context/company-context";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Building } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { EmptyState } from "@/components/common/empty-state";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function CompaniesPage() {
    const { companies } = useCompany();
    const { userData } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();

    const handleCreateCompany = () => {
        const companyLimit = userData?.plan?.limits?.companies ?? 1;
        
        if (companies.length >= companyLimit) {
            toast({
                variant: "destructive",
                title: "Limite de Empresas Atingido",
                description: "Você atingiu o limite de empresas para o seu plano atual. Considere fazer um upgrade.",
            });
        } else {
            router.push('/dashboard/companies/create');
        }
    };

    const isLimitReached = (userData?.plan?.limits?.companies ?? 1) <= companies.length;


    return (
        <div className="space-y-4">
            <PageHeader 
                title={t('companiesPage.title')}
                description={t('companiesPage.description')}
                action={
                    <Button onClick={handleCreateCompany} disabled={isLimitReached}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('companiesPage.createButton')}
                    </Button>
                }
            />

            {companies.length === 0 ? (
                <EmptyState
                    icon={<Building className="h-16 w-16" />}
                    title={t('companiesPage.empty.title')}
                    description={t('companiesPage.empty.description')}
                    action={
                         <Button onClick={handleCreateCompany} disabled={isLimitReached}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('companiesPage.empty.action')}
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {companies.map((company) => (
                         <Card key={company.id} className="overflow-hidden flex flex-col">
                            <CardHeader className="p-0 relative h-32">
                                 <Image 
                                    src={company.bannerUrl || "https://placehold.co/400x200.png"} 
                                    alt={`Banner for ${company.name}`} 
                                    layout="fill"
                                    objectFit="cover"
                                    className="w-full h-full" 
                                />
                            </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                 <div className="flex items-start gap-4">
                                    <div className="relative w-[64px] h-[64px] shrink-0 -mt-10">
                                        <Image 
                                            src={company.logoUrl || "https://placehold.co/64x64.png"} 
                                            alt={`Logo for ${company.name}`} 
                                            width={64} 
                                            height={64} 
                                            className="rounded-full w-full h-full border-4 border-background bg-background object-cover" 
                                        />
                                    </div>
                                    <div className="pt-1">
                                        <CardTitle className="text-lg">{company.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground break-all">{company.email}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/dashboard/companies/edit/${company.id}`}>
                                        {t('companiesPage.manageButton')}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
