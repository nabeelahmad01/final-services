import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalMechanics: 0,
        pendingKYC: 0,
        activeBookings: 0,
        totalRevenue: 0 // Placeholder
    });

    const loadStats = async () => {
        try {
            // Customers
            const customersQuery = query(collection(firestore, 'users'), where('role', '==', 'customer'));
            const customersSnapshot = await getCountFromServer(customersQuery);

            // Mechanics
            const mechanicsQuery = query(collection(firestore, 'users'), where('role', '==', 'mechanic'));
            const mechanicsSnapshot = await getCountFromServer(mechanicsQuery);

            // Pending KYC
            const kycQuery = query(collection(firestore, 'kycRequests'), where('status', '==', 'pending'));
            const kycSnapshot = await getCountFromServer(kycQuery);

            // Active Bookings
            const bookingsQuery = query(collection(firestore, 'bookings'), where('status', '==', 'ongoing'));
            const bookingsSnapshot = await getCountFromServer(bookingsQuery);

            setStats({
                totalCustomers: customersSnapshot.data().count,
                totalMechanics: mechanicsSnapshot.data().count,
                pendingKYC: kycSnapshot.data().count,
                activeBookings: bookingsSnapshot.data().count,
                totalRevenue: 15000 // Mock revenue for now
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
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
                    <Text style={styles.headerSubtitle}>Overview & Statistics</Text>
                </View>
                <TouchableOpacity onPress={() => router.replace('/(admin)/index')}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Grid */}
                <View style={styles.grid}>
                    <Card style={styles.statCard}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                            <Ionicons name="people" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                        <Text style={styles.statLabel}>Customers</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                            <Ionicons name="construct" size={24} color={COLORS.secondary} />
                        </View>
                        <Text style={styles.statValue}>{stats.totalMechanics}</Text>
                        <Text style={styles.statLabel}>Mechanics</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="calendar" size={24} color={COLORS.success} />
                        </View>
                        <Text style={styles.statValue}>{stats.activeBookings}</Text>
                        <Text style={styles.statLabel}>Active Jobs</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.warning + '20' }]}>
                            <Ionicons name="wallet" size={24} color={COLORS.warning} />
                        </View>
                        <Text style={styles.statValue}>PKR {stats.totalRevenue}</Text>
                        <Text style={styles.statLabel}>Revenue</Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity onPress={() => router.push('/(admin)/kyc-verification')}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '20' }]}>
                            <Ionicons name="shield-checkmark" size={24} color={COLORS.info} />
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>KYC Verification</Text>
                            <Text style={styles.actionDesc}>Review pending mechanic verifications</Text>
                        </View>
                        {stats.pendingKYC > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{stats.pendingKYC}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </Card>
                </TouchableOpacity>

                {/* Recent Activity Placeholder */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.activityCard}>
                    <Text style={styles.emptyText}>No recent activity to show</Text>
                </Card>

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
    grid: {
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
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    actionDesc: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    badge: {
        backgroundColor: COLORS.danger,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: SIZES.xs,
        fontWeight: 'bold',
    },
    activityCard: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.regular,
    },
});
