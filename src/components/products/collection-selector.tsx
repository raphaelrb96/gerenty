

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { getCollectionsByUser } from "@/services/collection-service";
import type { ProductCollection } from "@/services/collection-service";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CollectionForm } from "./collection-form";
import { PlusCircle, Pencil } from "lucide-react";

type CollectionSelectorProps = {
    selectedCollections: string[] | undefined;
    onChange: (selected: string[]) => void;
};

export function CollectionSelector({ selectedCollections, onChange }: CollectionSelectorProps) {
    const { user, effectiveOwnerId } = useAuth();
    const [collections, setCollections] = useState<ProductCollection[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);

    const fetchAndSetCollections = useCallback(async () => {
        if (effectiveOwnerId) {
            setLoading(true);
            try {
                const userCollections = await getCollectionsByUser(effectiveOwnerId);
                setCollections(userCollections);
            } catch (error) {
                console.error("Failed to fetch collections", error);
            } finally {
                setLoading(false);
            }
        }
    }, [effectiveOwnerId]);

    useEffect(() => {
        fetchAndSetCollections();
    }, [fetchAndSetCollections]);

    const handleFormFinished = () => {
        setOpenModal(false);
        setEditingCollection(null);
        fetchAndSetCollections(); // Refresh list after add/edit
    };

    const handleEdit = (e: React.MouseEvent, collection: ProductCollection) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingCollection(collection);
        setOpenModal(true);
    };
    
    const handleCreate = () => {
        setEditingCollection(null);
        setOpenModal(true);
    }
    
    const collectionOptions = collections.map(c => ({ value: c.id, label: c.name }));

    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <div>
                 <MultiSelect
                    options={collectionOptions}
                    selected={selectedCollections || []}
                    onChange={onChange}
                    placeholder="Selecione as coleções..."
                    className="w-full"
                    disabled={loading}
                    renderAction={(option) => {
                        const collection = collections.find(c => c.id === option.value);
                        if (!collection) return null;
                        return (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto"
                                onClick={(e) => handleEdit(e, collection)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )
                    }}
                 />
                 <Button type="button" variant="outline" size="sm" onClick={handleCreate} className="w-full mt-2">
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Criar Nova Coleção
                 </Button>
            </div>
           
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCollection ? "Editar Coleção" : "Criar Nova Coleção"}</DialogTitle>
                </DialogHeader>
                <CollectionForm collection={editingCollection} onFinished={handleFormFinished} />
            </DialogContent>
        </Dialog>
    );
}

    