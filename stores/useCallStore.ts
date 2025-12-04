import { create } from 'zustand';

export interface CallSession {
    id: string;
    callerId: string;
    callerName: string;
    callerPhoto?: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
    callType: 'voice' | 'video';
    channelName?: string; // Agora channel name for VoIP
    status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed';
    createdAt: Date;
}

interface CallState {
    // Outgoing call
    outgoingCall: CallSession | null;
    // Incoming call
    incomingCall: CallSession | null;
    // Is in active call
    isInCall: boolean;
    // Actions
    setOutgoingCall: (call: CallSession | null) => void;
    setIncomingCall: (call: CallSession | null) => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    clearCalls: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
    outgoingCall: null,
    incomingCall: null,
    isInCall: false,

    setOutgoingCall: (call) => set({
        outgoingCall: call,
        isInCall: call !== null
    }),

    setIncomingCall: (call) => set({
        incomingCall: call
    }),

    acceptCall: () => {
        const { incomingCall } = get();
        if (incomingCall) {
            set({
                isInCall: true,
                incomingCall: { ...incomingCall, status: 'accepted' }
            });
        }
    },

    declineCall: () => {
        set({
            incomingCall: null,
            isInCall: false
        });
    },

    endCall: () => set({
        outgoingCall: null,
        incomingCall: null,
        isInCall: false
    }),

    clearCalls: () => set({
        outgoingCall: null,
        incomingCall: null,
        isInCall: false
    }),
}));
