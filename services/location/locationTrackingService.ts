import * as Location from 'expo-location';
import { doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase/config';

export interface LocationData {
    latitude: number;
    longitude: number;
    timestamp: number;
}

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
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

    return Math.round(distance * 100) / 100; // Round to 2 decimals
};

const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
};

// Calculate ETA in minutes based on distance and average speed
export const calculateETA = (distanceKm: number, avgSpeedKmh: number = 30): number => {
    // Average speed default is 30 km/h (considering city traffic)
    const hours = distanceKm / avgSpeedKmh;
    const minutes = Math.ceil(hours * 60);
    return minutes;
};

// Update mechanic's live location in booking document
export const updateMechanicLiveLocation = async (
    bookingId: string,
    location: LocationData
): Promise<void> => {
    try {
        await updateDoc(doc(firestore, 'bookings', bookingId), {
            mechanicLiveLocation: {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: Timestamp.fromMillis(location.timestamp),
            },
            lastLocationUpdate: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating mechanic live location:', error);
        throw error;
    }
};

// Subscribe to mechanic's live location updates
export const subscribeMechanicLiveLocation = (
    bookingId: string,
    callback: (location: LocationData | null) => void
): (() => void) => {
    return onSnapshot(doc(firestore, 'bookings', bookingId), (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const data = snapshot.data();
        const liveLocation = data.mechanicLiveLocation;

        if (liveLocation) {
            callback({
                latitude: liveLocation.latitude,
                longitude: liveLocation.longitude,
                timestamp: liveLocation.timestamp?.toMillis() || Date.now(),
            });
        } else {
            callback(null);
        }
    });
};

// Start tracking mechanic location (works for both idle and active job)
export const startLocationTracking = async (
    userId: string,
    onError?: (error: Error) => void
): Promise<(() => void) | null> => {
    try {
        // Import Realtime DB update function
        const { updateLocation } = await import('../firebase/realtimeDb');

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission not granted');
        }

        // Start watching position
        const subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000, // Update every 5 seconds
                distanceInterval: 10, // Or when moved 10 meters
            },
            async (location) => {
                try {
                    // Update in Realtime Database (works for idle and active)
                    await updateLocation(userId, {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        timestamp: location.timestamp,
                    });
                } catch (error) {
                    console.error('Error updating location:', error);
                    if (onError) onError(error as Error);
                }
            }
        );

        // Return cleanup function
        return () => {
            subscription.remove();
        };
    } catch (error) {
        console.error('Error starting location tracking:', error);
        if (onError) onError(error as Error);
        return null;
    }
};

// Get current location once
export const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};
