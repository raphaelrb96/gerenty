
'use server';

import { functions } from 'firebase-functions';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

type WhatsAppCredentials = {
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  metaAppSecret: string;
};

export async function saveWhatsAppCredentials(idToken: string, credentials: WhatsAppCredentials): Promise<any> {
    const functions = getFunctions(app);
    const validateAndSave = httpsCallable(functions, 'whatsappValidateCredentials');
    
    try {
        const result = await validateAndSave(credentials, {
             headers: { Authorization: `Bearer ${idToken}` }
        });
        return result.data;
    } catch (error: any) {
        console.error("Error calling validateAndSaveCredentials function:", error);
        throw new Error(error.message || "A validação das credenciais falhou no servidor.");
    }
}

export async function sendTestMessage(idToken: string, testPhone: string): Promise<any> {
    const functions = getFunctions(app);
    const sendTest = httpsCallable(functions, 'whatsappSendTest');
    
    try {
         const result = await sendTest({ testPhone }, {
             headers: { Authorization: `Bearer ${idToken}` }
         });
        return result.data;
    } catch (error: any) {
        console.error("Error calling sendTestMessage function:", error);
        throw new Error(error.message || "O envio da mensagem de teste falhou.");
    }
}
