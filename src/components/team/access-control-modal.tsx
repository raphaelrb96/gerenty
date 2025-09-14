

"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Employee, Company } from "@/lib/types";


import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, KeyRound, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { useCompany as useCompanyContext } from "@/context/company-context";
import { usePermissions } from "@/context/permissions-context";


const formSchema = z.object({
    permissions: z.object({
        dashboard: z.boolean().default(true),
        products: z.boolean().default(false),
        orders: z.boolean().default(false),
        crm: z.boolean().default(false),
        financials: z.boolean().default(false),
        logistics: z.boolean().default(false),
        reports: z.boolean().default(false),
        team: z.boolean().default(false),
        settings: z.boolean().default(false),
    }),
    companyAccess: z.record(z.boolean()),
});

type FormValues = z.infer<typeof formSchema>;

type AccessControlModalProps = {
  isOpen: boolean;
  onClose: () => void;
  member: Employee | null;
};

const modulePermissions: { id: keyof FormValues['permissions'], label: string }[] = [
    { id: "dashboard", label: "Acesso ao Painel Principal" },
    { id: "products", label: "Gerenciar Produtos" },
    { id: "orders", label: "Gerenciar Pedidos" },
    { id: "crm", label: "Acessar CRM" },
    { id: "financials", label: "Visualizar Financeiro" },
    { id: "logistics", label: "Gerenciar Logística" },
    { id: "reports", label: "Acessar Relatórios" },
    { id: "team", label: "Gerenciar Equipe" },
    { id: "settings", label: "Configurações Avançadas" },
];


export function AccessControlModal({ isOpen, onClose, member }: AccessControlModalProps) {
  const { toast } = useToast();
  const { companies } = useCompanyContext();
  const { permissions, setPermission } = usePermissions();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        permissions: {
            dashboard: true,
        },
        companyAccess: {},
    },
  });

  const { watch, setValue } = form;

  useEffect(() => {
    if (member && permissions) {
        const memberPermissions = permissions[member.id] || {};
        form.reset({
            permissions: {
                ...memberPermissions.modules,
                dashboard: true, // Always true
            },
            companyAccess: memberPermissions.companies || {},
        });
    }
  }, [member, permissions, form, isOpen]);

  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  const watchedCompanyAccess = watch('companyAccess');
  const allCompaniesSelected = companies.length > 0 && companies.every(c => watchedCompanyAccess?.[c.id]);
  
  const handleSelectAllCompanies = (checked: boolean) => {
      companies.forEach(company => {
          setValue(`companyAccess.${company.id}`, checked, { shouldDirty: true });
      });
  };

  const watchedPermissions = watch('permissions');
  const allModulesSelected = modulePermissions.every(p => watchedPermissions?.[p.id]);

  const handleSelectAllModules = (checked: boolean) => {
      modulePermissions.forEach(permission => {
          if (permission.id !== 'dashboard') {
            setValue(`permissions.${permission.id}`, checked, { shouldDirty: true });
          }
      });
  };

  const onSubmit = async (values: FormValues) => {
    if (!member) return;
    setIsSaving(true);
    try {
        setPermission(member.id, {
            modules: values.permissions,
            companies: values.companyAccess,
        });

        toast({ title: "Permissões atualizadas!", description: `O acesso de ${member.name} foi modificado.` });
        handleClose();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar as permissões." });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Controle de Acesso</SheetTitle>
          <SheetDescription>
            Gerencie as permissões de acesso para <span className="font-bold">{member?.name}</span>.
          </SheetDescription>
        </SheetHeader>
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">Acesso às Empresas</h3>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="select-all-companies" 
                                        checked={allCompaniesSelected}
                                        onCheckedChange={(checked) => handleSelectAllCompanies(checked as boolean)}
                                    />
                                    <label htmlFor="select-all-companies" className="text-sm font-medium">Selecionar Todas</label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {companies.map((company) => (
                                    <FormField
                                        key={company.id}
                                        control={form.control}
                                        name={`companyAccess.${company.id}`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <FormLabel className="font-normal">{company.name}</FormLabel>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">Permissões de Módulos</h3>
                                <div className="flex items-center space-x-2">
                                     <Checkbox 
                                        id="select-all-modules" 
                                        checked={allModulesSelected}
                                        onCheckedChange={(checked) => handleSelectAllModules(checked as boolean)}
                                    />
                                    <label htmlFor="select-all-modules" className="text-sm font-medium">Selecionar Todas</label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {modulePermissions.map((permission) => (
                                     <FormField
                                        key={permission.id}
                                        control={form.control}
                                        name={`permissions.${permission.id}`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <FormLabel className="font-normal">{permission.label}</FormLabel>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={permission.id === 'dashboard'} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <SheetFooter className="px-6 py-4 border-t mt-auto">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Permissões
                </Button>
                </SheetFooter>
            </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
