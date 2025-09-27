

'use server';

import { db } from "@/lib/firebase";
import { collection, doc, addDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
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

export async function createFlow(ownerId: string, companyId: string): Promise<Flow> {
    const initialNodes = [
        { 
            id: '1', 
            type: 'input', 
            data: { label: 'Gatilho: Palavra-Chave', type: 'keywordTrigger' }, 
            position: { x: 250, y: 5 } 
        },
        { 
            id: '2', 
            data: { label: 'Enviar Mensagem de Boas-Vindas', type: 'message' }, 
            position: { x: 250, y: 125 } 
        },
    ];
    const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true }];

    try {
        const docRef = await addDoc(flowsCollection, {
            ownerId,
            companyId,
            name: "Novo Fluxo de Conversa",
            trigger: { type: 'keyword', value: '', matchType: 'exact' },
            nodes: initialNodes,
            edges: initialEdges,
            status: 'draft',
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

    
