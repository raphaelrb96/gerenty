
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { Conversation } from "@/lib/types";

const getConversationsCollection = (companyId: string) => collection(db, `companies/${companyId}/conversations`);

const convertConversationTimestamps = (data: any): Conversation => {
    const conversation = { id: data.id, ...data };
    if (conversation.lastMessageTimestamp?.toDate) {
        conversation.lastMessageTimestamp = conversation.lastMessageTimestamp.toDate().toISOString();
    }
    return conversation as Conversation;
}

export async function getConversations(companyId: string): Promise<Conversation[]> {
    try {
        const conversationsCollection = getConversationsCollection(companyId);
        const q = query(conversationsCollection, orderBy("lastMessageTimestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const conversations: Conversation[] = [];
        querySnapshot.forEach((doc) => {
            conversations.push(convertConversationTimestamps({ id: doc.id, ...doc.data() }));
        });
        return conversations;
    } catch (error) {
        console.error("Error getting conversations:", error);
        throw new Error("Failed to fetch conversations.");
    }
}
