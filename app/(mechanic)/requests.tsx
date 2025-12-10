import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { 
    subscribeToServiceRequests, 
    createProposal, 
    updateMechanicDiamonds, 
    getMechanic,
    subscribeToMechanicScheduledBookings,
} from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest, Booking } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

type TabType = 'requests' | 'scheduled';

// Format date for display
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
};

export default function MechanicRequests() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState<TabType>('requests');
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [scheduledBookings, setScheduledBookings] = useState<Booking[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // Subscribe to service requests
        const unsubscribeRequests = subscribeToServiceRequests('car_mechanic', setRequests);
        
        // Subscribe to scheduled bookings
        const unsubscribeScheduled = subscribeToMechanicScheduledBookings(user.id, setScheduledBookings);

        return () => {
            unsubscribeRequests();
            unsubscribeScheduled();
        };
    }, [user]);

    const handleSubmitProposal = async (request: ServiceRequest) => {
        if (!user) return;

        showConfirmModal(
            showModal,
            'Submit Proposal',
            'Cost: 1 Diamond\n\nEnter your proposal details:',
            async () => {
                setSubmitting(request.id);
                try {
                    // Deduct diamond
                    await updateMechanicDiamonds(user.id, 1, 'subtract');

                    // Get mechanic details
                    const mechanicData = await getMechanic(user.id);
                    if (!mechanicData) throw new Error('Mechanic data not found');

                    // Create proposal object
                    const proposalData: any = {
                        requestId: request.id,
                        customerId: request.customerId,
                        mechanicId: user.id,
                        mechanicName: user.name,
                        mechanicRating: mechanicData.rating,
                        mechanicTotalRatings: mechanicData.totalRatings,
                        price: 100, // TODO: Let mechanic input
                        estimatedTime: '1-2 hours', // TODO: Let mechanic input
                        message: 'I can help you with this!',
                        distance: 2.5, // TODO: Calculate actual distance
                        status: 'pending',
                    };

                    // Only add mechanicPhoto if it exists
                    if (user.profilePic) {
                        proposalData.mechanicPhoto = user.profilePic;
                    }

                    await createProposal(proposalData);

                    showSuccessModal(showModal, 'Success', 'Proposal submitted!');
                } catch (error: any) {
                    showErrorModal(showModal, 'Error', error.message);
                } finally {
                    setSubmitting(null);
                }
            },
            undefined,
            'Submit',
            'Cancel'
        );
    };

    const handleNavigateToCustomer = (booking: Booking) => {
        router.push({
            pathname: '/(mechanic)/navigate',
            params: { bookingId: booking.id },
        });
    };

    const handleCallCustomer = (phone?: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleStartJob = async (booking: Booking) => {
        showConfirmModal(
            showModal,
            'Start Job',
            `Are you ready to start work for ${booking.customerName}?\n\nThis will mark the job as active.`,
            async () => {
                try {
                    const { updateBooking } = require('@/services/firebase/firestore');
                    await updateBooking(booking.id, {
                        status: 'ongoing',
                    });

                    showSuccessModal(
                        showModal,
                        'Job Started!',
                        'You can now navigate to the customer. The booking is now active.',
                        () => router.push('/(mechanic)/active-job')
                    );
                } catch (error: any) {
                    showErrorModal(showModal, 'Error', error.message);
                }
            },
            undefined,
            'Start Job',
            'Not Yet'
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const renderRequestsTab = () => (
        <>
            {requests.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Requests Available</Text>
                    <Text style={styles.emptySubtitle}>
                        New service requests will appear here
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>
                        {requests.length} Request{requests.length > 1 ? 's' : ''} Available
                    </Text>

                    {requests.map((request) => {
                        const category = CATEGORIES.find(c => c.id === request.category);
                        return (
                            <Card key={request.id} style={styles.requestCard}>
                                <View style={styles.categoryHeader}>
                                    <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' }]}>
                                        <Ionicons name={category?.icon as any} size={24} color={category?.color} />
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{category?.name}</Text>
                                        <Text style={styles.customerName}>by {request.customerName}</Text>
                                    </View>
                                </View>

                                <View style={styles.requestDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                                        <Text style={styles.detailText}>Nearby</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                                        <Text style={styles.detailText}>Just now</Text>
                                    </View>
                                </View>

                                <Text style={styles.description}>{request.description}</Text>

                                <View style={styles.costBadge}>
                                    <Ionicons name="diamond" size={16} color={COLORS.primary} />
                                    <Text style={styles.costText}>1 Diamond to send proposal</Text>
                                </View>

                                <Button
                                    title="Submit Proposal"
                                    onPress={() => handleSubmitProposal(request)}
                                    loading={submitting === request.id}
                                    disabled={submitting !== null}
                                    size="small"
                                />
                            </Card>
                        );
                    })}
                </>
            )}
        </>
    );

    const renderScheduledTab = () => (
        <>
            {scheduledBookings.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Scheduled Bookings</Text>
                    <Text style={styles.emptySubtitle}>
                        Your upcoming scheduled jobs will appear here
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>
                        {scheduledBookings.length} Scheduled Booking{scheduledBookings.length > 1 ? 's' : ''}
                    </Text>

                    {scheduledBookings.map((booking) => {
                        const category = CATEGORIES.find(c => c.id === booking.category);
                        const scheduledDateStr = booking.scheduledDate
                            ? formatDate(booking.scheduledDate)
                            : 'TBD';

                        return (
                            <Card key={booking.id} style={[styles.requestCard, styles.scheduledCard]}>
                                <View style={styles.categoryHeader}>
                                    <View style={[styles.categoryIcon, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                                        <Ionicons name={category?.icon as any || 'construct'} size={24} color={category?.color || COLORS.primary} />
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{category?.name || 'Service'}</Text>
                                        <Text style={styles.customerName}>{booking.customerName}</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceText}>PKR {booking.price?.toLocaleString()}</Text>
                                    </View>
                                </View>

                                {/* Schedule Info */}
                                <View style={styles.scheduleInfoRow}>
                                    <View style={styles.scheduleBadge}>
                                        <Ionicons name="calendar" size={16} color={COLORS.info} />
                                        <Text style={styles.scheduleBadgeText}>{scheduledDateStr}</Text>
                                    </View>
                                    {booking.scheduledTime && (
                                        <View style={styles.scheduleBadge}>
                                            <Ionicons name="time" size={16} color={COLORS.info} />
                                            <Text style={styles.scheduleBadgeText}>{booking.scheduledTime}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Customer Address */}
                                <View style={styles.addressRow}>
                                    <Ionicons name="location" size={18} color={COLORS.primary} />
                                    <Text style={styles.addressText} numberOfLines={2}>
                                        {booking.customerLocation?.address || 'Address not available'}
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.callBtn]}
                                        onPress={() => handleCallCustomer(booking.customerPhone || undefined)}
                                    >
                                        <Ionicons name="call" size={18} color={COLORS.success} />
                                        <Text style={styles.callBtnText}>Call</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.navigateBtn]}
                                        onPress={() => handleNavigateToCustomer(booking)}
                                    >
                                        <Ionicons name="navigate" size={18} color={COLORS.white} />
                                        <Text style={styles.navigateBtnText}>Navigate</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Start Job Button */}
                                <TouchableOpacity
                                    style={styles.startJobBtn}
                                    onPress={() => handleStartJob(booking)}
                                >
                                    <Ionicons name="play-circle" size={20} color={COLORS.white} />
                                    <Text style={styles.startJobBtnText}>Start Job</Text>
                                </TouchableOpacity>
                            </Card>
                        );
                    })}
                </>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Requests</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Ionicons 
                        name="document-text-outline" 
                        size={20} 
                        color={activeTab === 'requests' ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        Requests
                    </Text>
                    {requests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{requests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]}
                    onPress={() => setActiveTab('scheduled')}
                >
                    <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={activeTab === 'scheduled' ? COLORS.info : COLORS.textSecondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabTextScheduled]}>
                        Scheduled
                    </Text>
                    {scheduledBookings.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: COLORS.info }]}>
                            <Text style={styles.badgeText}>{scheduledBookings.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'requests' ? renderRequestsTab() : renderScheduledTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SIZES.padding,
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: COLORS.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    activeTabTextScheduled: {
        color: COLORS.info,
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
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
    requestCard: {
        marginBottom: 16,
        padding: 16,
    },
    scheduledCard: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    customerName: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    requestDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    description: {
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 12,
    },
    costText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    scheduleInfoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    scheduleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.info + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scheduleBadgeText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.info,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 16,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
    },
    callBtn: {
        backgroundColor: COLORS.success + '15',
    },
    callBtnText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.success,
    },
    navigateBtn: {
        backgroundColor: COLORS.primary,
    },
    navigateBtnText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.white,
    },
    startJobBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 12,
    },
    startJobBtnText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
