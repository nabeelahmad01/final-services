import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    onSnapshot,
    Timestamp,
    addDoc,
    QueryConstraint,
    deleteDoc
} from 'firebase/firestore';
import { firestore } from './config';
import {
    ServiceRequest,
    Proposal,
    Booking,
    Transaction,
    Chat,
    ChatMessage,
    Mechanic,
    ServiceCategory
} from '@/types';

// Service Requests
export const createServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(firestore, 'serviceRequests'), {
        ...request,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getServiceRequest = async (id: string): Promise<ServiceRequest | null> => {
    const docSnap = await getDoc(doc(firestore, 'serviceRequests', id));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as ServiceRequest;
};

export const subscribeToServiceRequests = (
    category: ServiceCategory,
    callback: (requests: ServiceRequest[]) => void
) => {
    const q = query(
        collection(firestore, 'serviceRequests'),
        where('category', '==', category),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as ServiceRequest[];
        callback(requests);
    });
};

export const updateServiceRequestStatus = async (
    id: string,
    status: ServiceRequest['status']
) => {
    await updateDoc(doc(firestore, 'serviceRequests', id), { status });
};

// Proposals
export const createProposal = async (proposal: Omit<Proposal, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(firestore, 'proposals'), {
        ...proposal,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const subscribeToProposals = (
    requestId: string,
    callback: (proposals: Proposal[]) => void
) => {
    const q = query(
        collection(firestore, 'proposals'),
        where('requestId', '==', requestId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const proposals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as Proposal[];
        callback(proposals);
    });
};

export const updateProposalStatus = async (
    id: string,
    status: Proposal['status']
) => {
    await updateDoc(doc(firestore, 'proposals', id), { status });
};

// Bookings
export const createBooking = async (booking: Omit<Booking, 'id' | 'startedAt'>) => {
    const docRef = await addDoc(collection(firestore, 'bookings'), {
        ...booking,
        startedAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getBooking = async (id: string): Promise<Booking | null> => {
    const docSnap = await getDoc(doc(firestore, 'bookings', id));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        startedAt: data.startedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
    } as Booking;
};

export const subscribeToActiveBooking = (
    userId: string,
    userType: 'customer' | 'mechanic',
    callback: (booking: Booking | null) => void
) => {
    const field = userType === 'customer' ? 'customerId' : 'mechanicId';
    const q = query(
        collection(firestore, 'bookings'),
        where(field, '==', userId),
        where('status', '==', 'ongoing'),
        limit(1)
    );

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
            return;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        callback({
            id: doc.id,
            ...data,
            startedAt: data.startedAt.toDate(),
            completedAt: data.completedAt?.toDate(),
        } as Booking);
    });
};

export const updateBooking = async (id: string, updates: Partial<Booking>) => {
    const updateData: any = { ...updates };
    if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    await updateDoc(doc(firestore, 'bookings', id), updateData);
};

// Mechanics
export const getMechanic = async (id: string): Promise<Mechanic | null> => {
    const docSnap = await getDoc(doc(firestore, 'mechanics', id));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as Mechanic;
};

export const updateMechanic = async (id: string, updates: Partial<Mechanic>) => {
    await updateDoc(doc(firestore, 'mechanics', id), updates);
};

export const updateMechanicDiamonds = async (
    mechanicId: string,
    amount: number,
    operation: 'add' | 'subtract'
) => {
    const mechanicDoc = await getDoc(doc(firestore, 'mechanics', mechanicId));
    if (!mechanicDoc.exists()) throw new Error('Mechanic not found');

    const currentBalance = mechanicDoc.data().diamondBalance || 0;
    const newBalance = operation === 'add'
        ? currentBalance + amount
        : Math.max(0, currentBalance - amount);

    await updateDoc(doc(firestore, 'mechanics', mechanicId), {
        diamondBalance: newBalance,
    });
};

// Transactions
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(firestore, 'transactions'), {
        ...transaction,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
    const q = query(
        collection(firestore, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
    })) as Transaction[];
};

// Chat
export const createOrGetChat = async (
    participant1: string,
    participant2: string
): Promise<string> => {
    // Check if chat already exists
    const q = query(
        collection(firestore, 'chats'),
        where('participants', 'array-contains', participant1)
    );

    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc =>
        doc.data().participants.includes(participant2)
    );

    if (existingChat) {
        return existingChat.id;
    }

    // Create new chat
    const docRef = await addDoc(collection(firestore, 'chats'), {
        participants: [participant1, participant2],
        participantDetails: {},
        unreadCount: {
            [participant1]: 0,
            [participant2]: 0,
        },
    });

    return docRef.id;
};

export const sendMessage = async (
    chatId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>
) => {
    const docRef = await addDoc(
        collection(firestore, 'chats', chatId, 'messages'),
        {
            ...message,
            createdAt: Timestamp.now(),
        }
    );

    // Update chat's last message
    await updateDoc(doc(firestore, 'chats', chatId), {
        lastMessage: message.text || 'Image',
        lastMessageAt: Timestamp.now(),
    });

    return docRef.id;
};

export const subscribeToMessages = (
    chatId: string,
    callback: (messages: ChatMessage[]) => void
) => {
    const q = query(
        collection(firestore, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as ChatMessage[];
        callback(messages);
    });
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
    const q = query(
        collection(firestore, 'chats', chatId, 'messages'),
        where('senderId', '!=', userId),
        where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { read: true })
    );

    await Promise.all(batch);
};
