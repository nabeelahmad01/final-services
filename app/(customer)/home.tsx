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
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { subscribeToActiveBooking } from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceCategory } from '@/types';

export default function CustomerHome() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { activeBooking, setActiveBooking } = useBookingStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToActiveBooking(user.id, 'customer', (booking) => {
            setActiveBooking(booking);
            if (booking) {
                router.push('/(customer)/tracking');
            }
        });

        return () => unsubscribe();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        // Add refresh logic here
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleCategoryPress = (category: ServiceCategory) => {
        router.push({
            pathname: '/(customer)/service-request',
            params: { category },
        });
    };

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
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(shared)/profile')}>
                        <Avatar name={user?.name || ''} uri={user?.profilePic} size={48} />
                    </TouchableOpacity>
                </View>

                {/* Active Booking Banner */}
                {activeBooking && (
                    <Card style={styles.activeBookingCard}>
                        <View style={styles.activeBookingContent}>
                            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                            <View style={styles.activeBookingText}>
                                <Text style={styles.activeBookingTitle}>Active Service</Text>
                                <Text style={styles.activeBookingSubtitle}>
                                    Your mechanic is on the way
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.trackButton}
                                onPress={() => router.push('/(customer)/tracking')}
                            >
                                <Text style={styles.trackButtonText}>Track</Text>
                                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

                {/* Services Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What do you need?</Text>
                    <Text style={styles.sectionSubtitle}>
                        Select a service category to get started
                    </Text>

                    <View style={styles.categoriesGrid}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryCard}
                                onPress={() => handleCategoryPress(category.id as ServiceCategory)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.categoryIcon,
                                        { backgroundColor: category.color + '20' },
                                    ]}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={32}
                                        color={category.color}
                                    />
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(customer)/history')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Service History</Text>
                            <Text style={styles.actionSubtitle}>View past services</Text>
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
    activeBookingCard: {
        backgroundColor: COLORS.primary + '10',
        marginBottom: 24,
    },
    activeBookingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activeBookingText: {
        flex: 1,
    },
    activeBookingTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    activeBookingSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    trackButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: SIZES.sm,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: '31%',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
