
'use server';

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

type WhatsAppCredentials = {
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  metaAppSecret: string;
};

// Helper function to get the base URL for functions
const getFunctionsBaseUrl = () => {
    // This logic assumes you have your region and project ID set up.
    // Replace with your actual region and project ID if they are static.
    const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_REGION || 'us-central1';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
        console.error("Firebase Project ID is not set in environment variables.");
        return `https://us-central1-undefined.cloudfunctions.net`;
    }
    return `https://${region}-${projectId}.cloudfunctions.net`;
};

export async function saveWhatsAppCredentials(credentials: WhatsAppCredentials, idToken: string): Promise<any> {
    const url = `${getFunctionsBaseUrl()}/whatsappValidateCredentials`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ data: credentials }), // Emulating the onCall data wrapper
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error?.message || "A validação das credenciais falhou no servidor.");
        }
        
        return result.result; // Emulating the onCall result wrapper

    } catch (error: any) {
        console.error("Error calling validateAndSaveCredentials function:", error);
        throw new Error(error.message || "A validação das credenciais falhou no servidor.");
    }
}

export async function sendTestMessage(testPhone: string, idToken: string): Promise<any> {
    const url = `${getFunctionsBaseUrl()}/whatsappSendTest`;

    try {
         const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ data: { testPhone } }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || "O envio da mensagem de teste falhou.");
        }

        return result.result;
    } catch (error: any) {
        console.error("Error calling sendTestMessage function:", error);
        throw new Error(error.message || "O envio da mensagem de teste falhou.");
    }
}