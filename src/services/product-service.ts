
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/types";

const productsCollection = collection(db, "products");

// The data passed here should match the Product type, omitting fields that are auto-generated.
export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
        const docRef = await addDoc(productsCollection, {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Construct the full product object to return, simulating the server-side timestamps.
        return { 
            id: docRef.id, 
            ...productData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        } as Product;
    } catch (error) {
        console.error("Error adding product: ", error);
        throw new Error("Failed to add product.");
    }
}

export async function getProducts(companyId: string): Promise<Product[]> {
    try {
        // Find products where the companyId is in the companyIds array
        const q = query(productsCollection, where("companyIds", "array-contains", companyId));
        const querySnapshot = await getDocs(q);
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() } as Product);
        });
        return products;
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Failed to fetch products.");
    }
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
    try {
        const productDoc = doc(db, "products", productId);
        await updateDoc(productDoc, {
            ...productData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating product: ", error);
        throw new Error("Failed to update product.");
    }
}

export async function deleteProduct(productId: string): Promise<void> {
    try {
        const productDoc = doc(db, "products", productId);
        await deleteDoc(productDoc);
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw new Error("Failed to delete product.");
    }
}
