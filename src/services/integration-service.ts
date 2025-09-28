
'use server';

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

type WhatsAppCredentials = {
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  metaAppSecret: string;
};

export async function saveWhatsAppCredentials(credentials: WhatsAppCredentials): Promise<any> {
    const functions = getFunctions(app);
    const validateAndSave = httpsCallable(functions, 'whatsappValidateCredentials');
    
    try {
        // O SDK do Firebase gerencia a autenticação automaticamente com onCall
        const result = await validateAndSave(credentials);
        return result.data;
    } catch (error: any) {
        console.error("Error calling validateAndSaveCredentials function:", error);
        throw new Error(error.message || "A validação das credenciais falhou no servidor.");
    }
}

export async function sendTestMessage(testPhone: string): Promise<any> {
    const functions = getFunctions(app);
    // Alterado para onCall para consistência e segurança
    const sendTest = httpsCallable(functions, 'whatsappSendTest');

    try {
        const result = await sendTest({ testPhone });
        return result.data;
    } catch (error: any) {
        console.error("Error calling sendTestMessage function:", error);
        throw new Error(error.message || "O envio da mensagem de teste falhou.");
    }
}
