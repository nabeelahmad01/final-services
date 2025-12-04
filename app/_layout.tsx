import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useCallStore } from '@/stores/useCallStore';
import { subscribeToAuthChanges, getCurrentUser } from '@/services/firebase/authService';
import { subscribeToIncomingCalls, CallSession } from '@/services/firebase/firestore';
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
import { ModalProvider } from '@/utils/modalService';
import { initializeAudio } from '@/services/audioService';
import '@/utils/i18n';

export default function RootLayout() {
    const router = useRouter();
    const { user, setUser, setLoading } = useAuthStore();
    const { loadActiveBooking } = useBookingStore();
    const { incomingCall, setIncomingCall, clearCalls, isInCall } = useCallStore();

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
                },
            });
            setIncomingCall(null);
        }
    };

    const handleDeclineCall = () => {
        setIncomingCall(null);
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
