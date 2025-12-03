import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function BookingDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // TODO: Fetch booking details from Firestore
    const booking = {
        id: params.id,
        mechanicName: 'Ali Khan',
        mechanicPhone: '+92 300 1234567',
        mechanicRating: 4.8,
        category: 'Car Mechanic',
        status: 'ongoing',
        price: 1500,
        estimatedTime: '1 hour',
        date: new Date().toLocaleDateString(),
        customerLocation: {
            address: '123 Main Street, Lahore',
        },
    };

    const handleCall = () => {
        Linking.openURL(`tel:${booking.mechanicPhone}`);
    };

    const handleChat = () => {
        router.push({ pathname: '/(shared)/chat', params: { userId: 'mechanicId' } });
    };

    const handleTrack = () => {
        router.push('/(customer)/tracking');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(customer)/home')}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Status Banner */}
                <Card style={[styles.statusBanner, { backgroundColor: COLORS.primary + '15' }]}>
                    <Ionicons name="time-outline" size={32} color={COLORS.primary} />
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>Service in Progress</Text>
                        <Text style={styles.statusSubtitle}>Your mechanic is on the way</Text>
                    </View>
                    <Badge text={booking.status} variant="info" />
                </Card>

                {/* Mechanic Info */}
                <Card style={styles.mechanicCard}>
                    <Text style={styles.sectionTitle}>Mechanic</Text>
                    <View style={styles.mechanicInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{booking.mechanicName.charAt(0)}</Text>
                        </View>
                        <View style={styles.mechanicDetails}>
                            <Text style={styles.mechanicName}>{booking.mechanicName}</Text>
                            <View style={styles.ratingRow}>
                                <Rating rating={booking.mechanicRating} size={16} />
                                <Text style={styles.ratingText}>{booking.mechanicRating}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                            <Ionicons name="call" size={20} color={COLORS.white} />
                            <Text style={styles.contactButtonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.contactButton, styles.chatButton]} onPress={handleChat}>
                            <Ionicons name="chatbubble" size={20} color={COLORS.white} />
                            <Text style={styles.contactButtonText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Service Details */}
                <Card style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Service Details</Text>

                    <View style={styles.detailRow}>
                        <Ionicons name="construct" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{booking.category}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="cash" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.detailValue}>PKR {booking.price}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Estimated Time</Text>
                        <Text style={styles.detailValue}>{booking.estimatedTime}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{booking.date}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{booking.customerLocation.address}</Text>
                    </View>
                </Card>

                {/* Action Buttons */}
                {booking.status === 'ongoing' && (
                    <Button
                        title="Track Mechanic"
                        onPress={handleTrack}
                        icon={<Ionicons name="navigate" size={20} color={COLORS.white} />}
                        style={styles.actionButton}
                    />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: SIZES.padding,
        marginBottom: 16,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 2,
    },
    statusSubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    mechanicCard: {
        padding: SIZES.padding,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    mechanicInfo: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    mechanicDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
    },
    chatButton: {
        backgroundColor: COLORS.secondary,
    },
    contactButtonText: {
        color: COLORS.white,
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
    },
    detailsCard: {
        padding: SIZES.padding,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailLabel: {
        flex: 1,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    detailValue: {
        fontSize: SIZES.base,
        fontWeight: '500',
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    actionButton: {
        marginBottom: 12,
    },
});
