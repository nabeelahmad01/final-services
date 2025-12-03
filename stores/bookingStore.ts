import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceRequest, Proposal, Booking } from '@/types';

const ACTIVE_BOOKING_KEY = '@fixkar:activeBooking';

interface BookingState {
    activeRequest: ServiceRequest | null;
    proposals: Proposal[];
    activeBooking: Booking | null;
    isLoaded: boolean;
    setActiveRequest: (request: ServiceRequest | null) => void;
    setProposals: (proposals: Proposal[]) => void;
    setActiveBooking: (booking: Booking | null) => void;
    clearBookingState: () => void;
    loadActiveBooking: () => Promise<void>;
}

export const useBookingStore = create<BookingState>((set) => ({
    activeRequest: null,
    proposals: [],
    activeBooking: null,
    isLoaded: false,

    setActiveRequest: (request) => set({ activeRequest: request }),

    setProposals: (proposals) => set({ proposals }),

    setActiveBooking: async (booking) => {
        set({ activeBooking: booking });

        // Persist to AsyncStorage
        try {
            if (booking) {
                await AsyncStorage.setItem(ACTIVE_BOOKING_KEY, JSON.stringify(booking));
            } else {
                await AsyncStorage.removeItem(ACTIVE_BOOKING_KEY);
            }
        } catch (error) {
            console.error('Error saving active booking:', error);
        }
    },

    clearBookingState: async () => {
        set({
            activeRequest: null,
            proposals: [],
            activeBooking: null
        });

        try {
            await AsyncStorage.removeItem(ACTIVE_BOOKING_KEY);
        } catch (error) {
            console.error('Error clearing booking state:', error);
        }
    },

    loadActiveBooking: async () => {
        try {
            const stored = await AsyncStorage.getItem(ACTIVE_BOOKING_KEY);
            if (stored) {
                const booking = JSON.parse(stored);
                // Restore Date objects
                if (booking.startedAt) {
                    booking.startedAt = new Date(booking.startedAt);
                }
                if (booking.completedAt) {
                    booking.completedAt = new Date(booking.completedAt);
                }
                set({ activeBooking: booking, isLoaded: true });
            } else {
                set({ isLoaded: true });
            }
        } catch (error) {
            console.error('Error loading active booking:', error);
            set({ isLoaded: true });
        }
    },
}));
