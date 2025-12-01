import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    doc,
    setDoc,
    updateDoc,
    getDocs,
    limit,
} from 'firebase/firestore';
import { firestore as db } from './config';

export const createChat = async (participants: string[], bookingId: string) => {
    try {
        // Check if chat already exists for this booking
        const q = query(
            collection(db, 'chats'),
            where('bookingId', '==', bookingId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }

        // Create new chat
        const chatRef = await addDoc(collection(db, 'chats'), {
            participants,
            bookingId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null,
        });

        return chatRef.id;
    } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
    }
};

export const sendMessage = async (chatId: string, message: any) => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');

        // Add message to subcollection
        await addDoc(messagesRef, {
            ...message,
            createdAt: serverTimestamp(),
        });

        // Update last message in chat document
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            lastMessage: message,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const subscribeToMessages = (chatId: string, callback: (messages: any[]) => void) => {
    const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                _id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        });
        callback(messages);
    });
};
