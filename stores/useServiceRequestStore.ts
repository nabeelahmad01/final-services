import { create } from 'zustand';
import { ServiceRequest } from '@/types';

interface ServiceRequestStore {
    pendingRequests: ServiceRequest[];
    selectedRequest: ServiceRequest | null;
    showProposalModal: boolean;

    // Actions
    setPendingRequests: (requests: ServiceRequest[]) => void;
    addRequest: (request: ServiceRequest) => void;
    dismissRequest: (requestId: string) => void;
    selectRequest: (request: ServiceRequest | null) => void;
    setShowProposalModal: (show: boolean) => void;
    clearAll: () => void;
}

export const useServiceRequestStore = create<ServiceRequestStore>((set) => ({
    pendingRequests: [],
    selectedRequest: null,
    showProposalModal: false,

    setPendingRequests: (requests) => set({ pendingRequests: requests }),

    addRequest: (request) => set((state) => ({
        pendingRequests: state.pendingRequests.some(r => r.id === request.id)
            ? state.pendingRequests
            : [...state.pendingRequests, request]
    })),

    dismissRequest: (requestId) => set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
    })),

    selectRequest: (request) => set({
        selectedRequest: request,
        showProposalModal: request !== null
    }),

    setShowProposalModal: (show) => set({ showProposalModal: show }),

    clearAll: () => set({
        pendingRequests: [],
        selectedRequest: null,
        showProposalModal: false
    }),
}));
