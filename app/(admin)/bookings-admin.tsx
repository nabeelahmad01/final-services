import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Avatar } from '@/components/shared/Avatar';

interface Booking {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    mechanicId: string;
    mechanicName: string;
    mechanicPhone: string;
    category: string;
    status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
    price: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    isScheduled?: boolean;
    scheduledDate?: Date;
}

const STATUS_FILTERS = ['All', 'Ongoing', 'Completed', 'Cancelled'];

export default function AdminBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    const loadBookings = async () => {
        try {
            const q = query(
                collection(firestore, 'bookings'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                startedAt: doc.data().startedAt?.toDate(),
                completedAt: doc.data().completedAt?.toDate(),
                scheduledDate: doc.data().scheduledDate?.toDate(),
            })) as Booking[];

            setBookings(bookingsData);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadBookings();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing':
                return COLORS.primary;
            case 'completed':
                return COLORS.success;
            case 'cancelled':
                return COLORS.danger;
            case 'accepted':
                return COLORS.info;
            default:
                return COLORS.warning;
        }
    };

    const getFilteredBookings = () => {
        if (activeFilter === 'All') return bookings;
        return bookings.filter(b => 
            b.status.toLowerCase() === activeFilter.toLowerCase()
        );
    };

    // Calculate stats
    const stats = {
        total: bookings.length,
        ongoing: bookings.filter(b => b.status === 'ongoing').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        revenue: bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.price || 0), 0),
    };

    const renderBooking = ({ item }: { item: Booking }) => (
        <Card style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <View style={styles.bookingId}>
                    <Text style={styles.bookingIdText}>#{item.id.slice(-6).toUpperCase()}</Text>
                    {item.isScheduled && (
                        <View style={styles.scheduledBadge}>
                            <Ionicons name="calendar" size={10} color={COLORS.info} />
                            <Text style={styles.scheduledText}>Scheduled</Text>
                        </View>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.participants}>
                <View style={styles.participant}>
                    <Ionicons name="person" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.participantName}>{item.customerName}</Text>
                    <Text style={styles.participantPhone}>{item.customerPhone}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
                <View style={styles.participant}>
                    <Ionicons name="construct" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.participantName}>{item.mechanicName}</Text>
                    <Text style={styles.participantPhone}>{item.mechanicPhone}</Text>
                </View>
            </View>

            <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{item.category}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.detailValue}>PKR {item.price}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                        {item.createdAt.toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {item.isScheduled && item.scheduledDate && (
                <View style={styles.scheduledInfo}>
                    <Ionicons name="time-outline" size={14} color={COLORS.info} />
                    <Text style={styles.scheduledInfoText}>
                        Scheduled: {item.scheduledDate.toLocaleString()}
                    </Text>
                </View>
            )}
        </Card>
    );

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const filteredBookings = getFilteredBookings();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Booking Management</Text>
                    <Text style={styles.headerSubtitle}>{bookings.length} total bookings</Text>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.ongoing}</Text>
                    <Text style={styles.statLabel}>Ongoing</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={[styles.statCard, styles.revenueCard]}>
                    <Text style={[styles.statValue, { color: COLORS.success }]}>
                        PKR {stats.revenue.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {STATUS_FILTERS.map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            activeFilter === filter && styles.filterChipActive
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter && styles.filterTextActive
                        ]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bookings List */}
            <FlatList
                data={filteredBookings}
                renderItem={renderBooking}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No Bookings Found</Text>
                    </View>
                }
            />
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 16,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: SIZES.padding,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    revenueCard: {
        flex: 1.5,
    },
    statValue: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    statLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginBottom: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    list: {
        padding: SIZES.padding,
    },
    bookingCard: {
        marginBottom: 12,
        padding: 16,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingId: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bookingIdText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    scheduledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.info + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    scheduledText: {
        fontSize: 10,
        fontFamily: FONTS.medium,
        color: COLORS.info,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.bold,
    },
    participants: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    participant: {
        flex: 1,
        alignItems: 'center',
    },
    participantName: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginTop: 4,
    },
    participantPhone: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    bookingDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    detailValue: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginTop: 2,
    },
    scheduledInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 8,
        backgroundColor: COLORS.info + '10',
        borderRadius: 8,
    },
    scheduledInfoText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.info,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginTop: 16,
    },
});
