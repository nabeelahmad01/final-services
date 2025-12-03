import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Booking } from '@/types';

interface ActiveJobCardProps {
    booking: Booking;
    onPress: () => void;
    userRole: 'customer' | 'mechanic';
}

export const ActiveJobCard: React.FC<ActiveJobCardProps> = ({ booking, onPress, userRole }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulsing animation to draw attention
        const pulse = Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]);

        Animated.loop(pulse).start();
    }, []);

    const getStatusInfo = () => {
        switch (booking.status) {
            case 'ongoing':
                return {
                    icon: 'time-outline' as const,
                    text: 'Job in Progress',
                    color: COLORS.warning,
                };
            case 'completed':
                return {
                    icon: 'checkmark-circle-outline' as const,
                    text: 'Completed',
                    color: COLORS.success,
                };
            default:
                return {
                    icon: 'time-outline' as const,
                    text: 'Active',
                    color: COLORS.primary,
                };
        }
    };

    const statusInfo = getStatusInfo();
    const displayName = userRole === 'customer'
        ? 'Mechanic on the way'
        : booking.customerName || 'Customer';

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
                style={styles.card}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.header}>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </View>

                <View style={styles.content}>
                    <View style={styles.infoRow}>
                        <Ionicons name="construct" size={20} color={COLORS.primary} />
                        <Text style={styles.category}>{booking.category.replace(/_/g, ' ')}</Text>
                    </View>

                    <Text style={styles.name}>{displayName}</Text>

                    <View style={styles.footer}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.location} numberOfLines={1}>
                                {booking.customerLocation.address}
                            </Text>
                        </View>
                        <Text style={styles.price}>PKR {booking.price}</Text>
                    </View>
                </View>

                <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>Tap to view details</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        fontWeight: '600',
        color: COLORS.primary,
    },
    content: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    category: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
        marginLeft: 8,
        textTransform: 'capitalize',
    },
    name: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    location: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginLeft: 4,
        flex: 1,
    },
    price: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    actionHint: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
        alignItems: 'center',
    },
    actionHintText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
