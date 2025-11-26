import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { getMechanic } from '@/services/firebase/firestore';
import { subscribeToActiveBooking } from '@/services/firebase/firestore';
import { COLORS, SIZES } from '@/constants/theme';
import { Mechanic } from '@/types';

export default function MechanicDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch mechanic details
        getMechanic(user.id).then(setMechanic);

        // Subscribe to active booking
        const unsubscribe = subscribeToActiveBooking(user.id, 'mechanic', (booking) => {
            setActiveBooking(booking);
            if (booking) {
                router.push('/(mechanic)/active-job');
            }
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) {
            await getMechanic(user.id).then(setMechanic);
        }
        setRefreshing(false);
    };

    // Show loading spinner while fetching mechanic data
    if (!mechanic) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Dashboard</Text>
                        <Text style={styles.userName}>{mechanic.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(shared)/profile')}>
                        <Avatar name={mechanic.name} uri={mechanic.profilePic} size={48} />
                    </TouchableOpacity>
                </View>

                {/* Verification Status */}
                {!mechanic.isVerified && (
                    <Card style={[styles.statusCard, { backgroundColor: COLORS.warning + '20', borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}>
                        <View style={styles.statusContent}>
                            <View style={styles.statusIconContainer}>
                                <Ionicons name="time-outline" size={32} color={COLORS.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statusTitle}>KYC Verification Pending</Text>
                                <Text style={styles.statusText}>
                                    Complete your KYC to start receiving service requests
                                </Text>
                                <TouchableOpacity
                                    style={styles.kycButton}
                                    onPress={() => router.push('/(mechanic)/kyc-upload')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.kycButtonText}>Upload Documents</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                )}

                {mechanic.isVerified && (
                    <Card style={[styles.statusCard, { backgroundColor: COLORS.success + '20', borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
                        <View style={styles.statusContent}>
                            <View style={[styles.statusIconContainer, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statusTitle, { color: COLORS.success }]}>✓ Verified Account</Text>
                                <Text style={styles.statusText}>You can now accept service requests</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Ionicons name="star" size={32} color={COLORS.warning} />
                        <Text style={styles.statValue}>{mechanic.rating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="checkmark-done" size={32} color={COLORS.success} />
                        <Text style={styles.statValue}>{mechanic.completedJobs}</Text>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="diamond" size={32} color={COLORS.primary} />
                        <Text style={styles.statValue}>{mechanic.diamondBalance}</Text>
                        <Text style={styles.statLabel}>Diamonds</Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={[
                            styles.actionCard,
                            !mechanic.isVerified && styles.actionCardDisabled,
                        ]}
                        onPress={() => mechanic.isVerified && router.push('/(mechanic)/requests')}
                        disabled={!mechanic.isVerified}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="list" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>View Service Requests</Text>
                            <Text style={styles.actionSubtitle}>Find new jobs in your area</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(mechanic)/wallet')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                            <Ionicons name="wallet" size={24} color={COLORS.secondary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Buy Diamonds</Text>
                            <Text style={styles.actionSubtitle}>
                                Current balance: {mechanic.diamondBalance} diamonds
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(mechanic)/history')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="time" size={24} color={COLORS.success} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Job History</Text>
                            <Text style={styles.actionSubtitle}>View past completed jobs</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: 20,
    },
    statusIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statusTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    statusText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    kycButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.warning,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginTop: 8,
        shadowColor: COLORS.warning,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    kycButtonText: {
        color: COLORS.white,
        fontSize: SIZES.base,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    actionCardDisabled: {
        opacity: 0.5,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    actionSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
});
