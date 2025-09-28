
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

const functions = getFunctions(app, 'us-central1');

const validateCredentials = httpsCallable(functions, 'whatsappValidateCredentials');
const testMessage = httpsCallable(functions, 'whatsappSendTest');

export async function saveWhatsAppCredentials(credentials: WhatsAppCredentials): Promise<any> {
    try {
        const result = await validateCredentials(credentials);
        return result.data;
    } catch (error: any) {
        console.error("Error calling validateAndSaveCredentials function:", error);
        throw new Error(error.message || "A validação das credenciais falhou no servidor.");
    }
}

export async function sendTestMessage(testPhone: string): Promise<any> {
    try {
        const result = await testMessage({ testPhone });
        return result.data;
    } catch (error: any) {
        console.error("Error calling sendTestMessage function:", error);
        throw new Error(error.message || "O envio da mensagem de teste falhou.");
    }
}
