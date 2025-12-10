import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { Avatar } from '@/components/shared/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { COLORS, SIZES, FONTS, CATEGORIES } from '@/constants/theme';
import { Booking } from '@/types';
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { cancelBooking, createOrGetChat } from '@/services/firebase/firestore';

// Format date for display
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export default function BookingDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            const docRef = doc(firestore, 'bookings', bookingId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setBooking({
                    id: docSnap.id,
                    ...data,
                    startedAt: data.startedAt?.toDate() || new Date(),
                    completedAt: data.completedAt?.toDate(),
                    scheduledDate: data.scheduledDate?.toDate(),
                } as Booking);
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        if (booking?.mechanicPhone) {
            Linking.openURL(`tel:${booking.mechanicPhone}`);
        }
    };

    const handleChat = async () => {
        if (!booking) return;
        try {
            const chatId = await createOrGetChat(booking.customerId, booking.mechanicId);
            router.push({
                pathname: '/(shared)/chat',
                params: {
                    chatId,
                    recipientId: booking.mechanicId,
                    recipientName: booking.mechanicName || 'Mechanic',
                    recipientPhoto: booking.mechanicPhoto || '',
                },
            });
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    };

    const handleTrack = () => {
        router.push('/(customer)/tracking');
    };

    const handleReschedule = () => {
        if (!booking) return;
        router.push({
            pathname: '/(customer)/schedule-booking',
            params: {
                mechanicId: booking.mechanicId,
                mechanicName: booking.mechanicName || '',
                mechanicPhoto: booking.mechanicPhoto || '',
                mechanicRating: booking.mechanicRating?.toString() || '0',
                category: booking.category,
                bookingId: booking.id, // Pass for edit mode
            },
        });
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await cancelBooking(bookingId);
                            Alert.alert('Success', 'Booking cancelled successfully');
                            router.back();
                        } catch (error) {
                            console.error('Error cancelling booking:', error);
                            Alert.alert('Error', 'Failed to cancel booking');
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    const getStatusBadge = () => {
        if (!booking) return null;
        switch (booking.status) {
            case 'ongoing':
                return <Badge text="In Progress" variant="info" />;
            case 'scheduled':
                return <Badge text="Scheduled" variant="warning" />;
            case 'confirmed':
                return <Badge text="Confirmed" variant="success" />;
            case 'completed':
                return <Badge text="Completed" variant="success" />;
            case 'cancelled':
                return <Badge text="Cancelled" variant="danger" />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Booking not found</Text>
                    <Button title="Go Back" onPress={() => router.back()} />
                </View>
            </SafeAreaView>
        );
    }

    const category = CATEGORIES.find(c => c.id === booking.category);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Status Banner */}
                <Card style={[styles.statusBanner, {
                    backgroundColor: booking.isScheduled ? COLORS.info + '15' : COLORS.primary + '15'
                }]}>
                    <Ionicons
                        name={booking.isScheduled ? 'calendar' : 'time-outline'}
                        size={32}
                        color={booking.isScheduled ? COLORS.info : COLORS.primary}
                    />
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>
                            {booking.isScheduled ? 'Scheduled Booking' : 'Service in Progress'}
                        </Text>
                        <Text style={styles.statusSubtitle}>
                            {booking.isScheduled && booking.scheduledDate
                                ? `${formatDate(booking.scheduledDate)} at ${booking.scheduledTime}`
                                : 'Your mechanic is on the way'}
                        </Text>
                    </View>
                    {getStatusBadge()}
                </Card>

                {/* Pre-booked Badge */}
                {booking.isScheduled && (
                    <View style={styles.preBookedBadge}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.info} />
                        <Text style={styles.preBookedText}>Pre-booked Service</Text>
                    </View>
                )}

                {/* Mechanic Info */}
                <Card style={styles.mechanicCard}>
                    <Text style={styles.sectionTitle}>Mechanic</Text>
                    <View style={styles.mechanicInfo}>
                        <Avatar
                            name={booking.mechanicName || 'M'}
                            uri={booking.mechanicPhoto ?? undefined}
                            size={60}
                        />
                        <View style={styles.mechanicDetails}>
                            <Text style={styles.mechanicName}>{booking.mechanicName || 'Mechanic'}</Text>
                            {booking.mechanicRating && (
                                <View style={styles.ratingRow}>
                                    <Rating rating={booking.mechanicRating} size={16} />
                                    <Text style={styles.ratingText}>{booking.mechanicRating.toFixed(1)}</Text>
                                </View>
                            )}
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
                        <View style={[styles.categoryBadge, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                            <Text style={[styles.categoryText, { color: category?.color || COLORS.primary }]}>
                                {category?.name || 'Service'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="cash" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.priceValue}>PKR {booking.price?.toLocaleString()}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Estimated Time</Text>
                        <Text style={styles.detailValue}>{booking.estimatedTime}</Text>
                    </View>

                    {booking.isScheduled && booking.scheduledDate && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar" size={20} color={COLORS.info} />
                            <Text style={styles.detailLabel}>Scheduled</Text>
                            <Text style={[styles.detailValue, { color: COLORS.info }]}>
                                {formatDate(booking.scheduledDate)}
                            </Text>
                        </View>
                    )}

                    {booking.isScheduled && booking.scheduledTime && (
                        <View style={styles.detailRow}>
                            <Ionicons name="alarm" size={20} color={COLORS.info} />
                            <Text style={styles.detailLabel}>Time</Text>
                            <Text style={[styles.detailValue, { color: COLORS.info }]}>
                                {booking.scheduledTime}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                            {booking.customerLocation?.address}
                        </Text>
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

                {(booking.status === 'scheduled' || booking.status === 'confirmed') && (
                    <>
                        <Button
                            title="Reschedule Booking"
                            onPress={handleReschedule}
                            variant="outline"
                            icon={<Ionicons name="calendar-outline" size={20} color={COLORS.primary} />}
                            style={styles.actionButton}
                        />
                        <Button
                            title="Cancel Booking"
                            onPress={handleCancel}
                            variant="outline"
                            loading={cancelling}
                            style={StyleSheet.flatten([styles.actionButton, styles.cancelButton])}
                            icon={<Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />}
                        />
                    </>
                )}

                {/* Rate Mechanic - for completed bookings that haven't been reviewed */}
                {booking.status === 'completed' && !booking.isReviewed && (
                    <Button
                        title="Rate Mechanic"
                        onPress={() => router.push({
                            pathname: '/(customer)/rate-mechanic',
                            params: {
                                bookingId: booking.id,
                                mechanicId: booking.mechanicId,
                                mechanicName: booking.mechanicName || 'Mechanic',
                                mechanicPhoto: booking.mechanicPhoto || '',
                            }
                        })}
                        icon={<Ionicons name="star" size={20} color={COLORS.white} />}
                        style={styles.actionButton}
                    />
                )}

                {/* Already reviewed indicator */}
                {booking.status === 'completed' && booking.isReviewed && (
                    <Card style={styles.reviewedCard}>
                        <View style={styles.reviewedContent}>
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                            <View>
                                <Text style={styles.reviewedTitle}>You rated this service</Text>
                                <View style={styles.reviewedRating}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={star}
                                            name={star <= (booking.rating || 0) ? 'star' : 'star-outline'}
                                            size={18}
                                            color={COLORS.warning}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                        {booking.reviewComment && (
                            <Text style={styles.reviewedComment}>"{booking.reviewComment}"</Text>
                        )}
                    </Card>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: SIZES.lg,
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
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
    preBookedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.info + '15',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 16,
    },
    preBookedText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.info,
        fontFamily: FONTS.semiBold,
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
        textAlign: 'right',
        maxWidth: '50%',
    },
    priceValue: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.success,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
    },
    actionButton: {
        marginBottom: 12,
    },
    cancelButton: {
        borderColor: COLORS.danger,
    },
    reviewedCard: {
        padding: SIZES.padding,
        backgroundColor: COLORS.success + '10',
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    reviewedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewedTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    reviewedRating: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 4,
    },
    reviewedComment: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: 12,
    },
});
