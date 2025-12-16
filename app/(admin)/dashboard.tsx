import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    route: string;
    badge?: number;
}

interface RecentActivity {
    id: string;
    type: 'booking' | 'kyc' | 'dispute' | 'user';
    title: string;
    subtitle: string;
    time: Date;
    icon: string;
    color: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalMechanics: 0,
        pendingKYC: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        openDisputes: 0,
        todayBookings: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    const loadStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Customers (from customers collection)
            const customersSnapshot = await getCountFromServer(collection(firestore, 'customers'));

            // Mechanics (from mechanics collection)
            const mechanicsSnapshot = await getCountFromServer(collection(firestore, 'mechanics'));

            // Pending KYC
            const kycQuery = query(collection(firestore, 'kycRequests'), where('status', '==', 'pending'));
            const kycSnapshot = await getCountFromServer(kycQuery);

            // Active Bookings
            const activeBookingsQuery = query(collection(firestore, 'bookings'), where('status', '==', 'ongoing'));
            const activeBookingsSnapshot = await getCountFromServer(activeBookingsQuery);

            // Completed Bookings & Revenue
            const completedBookingsQuery = query(collection(firestore, 'bookings'), where('status', '==', 'completed'));
            const completedSnapshot = await getDocs(completedBookingsQuery);
            const revenue = completedSnapshot.docs.reduce((sum, doc) => sum + (doc.data().price || 0), 0);

            // Open Disputes
            const disputesQuery = query(collection(firestore, 'disputes'), where('status', '==', 'open'));
            const disputesSnapshot = await getCountFromServer(disputesQuery);

            // Today's Bookings
            const todayBookingsQuery = query(
                collection(firestore, 'bookings'),
                where('createdAt', '>=', today)
            );
            let todayCount = 0;
            try {
                const todaySnapshot = await getCountFromServer(todayBookingsQuery);
                todayCount = todaySnapshot.data().count;
            } catch (e) {
                // Fallback if timestamp query fails
                todayCount = 0;
            }

            setStats({
                totalCustomers: customersSnapshot.data().count,
                totalMechanics: mechanicsSnapshot.data().count,
                pendingKYC: kycSnapshot.data().count,
                activeBookings: activeBookingsSnapshot.data().count,
                completedBookings: completedSnapshot.size,
                totalRevenue: revenue,
                openDisputes: disputesSnapshot.data().count,
                todayBookings: todayCount,
            });

            // Load recent activity
            await loadRecentActivity();

        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadRecentActivity = async () => {
        try {
            const activities: RecentActivity[] = [];

            // Recent bookings
            const bookingsQuery = query(
                collection(firestore, 'bookings'),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            bookingsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    type: 'booking',
                    title: `New Booking: ${data.customerName || 'Customer'}`,
                    subtitle: `${data.category || 'Service'} - PKR ${data.price || 0}`,
                    time: data.createdAt?.toDate() || new Date(),
                    icon: 'calendar',
                    color: COLORS.primary,
                });
            });

            // Recent KYC requests
            const kycQuery = query(
                collection(firestore, 'kycRequests'),
                orderBy('submittedAt', 'desc'),
                limit(3)
            );
            const kycSnapshot = await getDocs(kycQuery);
            kycSnapshot.docs.forEach(doc => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    type: 'kyc',
                    title: `KYC Request: ${data.mechanicName || 'Mechanic'}`,
                    subtitle: `Status: ${data.status}`,
                    time: data.submittedAt?.toDate() || new Date(),
                    icon: 'shield-checkmark',
                    color: COLORS.info,
                });
            });

            // Sort by time
            activities.sort((a, b) => b.time.getTime() - a.time.getTime());
            setRecentActivity(activities.slice(0, 8));

        } catch (error) {
            console.error('Error loading activity:', error);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const quickActions: QuickAction[] = [
        {
            id: 'kyc',
            title: 'KYC Verification',
            subtitle: 'Review pending verifications',
            icon: 'shield-checkmark',
            color: COLORS.info,
            route: '/(admin)/kyc-verification',
            badge: stats.pendingKYC,
        },
        {
            id: 'users',
            title: 'Customers',
            subtitle: 'Manage customer accounts',
            icon: 'people',
            color: COLORS.primary,
            route: '/(admin)/users',
        },
        {
            id: 'mechanics',
            title: 'Mechanics',
            subtitle: 'Manage mechanic accounts',
            icon: 'construct',
            color: COLORS.secondary,
            route: '/(admin)/mechanics',
        },
        {
            id: 'bookings',
            title: 'Bookings',
            subtitle: 'View all bookings',
            icon: 'calendar',
            color: COLORS.success,
            route: '/(admin)/bookings-admin',
        },
        {
            id: 'analytics',
            title: 'Analytics',
            subtitle: 'Revenue & statistics',
            icon: 'bar-chart',
            color: COLORS.warning,
            route: '/(admin)/analytics',
        },
        {
            id: 'disputes',
            title: 'Disputes',
            subtitle: 'Resolve issues',
            icon: 'warning',
            color: COLORS.danger,
            route: '/(admin)/disputes',
            badge: stats.openDisputes,
        },
        {
            id: 'settings',
            title: 'Settings',
            subtitle: 'App configuration',
            icon: 'settings',
            color: COLORS.textSecondary,
            route: '/(admin)/settings-admin',
        },
    ];

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>FixKar Admin Panel</Text>
                </View>
                <TouchableOpacity onPress={() => router.replace('/(admin)/index')}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Overview */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, styles.statCardPrimary]}>
                        <Ionicons name="people" size={28} color={COLORS.white} />
                        <Text style={styles.statValueWhite}>{stats.totalCustomers}</Text>
                        <Text style={styles.statLabelWhite}>Customers</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="construct" size={28} color={COLORS.secondary} />
                        <Text style={styles.statValue}>{stats.totalMechanics}</Text>
                        <Text style={styles.statLabel}>Mechanics</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="calendar" size={28} color={COLORS.success} />
                        <Text style={styles.statValue}>{stats.activeBookings}</Text>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                    </Card>

                    <Card style={[styles.statCard, styles.revenueCard]}>
                        <Ionicons name="wallet" size={28} color={COLORS.success} />
                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                            PKR {stats.totalRevenue.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Total Revenue</Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            onPress={() => router.push(action.route as any)}
                        >
                            <Card style={styles.actionCard}>
                                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                                </View>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                                {action.badge !== undefined && action.badge > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{action.badge}</Text>
                                    </View>
                                )}
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Activity */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.activityCard}>
                    {recentActivity.length === 0 ? (
                        <Text style={styles.emptyText}>No recent activity</Text>
                    ) : (
                        recentActivity.map((activity, index) => (
                            <View
                                key={activity.id}
                                style={[
                                    styles.activityItem,
                                    index === recentActivity.length - 1 && styles.activityItemLast
                                ]}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                                    <Ionicons name={activity.icon as any} size={16} color={activity.color} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                                </View>
                                <Text style={styles.activityTime}>{formatTime(activity.time)}</Text>
                            </View>
                        ))
                    )}
                </Card>

                <View style={{ height: 32 }} />
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
    headerSubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
        padding: SIZES.padding,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        padding: 16,
        alignItems: 'center',
    },
    statCardPrimary: {
        backgroundColor: COLORS.primary,
    },
    revenueCard: {
        width: '100%',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginTop: 8,
    },
    statValueWhite: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
        marginTop: 8,
    },
    statLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statLabelWhite: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.white,
        opacity: 0.9,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: 110,
        padding: 12,
        alignItems: 'center',
        position: 'relative',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    activityCard: {
        padding: 0,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    activityItemLast: {
        borderBottomWidth: 0,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    activitySubtitle: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    activityTime: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    emptyText: {
        padding: 24,
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
});
