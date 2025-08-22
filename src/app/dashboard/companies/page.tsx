
"use client";

import { useCompany } from "@/context/company-context";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";

export default function CompaniesPage() {
    const { companies } = useCompany();

    return (
        <div className="space-y-4">
            <PageHeader 
                title="Minhas Empresas"
                description="Gerencie suas empresas ou adicione uma nova."
                action={
                    <Button asChild>
                        <Link href="/dashboard/companies/create">
                            <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Empresa
                        </Link>
                    </Button>
                }
            />

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
                                <Image 
                                    src={company.logoUrl || "https://placehold.co/64x64.png"} 
                                    alt={`Logo for ${company.name}`} 
                                    width={64} 
                                    height={64} 
                                    className="rounded-full border-2 border-background -mt-10 bg-background" 
                                />
                                <div className="pt-1">
                                    <CardTitle className="text-lg">{company.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{company.email}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/companies/edit/${company.id}`}>
                                    Gerenciar Empresa
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
