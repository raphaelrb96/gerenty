
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { ProductCategory } from "@/lib/types";

const categoriesCollection = collection(db, "categories");

// Get all categories for a specific user
export async function getCategoriesByUser(ownerId: string): Promise<ProductCategory[]> {
    try {
        const q = query(categoriesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const categories: ProductCategory[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            categories.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            } as ProductCategory);
        });
        return categories;
    } catch (error) {
        console.error("Error getting categories: ", error);
        throw new Error("Failed to fetch categories.");
    }
}

// Get a single category by its ID
export async function getCategoryById(categoryId: string): Promise<ProductCategory | null> {
    try {
        const categoryDocRef = doc(db, "categories", categoryId);
        const categoryDoc = await getDoc(categoryDocRef);

        if (!categoryDoc.exists()) {
            console.warn(`No category found with id: ${categoryId}`);
            return null;
        }
        
        const data = categoryDoc.data();
        return { 
            id: categoryDoc.id, 
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as ProductCategory;
    } catch (error) {
        console.error("Error getting category by ID: ", error);
        throw new Error("Failed to fetch category data.");
    }
}

// Add a new category
export async function addCategory(categoryData: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'> & { ownerId: string }): Promise<ProductCategory> {
    try {
        const docRef = await addDoc(categoriesCollection, {
            ...categoryData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();
        return { 
            id: docRef.id, 
            ...newDocData,
            createdAt: newDocData?.createdAt?.toDate ? newDocData.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: newDocData?.updatedAt?.toDate ? newDocData.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as ProductCategory;

    } catch (error) {
        console.error("Error adding category: ", error);
        throw new Error("Failed to add category.");
    }
}

// Update an existing category
export async function updateCategory(categoryId: string, categoryData: Partial<Omit<ProductCategory, 'id'>>): Promise<void> {
    try {
        const categoryDoc = doc(db, "categories", categoryId);
        await updateDoc(categoryDoc, {
            ...categoryData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating category: ", error);
        throw new Error("Failed to update category.");
    }
}

// Delete a category
export async function deleteCategory(categoryId: string): Promise<void> {
    try {
        const categoryDoc = doc(db, "categories", categoryId);
        await deleteDoc(categoryDoc);
    } catch (error) {
        console.error("Error deleting category: ", error);
        throw new Error("Failed to delete category.");
    }
}
