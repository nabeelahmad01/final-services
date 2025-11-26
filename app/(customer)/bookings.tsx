import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Card, EmptyState } from '@/components';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function Bookings() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

    // TODO: Fetch bookings from Firestore
    const activeBookings: any[] = [];
    const pastBookings: any[] = [];

    const currentBookings = activeTab === 'active' ? activeBookings : pastBookings;

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
                    {activeBookings.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{activeBookings.length}</Text>
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
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {currentBookings.length === 0 ? (
                    <EmptyState
                        icon={activeTab === 'active' ? 'time-outline' : 'checkmark-done-circle-outline'}
                        title={activeTab === 'active' ? 'No Active Bookings' : 'No Past Bookings'}
                        message={
                            activeTab === 'active'
                                ? 'You don\'t have any active bookings. Request a service to get started!'
                                : 'Your completed bookings will appear here.'
                        }
                        actionLabel={activeTab === 'active' ? 'Request Service' : undefined}
                        onAction={activeTab === 'active' ? () => router.push('/(customer)/home') : undefined}
                    />
                ) : (
                    currentBookings.map((booking) => (
                        <Card
                            key={booking.id}
                            style={styles.bookingCard}
                            onPress={() => router.push({ pathname: '/(customer)/booking-details', params: { id: booking.id } })}
                        >
                            <View style={styles.bookingHeader}>
                                <View style={styles.bookingCategory}>
                                    <Ionicons name="construct" size={20} color={COLORS.primary} />
                                    <Text style={styles.bookingCategoryText}>{booking.category}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
                                    <Text style={[styles.statusText, { color: COLORS.success }]}>
                                        {booking.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.mechanicName}>{booking.mechanicName}</Text>
                            <Text style={styles.bookingDate}>{booking.date}</Text>
                        </Card>
                    ))
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
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    },
    tabActive: {
        backgroundColor: COLORS.primary + '15',
    },
    tabText: {
        fontSize: SIZES.base,
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
        gap: 8,
    },
    bookingCategoryText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
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
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    bookingDate: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
});
