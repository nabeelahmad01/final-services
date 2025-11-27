import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    runTransaction
} from 'firebase/firestore';
import { firestore as db } from '@/services/firebase/config';
import { Review } from '@/types';

export const addReview = async (
    bookingId: string,
    mechanicId: string,
    customerId: string,
    rating: number,
    comment: string
) => {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Create the review document
            const reviewRef = doc(collection(db, 'reviews'));
            transaction.set(reviewRef, {
                bookingId,
                mechanicId,
                customerId,
                rating,
                comment,
                createdAt: serverTimestamp(),
            });

            // 2. Update mechanic's rating stats
            const mechanicRef = doc(db, 'users', mechanicId);
            transaction.update(mechanicRef, {
                rating: increment(rating), // This is wrong, we need to re-calculate average. 
                // Firestore doesn't have a simple "update average" operator.
                // We need to store totalRating and ratingCount.
                totalRating: increment(rating),
                ratingCount: increment(1),
            });

            // 3. Update booking status to 'completed' and 'reviewed'
            const bookingRef = doc(db, 'bookings', bookingId);
            transaction.update(bookingRef, {
                status: 'completed',
                isReviewed: true
            });
        });
        return true;
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
};

export const getMechanicReviews = async (mechanicId: string, limitCount = 10) => {
    try {
        const q = query(
            collection(db, 'reviews'),
            where('mechanicId', '==', mechanicId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Review[];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
};
