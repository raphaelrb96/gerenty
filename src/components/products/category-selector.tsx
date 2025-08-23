
"use client";

import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/context/company-context";
import { getCategoriesByCompany } from "@/services/category-service";
import type { ProductCategory } from "@/lib/types";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { PlusCircle, Pencil } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "../ui/command";

type CategorySelectorProps = {
    selectedCategories: string[] | undefined;
    onChange: (selected: string[]) => void;
};

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
    const { activeCompany } = useCompany();
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

    const fetchAndSetCategories = useCallback(async () => {
        if (activeCompany) {
            setLoading(true);
            try {
                const companyCategories = await getCategoriesByCompany(activeCompany.id);
                setCategories(companyCategories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        }
    }, [activeCompany]);

    useEffect(() => {
        fetchAndSetCategories();
    }, [fetchAndSetCategories]);

    const handleFormFinished = () => {
        setOpenModal(false);
        setEditingCategory(null);
        fetchAndSetCategories(); // Refresh list after add/edit
    };

    const handleEdit = (e: React.MouseEvent, category: ProductCategory) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingCategory(category);
        setOpenModal(true);
    };
    
    const handleCreate = () => {
        setEditingCategory(null);
        setOpenModal(true);
    }
    
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <div>
                 <MultiSelect
                    options={categoryOptions}
                    selected={selectedCategories || []}
                    onChange={onChange}
                    placeholder="Selecione as categorias..."
                    className="w-full"
                    disabled={loading}
                 />
                 <Button type="button" variant="link" onClick={handleCreate} className="p-0 h-auto mt-2 text-sm">
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Criar Nova Categoria
                 </Button>
            </div>
           
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCategory ? "Editar Categoria" : "Criar Nova Categoria"}</DialogTitle>
                </DialogHeader>
                <CategoryForm category={editingCategory} onFinished={handleFormFinished} />
            </DialogContent>
        </Dialog>
    );
}
