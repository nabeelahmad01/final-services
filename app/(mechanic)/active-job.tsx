import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToActiveBooking } from '@/services/firebase/firestore';
import { createChat } from '@/services/firebase/chatService';
import { startLocationTracking } from '@/services/location/locationTrackingService';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/Button';
import { useModal, showErrorModal, showSuccessModal, showConfirmModal } from '@/utils/modalService';

export default function ActiveJob() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const { activeBooking, setActiveBooking } = useBookingStore();
    const [locationTrackingCleanup, setLocationTrackingCleanup] = React.useState<(() => void) | null>(null);

    React.useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToActiveBooking(user.id, 'mechanic', setActiveBooking);
        return () => unsubscribe();
    }, [user]);

    // Start location tracking when booking is active
    React.useEffect(() => {
        if (!activeBooking) {
            // Stop tracking if booking ended
            if (locationTrackingCleanup) {
                locationTrackingCleanup();
                setLocationTrackingCleanup(null);
            }
            return;
        }

        // Start location tracking for this booking
        startLocationTracking(activeBooking.id, (error) => {
            console.error('Location tracking error:', error);
        }).then((cleanup) => {
            if (cleanup) {
                setLocationTrackingCleanup(() => cleanup);
            }
        });

        return () => {
            if (locationTrackingCleanup) {
                locationTrackingCleanup();
            }
        };
    }, [activeBooking?.id]);

    const handleChat = async () => {
        if (!user || !activeBooking) {
            console.log('handleChat - Missing user or activeBooking:', { hasUser: !!user, hasBooking: !!activeBooking });
            showErrorModal(showModal, 'Error', 'Unable to open chat. Please try again.');
            return;
        }

        try {
            console.log('Creating chat for:', { userId: user.id, customerId: activeBooking.customerId, bookingId: activeBooking.id });
            const chatId = await createChat([user.id, activeBooking.customerId], activeBooking.id);
            console.log('Chat created successfully, navigating to:', `/(shared)/chat/${chatId}`);

            router.push(`/(shared)/chat/${chatId}`);
        } catch (error: any) {
            console.error('Error opening chat:', error);
            showErrorModal(showModal, 'Error', `Could not open chat: ${error.message || 'Unknown error'}`);
        }
    };

    const handleNavigate = () => {
        if (!activeBooking) {
            console.log('handleNavigate - Missing active booking');
            showErrorModal(showModal, 'Error', 'No active booking found');
            return;
        }

        console.log('Navigating to navigation screen');
        router.push('/(mechanic)/navigate');
    };

    const handleCompleteJob = async () => {
        if (!activeBooking) return;

        showConfirmModal(
            showModal,
            'Complete Job',
            'Mark this job as completed?',
            async () => {
                try {
                    // Stop location tracking
                    if (locationTrackingCleanup) {
                        locationTrackingCleanup();
                    }

                    // Update booking status to completed
                    const { updateBooking } = require('@/services/firebase/firestore');
                    await updateBooking(activeBooking.id, {
                        status: 'completed',
                        completedAt: new Date(),
                    });

                    showSuccessModal(
                        showModal,
                        'Job Completed!',
                        'Great work! The customer will now rate your service.',
                        () => router.replace('/(mechanic)/dashboard')
                    );
                } catch (error: any) {
                    showErrorModal(showModal, 'Error', error.message);
                }
            },
            undefined,
            'Complete',
            'Cancel'
        );
    };

    if (!activeBooking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Job</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="briefcase-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Active Job</Text>
                    <Text style={styles.emptySubtitle}>
                        Your current job details will appear here
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Job</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.card}>
                    <View style={styles.customerInfo}>
                        <Avatar name={activeBooking.customerName || 'Customer'} size={60} />
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{activeBooking.customerName}</Text>
                            <Text style={styles.serviceType}>{activeBooking.category}</Text>
                        </View>
                        <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                            <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.locationInfo}>
                        <Ionicons name="location" size={24} color={COLORS.primary} />
                        <Text style={styles.address}>{activeBooking.customerLocation?.address || 'Address not available'}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <Button
                            title="Navigate"
                            onPress={handleNavigate}
                            style={{ flex: 1 }}
                            variant="outline"
                        />
                        <Button
                            title="Complete Job"
                            onPress={handleCompleteJob}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    serviceType: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    chatButton: {
        padding: 8,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 50,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    address: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
});
