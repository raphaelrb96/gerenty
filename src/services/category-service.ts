
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { ProductCategory } from "@/lib/types";

const categoriesCollection = collection(db, "categories");

// Get all categories for a specific company
export async function getCategoriesByCompany(companyId: string): Promise<ProductCategory[]> {
    try {
        const q = query(categoriesCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const categories: ProductCategory[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            categories.push({ 
                id: doc.id, 
                ...data,
            } as unknown as ProductCategory);
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
        
        return { id: categoryDoc.id, ...categoryDoc.data() } as unknown as ProductCategory;
    } catch (error) {
        console.error("Error getting category by ID: ", error);
        throw new Error("Failed to fetch category data.");
    }
}

// Add a new category
export async function addCategory(categoryData: Omit<ProductCategory, 'id'> & { companyId: string }): Promise<ProductCategory> {
    try {
        const docRef = await addDoc(categoriesCollection, {
            ...categoryData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newDocSnap = await getDoc(docRef);
        return { id: docRef.id, ...newDocSnap.data() } as unknown as ProductCategory;

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
