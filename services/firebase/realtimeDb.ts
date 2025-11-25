import { ref, set, onValue, off, get } from 'firebase/database';
import { realtimeDb } from './config';
import { Location } from '@/types';

export const updateLocation = async (userId: string, location: Location) => {
    const locationRef = ref(realtimeDb, `locations/${userId}`);
    await set(locationRef, location);
};

export const subscribeToLocation = (
    userId: string,
    callback: (location: Location | null) => void
) => {
    const locationRef = ref(realtimeDb, `locations/${userId}`);

    const listener = onValue(locationRef, (snapshot) => {
        const data = snapshot.val();
        callback(data as Location | null);
    });

    return () => off(locationRef, 'value', listener);
};

export const getLocation = async (userId: string): Promise<Location | null> => {
    const locationRef = ref(realtimeDb, `locations/${userId}`);
    const snapshot = await get(locationRef);
    return snapshot.val() as Location | null;
};

export const removeLocation = async (userId: string) => {
    const locationRef = ref(realtimeDb, `locations/${userId}`);
    await set(locationRef, null);
};
