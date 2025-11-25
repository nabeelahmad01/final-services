import { create } from 'zustand';
import { ServiceRequest, Proposal, Booking } from '@/types';

interface BookingState {
    activeRequest: ServiceRequest | null;
    proposals: Proposal[];
    activeBooking: Booking | null;
    setActiveRequest: (request: ServiceRequest | null) => void;
    setProposals: (proposals: Proposal[]) => void;
    setActiveBooking: (booking: Booking | null) => void;
    clearBookingState: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    activeRequest: null,
    proposals: [],
    activeBooking: null,
    setActiveRequest: (request) => set({ activeRequest: request }),
    setProposals: (proposals) => set({ proposals }),
    setActiveBooking: (booking) => set({ activeBooking: booking }),
    clearBookingState: () => set({
        activeRequest: null,
        proposals: [],
        activeBooking: null
    }),
}));
