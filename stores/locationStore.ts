import { create } from 'zustand';
import { Location } from '@/types';

interface LocationState {
    userLocation: Location | null;
    mechanicLocation: Location | null;
    isTracking: boolean;
    setUserLocation: (location: Location | null) => void;
    setMechanicLocation: (location: Location | null) => void;
    setIsTracking: (tracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
    userLocation: null,
    mechanicLocation: null,
    isTracking: false,
    setUserLocation: (location) => set({ userLocation: location }),
    setMechanicLocation: (location) => set({ mechanicLocation: location }),
    setIsTracking: (tracking) => set({ isTracking: tracking }),
}));
