import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToCustomerBookings } from '@/services/firebase/firestore';
import { Card, EmptyState } from '@/components';
import { Avatar } from '@/components/shared/Avatar';
import { COLORS, SIZES, FONTS, CATEGORIES } from '@/constants/theme';
import { Booking } from '@/types';

// Format date for display
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatTime = (time?: string): string => {
    return time || '';
};

export default function Bookings() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'past'>('active');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = subscribeToCustomerBookings(user.id, (allBookings) => {
            setBookings(allBookings);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        // Subscription auto-refreshes, just wait a bit
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Filter bookings based on tab
    const filteredBookings = bookings.filter((booking) => {
        if (activeTab === 'active') {
            return booking.status === 'ongoing' || booking.status === 'confirmed';
        } else if (activeTab === 'scheduled') {
            return booking.status === 'scheduled';
        } else {
            return booking.status === 'completed' || booking.status === 'cancelled';
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing':
            case 'confirmed':
                return COLORS.primary;
            case 'scheduled':
                return COLORS.info;
            case 'completed':
                return COLORS.success;
            case 'cancelled':
                return COLORS.danger;
            default:
                return COLORS.textSecondary;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ongoing':
                return 'In Progress';
            case 'confirmed':
                return 'Confirmed';
            case 'scheduled':
                return 'Scheduled';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const renderBookingCard = (booking: Booking) => {
        const category = CATEGORIES.find((c) => c.id === booking.category);

        return (
            <Card
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push({ pathname: '/(customer)/booking-details', params: { id: booking.id } })}
            >
                <View style={styles.bookingHeader}>
                    <View style={styles.bookingCategory}>
                        <View style={[styles.categoryIcon, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                            <Ionicons name={category?.icon as any || 'construct'} size={20} color={category?.color || COLORS.primary} />
                        </View>
                        <Text style={styles.bookingCategoryText}>{category?.name || 'Service'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                            {getStatusText(booking.status)}
                        </Text>
                    </View>
                </View>

                {/* Mechanic Info */}
                <View style={styles.mechanicRow}>
                    <Avatar name={booking.mechanicName || 'M'} uri={booking.mechanicPhoto ?? undefined} size={40} />
                    <View style={styles.mechanicInfo}>
                        <Text style={styles.mechanicName}>{booking.mechanicName || 'Mechanic'}</Text>
                        {booking.mechanicRating && (
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{booking.mechanicRating.toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.priceText}>PKR {booking.price?.toLocaleString()}</Text>
                </View>

                {/* Scheduled Date/Time or Regular Date */}
                <View style={styles.dateRow}>
                    <Ionicons name={booking.isScheduled ? 'calendar' : 'time'} size={16} color={COLORS.textSecondary} />
                    {booking.isScheduled && booking.scheduledDate ? (
                        <Text style={styles.dateText}>
                            {formatDate(booking.scheduledDate)} {booking.scheduledTime && `at ${booking.scheduledTime}`}
                        </Text>
                    ) : (
                        <Text style={styles.dateText}>
                            {formatDate(booking.startedAt)}
                        </Text>
                    )}
                    {booking.isScheduled && (
                        <View style={styles.scheduledBadge}>
                            <Text style={styles.scheduledBadgeText}>Pre-booked</Text>
                        </View>
                    )}
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {booking.customerLocation?.address || 'Location not set'}
                    </Text>
                </View>

                {/* Rate Now badge for completed bookings without review */}
                {booking.status === 'completed' && !booking.isReviewed && (
                    <View style={styles.rateNowBadge}>
                        <Ionicons name="star-outline" size={14} color={COLORS.warning} />
                        <Text style={styles.rateNowText}>Tap to rate the mechanic</Text>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                        Active
                    </Text>
                    {bookings.filter(b => b.status === 'ongoing' || b.status === 'confirmed').length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>
                                {bookings.filter(b => b.status === 'ongoing' || b.status === 'confirmed').length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scheduled' && styles.tabActive]}
                    onPress={() => setActiveTab('scheduled')}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={activeTab === 'scheduled' ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>
                        Scheduled
                    </Text>
                    {bookings.filter(b => b.status === 'scheduled').length > 0 && (
                        <View style={[styles.tabBadge, { backgroundColor: COLORS.info }]}>
                            <Text style={styles.tabBadgeText}>
                                {bookings.filter(b => b.status === 'scheduled').length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.tabActive]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                        Past
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {filteredBookings.length === 0 ? (
                    <EmptyState
                        icon={
                            activeTab === 'active'
                                ? 'time-outline'
                                : activeTab === 'scheduled'
                                    ? 'calendar-outline'
                                    : 'checkmark-done-circle-outline'
                        }
                        title={
                            activeTab === 'active'
                                ? 'No Active Bookings'
                                : activeTab === 'scheduled'
                                    ? 'No Scheduled Bookings'
                                    : 'No Past Bookings'
                        }
                        message={
                            activeTab === 'active'
                                ? "You don't have any active bookings. Request a service to get started!"
                                : activeTab === 'scheduled'
                                    ? 'Schedule a booking in advance to see it here.'
                                    : 'Your completed bookings will appear here.'
                        }
                        actionLabel={activeTab !== 'past' ? 'Request Service' : undefined}
                        onAction={activeTab !== 'past' ? () => router.push('/(customer)/home') : undefined}
                    />
                ) : (
                    filteredBookings.map((booking) => renderBookingCard(booking))
                )}
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SIZES.padding,
        paddingVertical: 8,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    tabActive: {
        backgroundColor: COLORS.primary + '15',
    },
    tabText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
    },
    tabBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    tabBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.padding,
        flexGrow: 1,
    },
    bookingCard: {
        marginBottom: 12,
        padding: SIZES.padding,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingCategory: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookingCategoryText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        textTransform: 'uppercase',
    },
    mechanicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    mechanicInfo: {
        flex: 1,
    },
    mechanicName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    priceText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.success,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    dateText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        flex: 1,
    },
    scheduledBadge: {
        backgroundColor: COLORS.info + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    scheduledBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.info,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        flex: 1,
    },
    rateNowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.warning + '15',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    rateNowText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.warning,
    },
});
