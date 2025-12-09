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
    customerName: string,
    customerPhoto: string | undefined,
    rating: number,
    comment: string
) => {
    try {
        await runTransaction(db, async (transaction) => {
            const reviewRef = doc(collection(db, 'reviews'));
            transaction.set(reviewRef, {
                bookingId,
                mechanicId,
                customerId,
                customerName,
                customerPhoto: customerPhoto || null,
                rating,
                comment,
                createdAt: serverTimestamp(),
            });

            // 2. Update mechanic's rating stats (in mechanics collection)
            const mechanicRef = doc(db, 'mechanics', mechanicId);
            transaction.update(mechanicRef, {
                totalRating: increment(rating),
                ratingCount: increment(1),
            });

            // 3. Update booking status to 'reviewed'
            const bookingRef = doc(db, 'bookings', bookingId);
            transaction.update(bookingRef, {
                isReviewed: true,
                rating: rating,
                reviewComment: comment,
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
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        }) as Review[];
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
};
