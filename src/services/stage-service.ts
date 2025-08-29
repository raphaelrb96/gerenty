
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export type Stage = {
    id: string;
    ownerId: string;
    name: string;
    order: number; // To maintain the order in the Kanban
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

const stagesCollection = collection(db, "stages");

const convertStageTimestamps = (data: any): Stage => {
    const stage = { ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (stage[key]?.toDate) {
            stage[key] = stage[key].toDate().toISOString();
        }
    }
    return stage as Stage;
}

// Get all stages for a specific user
export async function getStagesByUser(ownerId: string): Promise<Stage[]> {
    try {
        const q = query(stagesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const stages: Stage[] = [];
        querySnapshot.forEach((doc) => {
            stages.push(convertStageTimestamps({ id: doc.id, ...doc.data() }));
        });
        return stages.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error("Error getting stages: ", error);
        throw new Error("Failed to fetch stages.");
    }
}

// Add a new stage
export async function addStage(stageData: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stage> {
    try {
        const docRef = await addDoc(stagesCollection, {
            ...stageData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();
        
        revalidatePath('/dashboard/crm');
        
        return convertStageTimestamps({ id: docRef.id, ...newDocData });

    } catch (error) {
        console.error("Error adding stage: ", error);
        throw new Error("Failed to add stage.");
    }
}

// Update an existing stage
export async function updateStage(stageId: string, stageData: Partial<Omit<Stage, 'id'>>): Promise<Stage> {
    try {
        const stageDoc = doc(db, "stages", stageId);
        await updateDoc(stageDoc, {
            ...stageData,
            updatedAt: serverTimestamp(),
        });

        const updatedDocSnap = await getDoc(stageDoc);
        revalidatePath('/dashboard/crm');
        return convertStageTimestamps({ id: stageId, ...updatedDocSnap.data() });

    } catch (error) {
        console.error("Error updating stage: ", error);
        throw new Error("Failed to update stage.");
    }
}

// Delete a stage
export async function deleteStage(stageId: string): Promise<void> {
    try {
        const stageDoc = doc(db, "stages", stageId);
        await deleteDoc(stageDoc);
        revalidatePath('/dashboard/crm');
    } catch (error) {
        console.error("Error deleting stage: ", error);
        throw new Error("Failed to delete stage.");
    }
}

// Batch update stage order
export async function batchUpdateStageOrder(stages: { id: string; order: number }[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        stages.forEach(stage => {
            const docRef = doc(db, "stages", stage.id);
            batch.update(docRef, { order: stage.order, updatedAt: serverTimestamp() });
        });
        await batch.commit();
        revalidatePath('/dashboard/crm');
    } catch (error) {
        console.error("Error batch updating stage order: ", error);
        throw new Error("Failed to update stage order.");
    }
}

    