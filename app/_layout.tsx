import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useCallStore } from '@/stores/useCallStore';
import { useServiceRequestStore } from '@/stores/useServiceRequestStore';
import { subscribeToAuthChanges, getCurrentUser } from '@/services/firebase/authService';
import { subscribeToIncomingCalls, CallSession, subscribeToServiceRequests, createProposal, updateMechanicDiamonds, getMechanic } from '@/services/firebase/firestore';
import { notifyNewProposal } from '@/services/firebase/notifications';
import { calculateDistance } from '@/services/location/locationService';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import {
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BannerNotification } from '@/components/shared/BannerNotification';
import { FloatingActiveJobButton } from '@/components/shared/FloatingActiveJobButton';
import { IncomingCallScreen } from '@/components/shared/IncomingCallScreen';
import { FloatingServiceRequest } from '@/components/mechanic/FloatingServiceRequest';
import { ServiceRequestModal } from '@/components/shared/ServiceRequestModal';
import { ModalProvider, showSuccessModal, showErrorModal } from '@/utils/modalService';
import { initializeAudio } from '@/services/audioService';
import '@/utils/i18n';

export default function RootLayout() {
    const router = useRouter();
    const { user, setUser, setLoading } = useAuthStore();
    const { loadActiveBooking } = useBookingStore();
    const { incomingCall, setIncomingCall, clearCalls, isInCall } = useCallStore();
    const { pendingRequests, setPendingRequests, selectedRequest, selectRequest, dismissRequest, markAsResponded, showProposalModal, setShowProposalModal } = useServiceRequestStore();
    const [submitting, setSubmitting] = useState(false);

    // Load custom fonts
    const [fontsLoaded, fontError] = useFonts({
        PlusJakartaSans_300Light,
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
    });

    useEffect(() => {
        // Initialize audio service
        initializeAudio();

        // Load active booking from storage
        loadActiveBooking();

        // Subscribe to auth state changes
        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            if (firebaseUser) {
                const user = await getCurrentUser();
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to incoming calls when user is logged in
    useEffect(() => {
        if (!user?.id || isInCall) return;

        console.log('📞 Subscribing to incoming calls for user:', user.id);

        const unsubscribe = subscribeToIncomingCalls(user.id, (call) => {
            if (call && call.status === 'ringing') {
                console.log('📞 Incoming call detected:', call);
                setIncomingCall(call);
            } else {
                setIncomingCall(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id, isInCall]);

    // Subscribe to service requests for mechanics (only if eligible)
    useEffect(() => {
        if (!user?.id || user.role !== 'mechanic') return;

        // Check if mechanic is eligible to receive requests
        const checkEligibilityAndSubscribe = async () => {
            try {
                const { getMechanic } = require('@/services/firebase/firestore');
                const mechanic = await getMechanic(user.id);

                // Only subscribe if KYC approved
                // Email verification is optional for now, can be enforced later
                if (!mechanic || mechanic.kycStatus !== 'approved') {
                    console.log('⚠️ Mechanic not eligible for requests (KYC not approved)');
                    return () => { };
                }

                console.log('🔧 Subscribing to service requests for mechanic:', user.id);

                // Get mechanic's first category or default to car_mechanic
                const category = mechanic.categories?.[0] || 'car_mechanic';

                const unsubscribe = subscribeToServiceRequests(category, (requests: any[]) => {
                    setPendingRequests(requests);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Error checking mechanic eligibility:', error);
                return () => { };
            }
        };

        let unsubscribe: (() => void) | undefined;
        checkEligibilityAndSubscribe().then(unsub => {
            unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.role]);

    // Subscribe to notifications and show banners for new ones
    useEffect(() => {
        if (!user?.id) return;

        const { subscribeToNotifications } = require('@/services/firebase/firestore');
        const { useBannerStore } = require('@/stores/useBannerStore');
        const { playNotificationSound } = require('@/services/audioService');

        let lastNotificationIds: string[] = [];

        const unsubscribe = subscribeToNotifications(user.id, (notifications: any[]) => {
            // Find new unread notifications
            const newNotifications = notifications.filter(
                (n: any) => !n.read && !lastNotificationIds.includes(n.id)
            );

            if (newNotifications.length > 0 && lastNotificationIds.length > 0) {
                // Show banner for the most recent one (only if not first load)
                const latest = newNotifications[0];
                const { showBanner } = useBannerStore.getState();

                showBanner({
                    type: 'info',
                    title: latest.title,
                    message: latest.message,
                    duration: 5000,
                    data: latest.data,
                });

                // Play notification sound
                playNotificationSound();

                console.log('🔔 New notification:', latest.title);
            }

            // Update the list of known notification IDs
            lastNotificationIds = notifications.map((n: any) => n.id);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const handleAcceptCall = () => {
        if (incomingCall) {
            router.push({
                pathname: '/(shared)/call',
                params: {
                    userId: incomingCall.callerId,
                    userName: incomingCall.callerName,
                    userPhoto: incomingCall.callerPhoto || '',
                    callType: incomingCall.callType,
                    isIncoming: 'true',
                    callId: incomingCall.id,
                    channelName: incomingCall.channelName || '', // Agora channel for VoIP
                },
            });
            setIncomingCall(null);
        }
    };

    const handleDeclineCall = () => {
        setIncomingCall(null);
    };

    // Handle floating service request accept
    const handleAcceptServiceRequest = (request: any) => {
        selectRequest(request);
    };

    // Handle proposal submission from modal
    const handleSubmitProposal = async (price: string, time: string, message: string) => {
        if (!user || !selectedRequest) return;

        setSubmitting(true);
        try {
            const mechanic = await getMechanic(user.id);
            if (!mechanic) throw new Error('Mechanic not found');

            // Deduct diamond
            await updateMechanicDiamonds(user.id, 1, 'subtract');

            // Calculate distance
            let distance = 2.5;
            if (mechanic.location && selectedRequest.location) {
                distance = calculateDistance(
                    mechanic.location.latitude,
                    mechanic.location.longitude,
                    selectedRequest.location.latitude,
                    selectedRequest.location.longitude
                );
            }

            // Create proposal
            const proposalData: any = {
                requestId: selectedRequest.id,
                customerId: selectedRequest.customerId,
                mechanicId: user.id,
                mechanicName: user.name,
                mechanicRating: mechanic.rating,
                mechanicTotalRatings: mechanic.totalRatings,
                price: parseInt(price),
                estimatedTime: time,
                message: message,
                distance: distance,
                status: 'pending',
            };

            if (user.profilePic) {
                proposalData.mechanicPhoto = user.profilePic;
            }

            const proposalId = await createProposal(proposalData);

            // Notify customer
            await notifyNewProposal(proposalId, user.name, parseInt(price));

            // Close modal and mark request as responded (won't show again)
            markAsResponded(selectedRequest.id);

            console.log('✅ Proposal submitted!');
        } catch (error: any) {
            console.error('Error submitting proposal:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading screen while fonts are loading
    if (!fontsLoaded && !fontError) {
        return (
            <View style={{ flex: 1 }}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <ModalProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(customer)" />
                <Stack.Screen name="(mechanic)" />
                <Stack.Screen name="(shared)" />
            </Stack>
            <BannerNotification />
            <FloatingActiveJobButton />

            {/* Floating Service Request for Mechanics */}
            {user?.role === 'mechanic' && pendingRequests.length > 0 && !showProposalModal && (
                <FloatingServiceRequest
                    requests={pendingRequests}
                    onAccept={handleAcceptServiceRequest}
                    onCancel={dismissRequest}
                />
            )}

            {/* Service Request Modal for Proposal */}
            <ServiceRequestModal
                request={selectedRequest}
                onSubmitProposal={handleSubmitProposal}
                onCancel={() => selectRequest(null)}
            />

            {/* Incoming Call Screen */}
            {incomingCall && incomingCall.status === 'ringing' && !isInCall && (
                <IncomingCallScreen
                    call={incomingCall}
                    onAccept={handleAcceptCall}
                    onDecline={handleDeclineCall}
                />
            )}
        </ModalProvider>
    );
}
