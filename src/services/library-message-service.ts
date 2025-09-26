
'use server';

import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { LibraryMessage } from "@/lib/types";

const getLibraryMessagesCollection = (companyId: string) => collection(db, `companies/${companyId}/libraryMessages`);

const convertMessageTimestamps = (data: any): LibraryMessage => {
    const message = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (message[key]?.toDate) {
            message[key] = message[key].toDate().toISOString();
        }
    }
    return message as LibraryMessage;
};

export async function getLibraryMessagesByCompany(companyId: string): Promise<LibraryMessage[]> {
    try {
        const messagesCollection = getLibraryMessagesCollection(companyId);
        const q = query(messagesCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const messages: LibraryMessage[] = [];
        querySnapshot.forEach((doc) => {
            messages.push(convertMessageTimestamps({ id: doc.id, ...doc.data() }));
        });
        return messages.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    } catch (error) {
        console.error("Error getting library messages: ", error);
        throw new Error("Failed to fetch library messages.");
    }
}

export async function addLibraryMessage(companyId: string, messageData: Omit<LibraryMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryMessage> {
    try {
        const messagesCollection = getLibraryMessagesCollection(companyId);
        const docRef = await addDoc(messagesCollection, {
            ...messageData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        const newDocSnap = await getDoc(docRef);
        return convertMessageTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch (error) {
        console.error("Error adding library message: ", error);
        throw new Error("Failed to add library message.");
    }
}

export async function updateLibraryMessage(companyId: string, messageId: string, messageData: Partial<Omit<LibraryMessage, 'id'>>): Promise<void> {
    try {
        const messageDoc = doc(db, `companies/${companyId}/libraryMessages`, messageId);
        await updateDoc(messageDoc, {
            ...messageData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating library message: ", error);
        throw new Error("Failed to update library message.");
    }
}

export async function deleteLibraryMessage(companyId: string, messageId: string): Promise<void> {
    try {
        const messageDocRef = doc(db, `companies/${companyId}/libraryMessages`, messageId);
        const messageDoc = await getDoc(messageDocRef);

        if (messageDoc.exists()) {
            const message = messageDoc.data() as LibraryMessage;
            // If it's a media file stored in Firebase Storage, delete it
            if (message.type !== 'text' && message.content.includes('firebasestorage.googleapis.com')) {
                try {
                    const fileRef = ref(storage, message.content);
                    await deleteObject(fileRef);
                } catch (storageError: any) {
                    // Log error but don't block deletion if file doesn't exist
                    console.warn(`Could not delete storage file for ${messageId}:`, storageError.message);
                }
            }
        }
        await deleteDoc(messageDocRef);
    } catch (error) {
        console.error("Error deleting library message: ", error);
        throw new Error("Failed to delete library message.");
    }
}
