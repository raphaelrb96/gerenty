
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/types";

const productsCollection = collection(db, "products");

const convertProductTimestamps = (product: any) => {
    return {
        ...product,
        createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: product.updatedAt?.toDate ? product.updatedAt.toDate().toISOString() : new Date().toISOString(),
        publishedAt: product.publishedAt?.toDate ? product.publishedAt.toDate().toISOString() : undefined,
    };
};


export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
        const docRef = await addDoc(productsCollection, {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        // Now, update the document with its own ID
        await updateDoc(docRef, { id: docRef.id });

        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();
        return convertProductTimestamps({
            id: docRef.id,
            ...newDocData,
        }) as Product;

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
            products.push(convertProductTimestamps({ id: doc.id, ...doc.data() }) as Product);
        });
        return products;
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Failed to fetch products.");
    }
}

export async function getProductsByUser(ownerId: string): Promise<Product[]> {
    try {
        const q = query(productsCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
            products.push(convertProductTimestamps({ id: doc.id, ...doc.data() }) as Product);
        });
        return products;
    } catch (error) {
        console.error("Error getting products by user: ", error);
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
        
        return convertProductTimestamps({ id: productDoc.id, ...productDoc.data() }) as Product;
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
            id: productId, // Ensure the ID is persisted on update as well
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
