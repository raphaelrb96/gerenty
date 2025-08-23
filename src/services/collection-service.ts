
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Assuming a simple structure for Collection for now.
// You can expand this in lib/types.ts if needed.
export type ProductCollection = {
    id: string;
    name: string;
    companyId: string;
    slug?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

const collectionsCollection = collection(db, "collections");

// Get all collections for a specific company
export async function getCollectionsByCompany(companyId: string): Promise<ProductCollection[]> {
    try {
        const q = query(collectionsCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const collections: ProductCollection[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            collections.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            } as ProductCollection);
        });
        return collections;
    } catch (error) {
        console.error("Error getting collections: ", error);
        throw new Error("Failed to fetch collections.");
    }
}


// Add a new collection
export async function addCollection(collectionData: Omit<ProductCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductCollection> {
    try {
        const docRef = await addDoc(collectionsCollection, {
            ...collectionData,
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
        } as ProductCollection;

    } catch (error) {
        console.error("Error adding collection: ", error);
        throw new Error("Failed to add collection.");
    }
}

// Update an existing collection
export async function updateCollection(collectionId: string, collectionData: Partial<Omit<ProductCollection, 'id'>>): Promise<void> {
    try {
        const collectionDoc = doc(db, "collections", collectionId);
        await updateDoc(collectionDoc, {
            ...collectionData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating collection: ", error);
        throw new Error("Failed to update collection.");
    }
}

// Delete a collection
export async function deleteCollection(collectionId: string): Promise<void> {
    try {
        const collectionDoc = doc(db, "collections", collectionId);
        await deleteDoc(collectionDoc);
    } catch (error) {
        console.error("Error deleting collection: ", error);
        throw new Error("Failed to delete collection.");
    }
}
