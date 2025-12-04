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
        if (!activeBooking || !user) {
            // Stop tracking if booking ended
            if (locationTrackingCleanup) {
                locationTrackingCleanup();
                setLocationTrackingCleanup(null);
            }
            return;
        }

        // Start location tracking with userId (not bookingId)
        startLocationTracking(user.id, (error) => {
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
    }, [activeBooking?.id, user?.id]);

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

                {/* Customer Card */}
                <View style={styles.card}>
                    <View style={styles.customerInfo}>
                        <Avatar name={activeBooking.customerName || 'Customer'} size={60} />
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{activeBooking.customerName}</Text>
                            <Text style={styles.serviceType}>{activeBooking.category}</Text>
                            <Text style={styles.phoneNumber}>{activeBooking.customerPhone || 'No phone'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Location */}
                    <View style={styles.locationSection}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={20} color={COLORS.success} />
                            <Text style={styles.locationLabel}>Customer Location</Text>
                        </View>
                        <Text style={styles.address}>
                            {activeBooking.customerLocation?.address || 'Address not available'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Price */}
                    <View style={styles.priceSection}>
                        <Ionicons name="cash-outline" size={20} color={COLORS.text} />
                        <Text style={styles.priceText}>PKR {activeBooking.price} Cash</Text>
                    </View>
                </View>

                {/* Action Buttons - BIG & VISIBLE */}
                <View style={styles.bigActionButtons}>
                    <TouchableOpacity style={styles.bigButton} onPress={handleChat}>
                        <View style={[styles.bigButtonIcon, { backgroundColor: COLORS.primary }]}>
                            <Ionicons name="chatbubble" size={28} color={COLORS.white} />
                        </View>
                        <Text style={styles.bigButtonLabel}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bigButton} onPress={() => {
                        if (activeBooking) {
                            router.push({
                                pathname: '/(shared)/call',
                                params: {
                                    userId: activeBooking.customerId,
                                    userName: activeBooking.customerName,
                                    userPhone: activeBooking.customerPhone || '',
                                    callType: 'voice'
                                },
                            });
                        }
                    }}>
                        <View style={[styles.bigButtonIcon, { backgroundColor: COLORS.success }]}>
                            <Ionicons name="call" size={28} color={COLORS.white} />
                        </View>
                        <Text style={styles.bigButtonLabel}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bigButton} onPress={handleNavigate}>
                        <View style={[styles.bigButtonIcon, { backgroundColor: COLORS.secondary }]}>
                            <Ionicons name="navigate" size={28} color={COLORS.white} />
                        </View>
                        <Text style={styles.bigButtonLabel}>Navigate</Text>
                    </TouchableOpacity>
                </View>

                {/* Complete Job Button - VERY VISIBLE */}
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleCompleteJob}
                >
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                    <Text style={styles.completeButtonText}>Complete Job</Text>
                </TouchableOpacity>
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
    phoneNumber: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        marginTop: 4,
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
    locationSection: {
        gap: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    address: {
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 20,
    },
    priceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    priceText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    bigActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 24,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    bigButton: {
        alignItems: 'center',
        gap: 8,
    },
    bigButtonIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    bigButtonLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    completeButtonText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
});
