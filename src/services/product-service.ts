
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/types";

const productsCollection = collection(db, "products");

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
        const docRef = await addDoc(productsCollection, {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();
        return {
            id: docRef.id,
            ...newDocData,
        } as Product;

    } catch (error) {
        console.error("Error adding product: ", error);
        throw new Error("Failed to add product.");
    }
}

export async function getProducts(companyId: string): Promise<Product[]> {
    try {
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

export async function getProductById(productId: string): Promise<Product | null> {
    try {
        const productDocRef = doc(db, "products", productId);
        const productDoc = await getDoc(productDocRef);

        if (!productDoc.exists()) {
            console.warn(`No product found with id: ${productId}`);
            return null;
        }
        
        return { id: productDoc.id, ...productDoc.data() } as Product;
    } catch (error) {
        console.error("Error getting product by ID: ", error);
        throw new Error("Failed to fetch product data.");
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
