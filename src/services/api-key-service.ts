
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import type { ApiKey } from "@/lib/types";
import { createHash } from 'crypto';

const apiKeysCollection = collection(db, "apiKeys");

function generateSecureKey(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'gerenty_live_';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function hashKey(key: string) {
    return createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(companyId: string, name: string, expiresAt: Date | undefined): Promise<{ plainTextKey: string; keyRecord: ApiKey }> {
    const plainTextKey = generateSecureKey();
    const keyHash = hashKey(plainTextKey);
    const keyPrefix = plainTextKey.substring(0, 15); // "gerenty_live_" + 4 chars

    const docRef = await addDoc(apiKeysCollection, {
        companyId,
        name,
        keyPrefix,
        keyHash,
        status: 'active',
        expiresAt: expiresAt ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
        lastUsedAt: null,
    });
    
    const newKeyRecord: ApiKey = {
        id: docRef.id,
        companyId,
        ownerId: '', // Should be added if needed
        name,
        keyPrefix,
        keyHash,
        status: 'active',
        expiresAt,
        createdAt: new Date(),
    };
    
    return { plainTextKey, keyRecord: newKeyRecord };
}


export async function getApiKeys(companyId: string): Promise<ApiKey[]> {
    try {
        const q = query(apiKeysCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const keys: ApiKey[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            keys.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString() : null,
                lastUsedAt: data.lastUsedAt?.toDate ? data.lastUsedAt.toDate().toISOString() : undefined,
            } as ApiKey);
        });
        return keys.sort((a,b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    } catch (error) {
        console.error("Error getting API keys:", error);
        throw new Error("Failed to fetch API keys.");
    }
}


export async function revokeApiKey(keyId: string): Promise<void> {
    try {
        const keyDoc = doc(db, "apiKeys", keyId);
        await updateDoc(keyDoc, {
            status: 'revoked',
        });
    } catch (error) {
        console.error("Error revoking API key:", error);
        throw new Error("Failed to revoke API key.");
    }
}
