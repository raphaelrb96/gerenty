

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { getCategoriesByUser } from "@/services/category-service";
import type { ProductCategory } from "@/lib/types";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { PlusCircle, Pencil } from "lucide-react";

type CategorySelectorProps = {
    selectedCategories: string[] | undefined;
    onChange: (selected: string[]) => void;
};

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
    const { user, effectiveOwnerId } = useAuth();
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

    const fetchAndSetCategories = useCallback(async () => {
        if (effectiveOwnerId) {
            setLoading(true);
            try {
                const userCategories = await getCategoriesByUser(effectiveOwnerId);
                setCategories(userCategories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        }
    }, [effectiveOwnerId]);

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
                    renderAction={(option) => {
                        const category = categories.find(c => c.id === option.value);
                        if (!category) return null;
                        return (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto"
                                onClick={(e) => handleEdit(e, category)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )
                    }}
                 />
                 <Button type="button" variant="outline" size="sm" onClick={handleCreate} className="w-full mt-2">
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

    