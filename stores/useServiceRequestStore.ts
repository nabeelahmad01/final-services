import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceRequest } from '@/types';

interface ServiceRequestStore {
    pendingRequests: ServiceRequest[];
    dismissedRequestIds: string[]; // Track dismissed requests
    respondedRequestIds: string[]; // Track requests we've already submitted proposals for
    selectedRequest: ServiceRequest | null;
    showProposalModal: boolean;

    // Actions
    setPendingRequests: (requests: ServiceRequest[]) => void;
    addRequest: (request: ServiceRequest) => void;
    dismissRequest: (requestId: string) => void;
    markAsResponded: (requestId: string) => void;
    selectRequest: (request: ServiceRequest | null) => void;
    setShowProposalModal: (show: boolean) => void;
    clearAll: () => void;
    clearOldDismissed: () => void; // Clear old dismissed requests (older than 1 hour)
}

export const useServiceRequestStore = create<ServiceRequestStore>()(
    persist(
        (set, get) => ({
            pendingRequests: [],
            dismissedRequestIds: [],
            respondedRequestIds: [],
            selectedRequest: null,
            showProposalModal: false,

            setPendingRequests: (requests) => {
                const { dismissedRequestIds, respondedRequestIds } = get();
                // Filter out dismissed and already responded requests
                const filteredRequests = requests.filter(
                    r => !dismissedRequestIds.includes(r.id) && !respondedRequestIds.includes(r.id)
                );
                set({ pendingRequests: filteredRequests });
            },

            addRequest: (request) => set((state) => {
                // Don't add if already dismissed or responded
                if (state.dismissedRequestIds.includes(request.id) ||
                    state.respondedRequestIds.includes(request.id)) {
                    return state;
                }
                return {
                    pendingRequests: state.pendingRequests.some(r => r.id === request.id)
                        ? state.pendingRequests
                        : [...state.pendingRequests, request]
                };
            }),

            dismissRequest: (requestId) => set((state) => ({
                pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
                dismissedRequestIds: [...state.dismissedRequestIds, requestId]
            })),

            markAsResponded: (requestId) => set((state) => ({
                pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
                respondedRequestIds: [...state.respondedRequestIds, requestId],
                selectedRequest: null,
                showProposalModal: false
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

            clearOldDismissed: () => set((state) => ({
                // Keep only last 50 dismissed IDs to prevent memory bloat
                dismissedRequestIds: state.dismissedRequestIds.slice(-50),
                respondedRequestIds: state.respondedRequestIds.slice(-50)
            })),
        }),
        {
            name: 'service-request-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                dismissedRequestIds: state.dismissedRequestIds,
                respondedRequestIds: state.respondedRequestIds,
            }),
        }
    )
);
