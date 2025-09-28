
'use server';

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { WhatsAppIntegration } from "@/lib/types";
import { randomBytes } from 'crypto';

// This is a placeholder. In a real application, this would be encrypted and stored securely,
// likely using a dedicated secret management service.
const mockEncrypt = (text: string) => `encrypted_${text}`;
const mockDecrypt = (text: string) => text.replace('encrypted_', '');

function generateWebhookUrl(companyId: string): string {
    // In a real app, this would be your Cloud Function's HTTPS trigger URL
    return `https://your-cloud-function-region-your-project.cloudfunctions.net/whatsAppWebhook/${companyId}`;
}

function generateVerifyToken(): string {
    return randomBytes(16).toString('hex');
}

export async function getWhatsAppIntegration(companyId: string): Promise<WhatsAppIntegration | null> {
    const docRef = doc(db, `companies/${companyId}/integrations`, "whatsapp");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            accessToken: mockDecrypt(data.accessToken), // Decrypt for use
             createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as WhatsAppIntegration;
    }
    return null;
}

export async function saveWhatsAppCredentials(companyId: string, credentials: { wabaId: string, phoneId: string, accessToken: string }): Promise<void> {
    const docRef = doc(db, `companies/${companyId}/integrations`, "whatsapp");
    const existingData = await getWhatsAppIntegration(companyId);

    const dataToSave: Partial<WhatsAppIntegration> = {
        companyId,
        wabaId: credentials.wabaId,
        phoneId: credentials.phoneId,
        accessToken: mockEncrypt(credentials.accessToken),
        status: 'pending_validation', // The validation will be done by a Cloud Function
        webhookUrl: existingData?.webhookUrl || generateWebhookUrl(companyId),
        webhookVerifyToken: existingData?.webhookVerifyToken || generateVerifyToken(),
        updatedAt: serverTimestamp(),
    };

    try {
        await setDoc(docRef, { ...dataToSave, createdAt: existingData?.createdAt || serverTimestamp() }, { merge: true });

        // In a real scenario, you would trigger a Cloud Function here to validate the credentials.
        // For this prototype, we'll simulate a successful validation after a delay.
        setTimeout(async () => {
            await setDoc(docRef, { status: 'connected', lastError: null }, { merge: true });
        }, 3000);

    } catch (error) {
        console.error("Error saving WhatsApp credentials:", error);
        await setDoc(docRef, { status: 'error', lastError: "Failed to save credentials to database." }, { merge: true });
        throw new Error("Failed to save credentials.");
    }
}
