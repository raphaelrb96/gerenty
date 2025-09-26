

'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { AutomationRule } from "@/lib/types";

const rulesCollection = collection(db, "automationRules");

export async function addRule(ruleData: Omit<AutomationRule, 'id'>): Promise<void> {
    try {
        await addDoc(rulesCollection, {
            ...ruleData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding automation rule: ", error);
        throw new Error("Failed to add automation rule.");
    }
}
