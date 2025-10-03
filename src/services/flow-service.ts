

'use server';

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, deleteDoc } from "firebase/firestore";
import type { Flow } from "@/lib/types";

const flowsCollection = collection(db, "flows");

export async function getFlowsByCompany(companyId: string): Promise<Flow[]> {
    try {
        const q = query(flowsCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const flows: Flow[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            flows.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as Flow);
        });
        flows.sort((a, b) => new Date(b.updatedAt as any).getTime() - new Date(a.updatedAt as any).getTime());
        return flows;
    } catch (error) {
        console.error("Error getting flows:", error);
        throw new Error("Failed to fetch flows.");
    }
}

export async function createFlow(ownerId: string, companyId: string, name: string, triggerType: string): Promise<Flow> {
    const initialNodes = [
        { 
            id: '1', 
            type: 'custom', 
            data: { 
                label: 'Gatilho: Palavra-Chave', // Mantido por compatibilidade
                customLabel: 'Início do Fluxo',
                type: 'keywordTrigger',
                triggerKeywords: []
            }, 
            position: { x: 250, y: 5 } 
        },
    ];

    try {
        const docRef = await addDoc(flowsCollection, {
            ownerId,
            companyId,
            name,
            nodes: initialNodes,
            edges: [],
            status: 'draft',
            sessionConfig: {
                timeoutMinutes: 30,
                timeoutAction: 'end_flow',
            },
            schedule: {
                timezone: 'America/Sao_Paulo',
                isPerpetual: true,
                activationTime: '00:00',
                deactivationTime: '23:59',
                activeDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();

        return {
            id: docRef.id,
            ...newDocData,
            createdAt: newDocData?.createdAt?.toDate(),
            updatedAt: newDocData?.updatedAt?.toDate(),
        } as Flow;
    } catch (error) {
        console.error("Error creating flow: ", error);
        throw new Error("Failed to create flow.");
    }
}

export async function getFlowById(flowId: string): Promise<Flow | null> {
    try {
        const flowDocRef = doc(db, "flows", flowId);
        const flowDoc = await getDoc(flowDocRef);

        if (!flowDoc.exists()) {
            return null;
        }
        
        const data = flowDoc.data();
        return { 
            id: flowDoc.id, 
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
        } as Flow;
    } catch (error) {
        console.error("Error getting flow by ID: ", error);
        throw new Error("Failed to fetch flow data.");
    }
}


export async function updateFlow(flowId: string, flowData: Partial<Omit<Flow, 'id'>>): Promise<void> {
    try {
        const flowDoc = doc(db, "flows", flowId);
        await updateDoc(flowDoc, {
            ...flowData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating flow: ", error);
        throw new Error("Failed to update flow.");
    }
}

export async function deleteFlow(flowId: string): Promise<void> {
    try {
        const flowDoc = doc(db, "flows", flowId);
        await deleteDoc(flowDoc);
    } catch (error) {
        console.error("Error deleting flow: ", error);
        throw new Error("Failed to delete flow.");
    }
}
    
