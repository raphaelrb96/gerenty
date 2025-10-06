import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, onSnapshot, Unsubscribe, doc, updateDoc } from "firebase/firestore";
import type { Conversation, Timestamp } from "@/lib/types";

const getConversationsCollection = (companyId: string) => collection(db, `companies/${companyId}/conversations`);

const convertConversationTimestamps = (data: any): Conversation => {
    const conversation = { id: data.id, ...data };
    if (conversation.lastMessageTimestamp?.toDate) {
        conversation.lastMessageTimestamp = conversation.lastMessageTimestamp.toDate();
    }
    return conversation as Conversation;
}

export function getConversations(companyId: string, callback: (conversations: Conversation[]) => void): Unsubscribe {
    const conversationsCollection = getConversationsCollection(companyId);
    const q = query(conversationsCollection, orderBy("lastMessageTimestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const conversations: Conversation[] = [];
        querySnapshot.forEach((doc) => {
            conversations.push(convertConversationTimestamps({ id: doc.id, ...doc.data() }));
        });
        callback(conversations);
    }, (error) => {
        console.error("Error getting conversations:", error);
        throw new Error("Failed to fetch conversations.");
    });
    
    return unsubscribe;
}

export async function markConversationAsRead(companyId: string, conversationId: string): Promise<void> {
    const conversationRef = doc(db, `companies/${companyId}/conversations`, conversationId);
    try {
        await updateDoc(conversationRef, {
            unreadMessagesCount: 0
        });
    } catch (error) {
        console.error("Error marking conversation as read:", error);
        // We don't throw an error here to not break the UI flow,
        // but we log it for debugging.
    }
}
