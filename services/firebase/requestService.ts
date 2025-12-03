import {
    collection,
    query,
    where,
    onSnapshot,
    QueryConstraint,
    limit,
    getDocs,
    doc,
    getDoc,
} from 'firebase/firestore';
import { firestore } from './config';
import { ServiceRequest, Mechanic } from '@/types';
import { calculateDistance } from '@/services/location/locationService';

/**
 * Subscribe to nearby service requests within specified radius
 * @param mechanicLocation Current mechanic location
 * @param radiusKm Radius in kilometers (default 10km)
 * @param callback Callback function with filtered requests
 * @returns Unsubscribe function
 */
export const subscribeToNearbyServiceRequests = (
    mechanicLocation: { latitude: number; longitude: number },
    category: string,
    radiusKm: number = 10,
    callback: (requests: ServiceRequest[]) => void
): (() => void) => {
    try {
        const constraints: QueryConstraint[] = [
            where('status', '==', 'pending'),
            where('category', '==', category),
            limit(50),
        ];

        const q = query(collection(firestore, 'serviceRequests'), ...constraints);

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    } as ServiceRequest;
                })
                .filter((request) => {
                    if (!request.location) return false;

                    const distance = calculateDistance(
                        mechanicLocation.latitude,
                        mechanicLocation.longitude,
                        request.location.latitude,
                        request.location.longitude
                    );

                    return distance <= radiusKm;
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            callback(requests);
        });
    } catch (error) {
        console.error('Error subscribing to nearby service requests:', error);
        return () => { };
    }
};
