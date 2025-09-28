
'use server';

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

type WhatsAppCredentials = {
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  metaAppSecret: string;
};

export async function saveWhatsAppCredentials(credentials: WhatsAppCredentials): Promise<any> {
    const functions = getFunctions(app);
    // Usando httpsCallable que gerencia a autenticação automaticamente
    const validateAndSave = httpsCallable(functions, 'whatsappValidateCredentials');
    
    try {
        const result = await validateAndSave(credentials);
        return result.data;
    } catch (error: any) {
        console.error("Error calling validateAndSaveCredentials function:", error);
        throw new Error(error.message || "A validação das credenciais falhou no servidor.");
    }
}

export async function sendTestMessage(idToken: string, testPhone: string): Promise<any> {
    // Usando fetch para a função onRequest, que requer o token no header.
    const functions = getFunctions(app);
    const region = functions.region || 'us-central1';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://${region}-${projectId}.cloudfunctions.net/whatsappSendTest`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testPhone })
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to send test message");
        }
        
        return data;

    } catch (error: any) {
        console.error("Error calling sendTestMessage function:", error);
        throw new Error(error.message || "O envio da mensagem de teste falhou.");
    }
}
