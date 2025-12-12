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
    ServiceCategory,
    Notification,
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
    // 1. Live Requests: Only get requests from last 10 minutes
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const qLive = query(
        collection(firestore, 'serviceRequests'),
        where('category', '==', category),
        where('status', '==', 'pending'),
        where('createdAt', '>=', tenMinutesAgo),
        orderBy('createdAt', 'desc')
    );

    // 2. Scheduled Requests: Get all pending scheduled requests
    const qScheduled = query(
        collection(firestore, 'serviceRequests'),
        where('category', '==', category),
        where('status', '==', 'pending'),
        where('isScheduled', '==', true),
        orderBy('createdAt', 'desc')
    );

    let liveRequests: ServiceRequest[] = [];
    let scheduledRequests: ServiceRequest[] = [];

    const mergeAndCallback = () => {
        const allRequests = [...scheduledRequests, ...liveRequests];
        // Deduplicate by ID
        const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values());
        // Sort by creation time desc
        uniqueRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        callback(uniqueRequests);
    };

    const unsubLive = onSnapshot(qLive, (snapshot) => {
        liveRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as ServiceRequest[];
        mergeAndCallback();
    });

    const unsubScheduled = onSnapshot(qScheduled, (snapshot) => {
        scheduledRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as ServiceRequest[];
        mergeAndCallback();
    });

    return () => {
        unsubLive();
        unsubScheduled();
    };
};

export const updateServiceRequestStatus = async (
    id: string,
    status: ServiceRequest['status']
) => {
    await updateDoc(doc(firestore, 'serviceRequests', id), { status });
};

export const subscribeToServiceRequest = (
    requestId: string,
    callback: (request: ServiceRequest | null) => void
) => {
    return onSnapshot(doc(firestore, 'serviceRequests', requestId), (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const data = snapshot.data();
        callback({
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt.toDate(),
        } as ServiceRequest);
    });
};


// Proposals
export const createProposal = async (proposal: Omit<Proposal, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(firestore, 'proposals'), {
        ...proposal,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const getProposal = async (id: string): Promise<Proposal | null> => {
    const docSnap = await getDoc(doc(firestore, 'proposals', id));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as Proposal;
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
    // Build booking data, filtering out undefined values (Firestore doesn't accept undefined)
    const bookingData: Record<string, any> = {
        customerId: booking.customerId,
        mechanicId: booking.mechanicId,
        requestId: booking.requestId,
        proposalId: booking.proposalId,
        category: booking.category,
        customerLocation: booking.customerLocation,
        price: booking.price,
        estimatedTime: booking.estimatedTime,
        status: booking.status,
        startedAt: Timestamp.now(),
    };

    // Add optional fields only if they have values
    if (booking.customerName) bookingData.customerName = booking.customerName;
    if (booking.customerPhone) bookingData.customerPhone = booking.customerPhone;
    if (booking.customerPhoto) bookingData.customerPhoto = booking.customerPhoto;
    if (booking.mechanicName) bookingData.mechanicName = booking.mechanicName;
    if (booking.mechanicPhone !== undefined) bookingData.mechanicPhone = booking.mechanicPhone;
    if (booking.mechanicPhoto !== undefined) bookingData.mechanicPhoto = booking.mechanicPhoto;
    if (booking.mechanicRating !== undefined) bookingData.mechanicRating = booking.mechanicRating;
    if (booking.mechanicLocation) bookingData.mechanicLocation = booking.mechanicLocation;
    
    // Handle scheduled booking fields
    if (booking.isScheduled !== undefined) bookingData.isScheduled = booking.isScheduled;
    if (booking.scheduledDate) {
        // Check if it's already a Firestore Timestamp
        if (typeof (booking.scheduledDate as any).toDate === 'function') {
            // Already a Timestamp, use as-is
            bookingData.scheduledDate = booking.scheduledDate;
        } else if (booking.scheduledDate instanceof Date) {
            // It's a Date object, convert to Timestamp
            bookingData.scheduledDate = Timestamp.fromDate(booking.scheduledDate);
        } else {
            // Try to parse as date string/number
            try {
                const dateValue = new Date(booking.scheduledDate as any);
                if (!isNaN(dateValue.getTime())) {
                    bookingData.scheduledDate = Timestamp.fromDate(dateValue);
                }
            } catch (e) {
                console.warn('Could not parse scheduledDate:', booking.scheduledDate);
            }
        }
    }
    if (booking.scheduledTime) bookingData.scheduledTime = booking.scheduledTime;

    const docRef = await addDoc(collection(firestore, 'bookings'), bookingData);
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

// Get completed bookings for a mechanic
export const getCompletedBookings = async (mechanicId: string, limitCount: number = 5): Promise<Booking[]> => {
    const q = query(
        collection(firestore, 'bookings'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || new Date(),
        } as Booking;
    });
};

// Get scheduled bookings for a mechanic (upcoming jobs)
export const getMechanicScheduledBookings = async (mechanicId: string): Promise<Booking[]> => {
    const q = query(
        collection(firestore, 'bookings'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'scheduled'),
        orderBy('startedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            scheduledDate: data.scheduledDate?.toDate(),
        } as Booking;
    });
};

// Subscribe to mechanic's scheduled bookings (real-time)
export const subscribeToMechanicScheduledBookings = (
    mechanicId: string,
    callback: (bookings: Booking[]) => void
) => {
    const q = query(
        collection(firestore, 'bookings'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'scheduled'),
        orderBy('startedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startedAt: data.startedAt?.toDate() || new Date(),
                scheduledDate: data.scheduledDate?.toDate(),
            } as Booking;
        });
        callback(bookings);
    });
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

// Get nearby mechanics
export const getNearbyMechanics = async (
    userLocation: { latitude: number; longitude: number },
    category?: ServiceCategory,
    radiusKm: number = 10
): Promise<Mechanic[]> => {
    try {
        // Build query constraints
        const constraints: QueryConstraint[] = [
            where('kycStatus', '==', 'approved'),
            where('isVerified', '==', true),
            limit(50)
        ];

        // Add category filter if provided
        if (category) {
            constraints.push(where('categories', 'array-contains', category));
        }

        const q = query(
            collection(firestore, 'mechanics'),
            ...constraints
        );

        const snapshot = await getDocs(q);
        const mechanics = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as Mechanic[];

        // Filter by distance and calculate distance for each mechanic
        const mechanicsWithDistance = mechanics
            .filter(mechanic => mechanic.location) // Only include mechanics with location
            .map(mechanic => {
                const distance = calculateDistanceHelper(
                    userLocation.latitude,
                    userLocation.longitude,
                    mechanic.location!.latitude,
                    mechanic.location!.longitude
                );
                return { ...mechanic, distance };
            })
            .filter(mechanic => mechanic.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);

        return mechanicsWithDistance;
    } catch (error) {
        console.error('Error fetching nearby mechanics:', error);
        return [];
    }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistanceHelper = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
};

const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
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

// Reviews
export interface Review {
    id: string;
    mechanicId: string;
    customerId: string;
    customerName: string;
    customerPhoto?: string;
    bookingId: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

export const getMechanicReviews = async (mechanicId: string, limitCount: number = 5): Promise<Review[]> => {
    try {
        // Try with orderBy first (requires composite index)
        const q = query(
            collection(firestore, 'reviews'),
            where('mechanicId', '==', mechanicId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        console.log(`📝 Found ${snapshot.docs.length} reviews for mechanic ${mechanicId}`);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Review[];
    } catch (error: any) {
        console.error('❌ Error fetching reviews with orderBy, trying fallback:', error.message);
        
        // Fallback: Query without orderBy (doesn't need composite index)
        try {
            const fallbackQuery = query(
                collection(firestore, 'reviews'),
                where('mechanicId', '==', mechanicId),
                limit(limitCount * 2) // Get more and sort in memory
            );
            
            const snapshot = await getDocs(fallbackQuery);
            console.log(`📝 Fallback found ${snapshot.docs.length} reviews`);
            
            const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Review[];
            
            // Sort by createdAt descending in memory
            reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            return reviews.slice(0, limitCount);
        } catch (fallbackError: any) {
            console.error('❌ Fallback query also failed:', fallbackError.message);
            return [];
        }
    }
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(firestore, 'notifications'), {
        ...notification,
        read: false,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
};

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
) => {
    const q = query(
        collection(firestore, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        })) as Notification[];
        callback(notifications);
    });
};

export const markNotificationAsRead = async (notificationId: string) => {
    await updateDoc(doc(firestore, 'notifications', notificationId), {
        read: true,
    });
};

export const markAllNotificationsAsRead = async (userId: string) => {
    const q = query(
        collection(firestore, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { read: true })
    );

    await Promise.all(batch);
};

// User Profile
export const updateUserProfile = async (
    userId: string,
    updates: { name?: string; profilePic?: string }
) => {
    // Try mechanics collection first
    const mechanicDoc = await getDoc(doc(firestore, 'mechanics', userId));
    if (mechanicDoc.exists()) {
        await updateDoc(doc(firestore, 'mechanics', userId), {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return;
    }

    // Try customers collection
    const customerDoc = await getDoc(doc(firestore, 'customers', userId));
    if (customerDoc.exists()) {
        await updateDoc(doc(firestore, 'customers', userId), {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        return;
    }

    console.error('User not found in mechanics or customers collection');
};

// Call Sessions
export interface CallSession {
    id: string;
    callerId: string;
    callerName: string;
    callerPhoto?: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
    callType: 'voice' | 'video';
    channelName?: string; // Agora channel name for VoIP
    status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed';
    createdAt: Date;
}

export const createCallSession = async (
    callData: Omit<CallSession, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
    // Remove undefined fields - Firebase doesn't accept undefined values
    const cleanedData: Record<string, any> = {
        callerId: callData.callerId,
        callerName: callData.callerName,
        receiverId: callData.receiverId,
        receiverName: callData.receiverName,
        callType: callData.callType,
        status: 'ringing',
        createdAt: Timestamp.now(),
    };

    // Only add optional fields if they exist
    if (callData.callerPhoto) {
        cleanedData.callerPhoto = callData.callerPhoto;
    }
    if (callData.receiverPhoto) {
        cleanedData.receiverPhoto = callData.receiverPhoto;
    }
    if (callData.channelName) {
        cleanedData.channelName = callData.channelName;
    }

    const docRef = await addDoc(collection(firestore, 'calls'), cleanedData);
    return docRef.id;
};

export const subscribeToIncomingCalls = (
    userId: string,
    callback: (call: CallSession | null) => void
) => {
    // Simplified query - no orderBy to avoid index requirement
    const q = query(
        collection(firestore, 'calls'),
        where('receiverId', '==', userId),
        where('status', '==', 'ringing')
    );

    return onSnapshot(q, (snapshot) => {
        console.log('📞 Incoming calls snapshot:', snapshot.docs.length, 'calls found for', userId);

        if (snapshot.empty) {
            callback(null);
            return;
        }

        // Get the most recent one (manually sort by createdAt)
        const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as CallSession[];

        docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log('📞 Incoming call detected:', docs[0]);
        callback(docs[0]);
    }, (error) => {
        console.error('📞 Error subscribing to incoming calls:', error);
        callback(null);
    });
};

export const updateCallStatus = async (
    callId: string,
    status: CallSession['status']
) => {
    await updateDoc(doc(firestore, 'calls', callId), {
        status,
        updatedAt: Timestamp.now()
    });
};

export const getCallSession = async (callId: string): Promise<CallSession | null> => {
    const docSnap = await getDoc(doc(firestore, 'calls', callId));
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
    } as CallSession;
};

export const subscribeToCallSession = (
    callId: string,
    callback: (call: CallSession | null) => void
) => {
    return onSnapshot(doc(firestore, 'calls', callId), (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const data = snapshot.data();
        callback({
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt.toDate(),
        } as CallSession);
    });
};

export const endCallSession = async (callId: string) => {
    await updateDoc(doc(firestore, 'calls', callId), {
        status: 'ended',
        endedAt: Timestamp.now()
    });
};

// ==================== FAVORITES ====================

import { FavoriteMechanic } from '@/types';

export const addToFavorites = async (
    customerId: string,
    mechanic: Mechanic
): Promise<string> => {
    const favoriteData = {
        customerId,
        mechanicId: mechanic.id,
        mechanicName: mechanic.name,
        mechanicPhone: mechanic.phone,
        mechanicPhoto: mechanic.profilePic || null,
        mechanicRating: mechanic.rating,
        mechanicTotalRatings: mechanic.totalRatings,
        categories: mechanic.categories,
        completedJobs: mechanic.completedJobs,
        addedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'favorites'), favoriteData);
    return docRef.id;
};

export const removeFromFavorites = async (
    customerId: string,
    mechanicId: string
): Promise<void> => {
    const q = query(
        collection(firestore, 'favorites'),
        where('customerId', '==', customerId),
        where('mechanicId', '==', mechanicId)
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};

export const getFavorites = async (customerId: string): Promise<FavoriteMechanic[]> => {
    const q = query(
        collection(firestore, 'favorites'),
        where('customerId', '==', customerId),
        orderBy('addedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate() || new Date(),
    })) as FavoriteMechanic[];
};

export const subscribeToFavorites = (
    customerId: string,
    callback: (favorites: FavoriteMechanic[]) => void
) => {
    const q = query(
        collection(firestore, 'favorites'),
        where('customerId', '==', customerId),
        orderBy('addedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const favorites = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            addedAt: doc.data().addedAt?.toDate() || new Date(),
        })) as FavoriteMechanic[];
        callback(favorites);
    });
};

export const isMechanicFavorite = async (
    customerId: string,
    mechanicId: string
): Promise<boolean> => {
    const q = query(
        collection(firestore, 'favorites'),
        where('customerId', '==', customerId),
        where('mechanicId', '==', mechanicId),
        limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

// ==================== CUSTOMER BOOKINGS ====================

export const getCustomerBookings = async (
    customerId: string,
    status?: Booking['status'][]
): Promise<Booking[]> => {
    let q;
    if (status && status.length > 0) {
        q = query(
            collection(firestore, 'bookings'),
            where('customerId', '==', customerId),
            where('status', 'in', status),
            orderBy('startedAt', 'desc'),
            limit(50)
        );
    } else {
        q = query(
            collection(firestore, 'bookings'),
            where('customerId', '==', customerId),
            orderBy('startedAt', 'desc'),
            limit(50)
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            scheduledDate: data.scheduledDate?.toDate(),
        } as Booking;
    });
};

export const subscribeToCustomerBookings = (
    customerId: string,
    callback: (bookings: Booking[]) => void
) => {
    const q = query(
        collection(firestore, 'bookings'),
        where('customerId', '==', customerId),
        orderBy('startedAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startedAt: data.startedAt?.toDate() || new Date(),
                completedAt: data.completedAt?.toDate(),
                scheduledDate: data.scheduledDate?.toDate(),
            } as Booking;
        });
        callback(bookings);
    });
};

// ==================== SCHEDULED BOOKINGS ====================

export const createScheduledBooking = async (
    bookingData: Omit<Booking, 'id' | 'startedAt'>
): Promise<string> => {
    const docRef = await addDoc(collection(firestore, 'bookings'), {
        ...bookingData,
        status: 'scheduled',
        isScheduled: true,
        scheduledDate: bookingData.scheduledDate ? Timestamp.fromDate(bookingData.scheduledDate) : null,
        startedAt: Timestamp.now(),
    });
    return docRef.id;
};

export const rescheduleBooking = async (
    bookingId: string,
    newDate: Date,
    newTime: string
): Promise<void> => {
    await updateDoc(doc(firestore, 'bookings', bookingId), {
        scheduledDate: Timestamp.fromDate(newDate),
        scheduledTime: newTime,
        updatedAt: Timestamp.now(),
    });
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
    await updateDoc(doc(firestore, 'bookings', bookingId), {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
    });
};

export const getScheduledBookings = async (customerId: string): Promise<Booking[]> => {
    const q = query(
        collection(firestore, 'bookings'),
        where('customerId', '==', customerId),
        where('status', '==', 'scheduled'),
        orderBy('scheduledDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate() || new Date(),
            scheduledDate: data.scheduledDate?.toDate(),
        } as Booking;
    });
};
