import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface ProposalCardProps {
    mechanicName: string;
    mechanicPhoto?: string;
    rating: number;
    totalJobs: number;
    price: number;
    estimatedTime: string;
    distance?: number;
    onAccept: () => void;
    onDecline: () => void;
    loading?: boolean;
}

export function ProposalCard({
    mechanicName,
    mechanicPhoto,
    rating,
    totalJobs,
    price,
    estimatedTime,
    distance,
    onAccept,
    onDecline,
    loading = false,
}: ProposalCardProps) {
    return (
        <View style={styles.container}>
            {/* Header with Price & Time */}
            <View style={styles.header}>
                <Text style={styles.price}>PKR{price}</Text>
                <Text style={styles.time}>{estimatedTime}</Text>
            </View>

            {/* Badge */}
            <View style={styles.badge}>
                <Ionicons name="thumbs-up" size={14} color={COLORS.primary} />
                <Text style={styles.badgeText}>Your fare</Text>
            </View>

            {/* Mechanic Info */}
            <View style={styles.mechanicInfo}>
                {mechanicPhoto ? (
                    <Image source={{ uri: mechanicPhoto }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                    </View>
                )}

                <View style={styles.mechanicDetails}>
                    <View style={styles.nameRow}>
                        <Text style={styles.mechanicName}>{mechanicName}</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text style={styles.rating}>{rating.toFixed(2)}</Text>
                        </View>
                    </View>
                    <Text style={styles.stats}>{totalJobs} jobs completed</Text>
                    {distance && (
                        <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={onDecline}
                    disabled={loading}
                >
                    <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.acceptButton, loading && styles.disabledButton]}
                    onPress={onAccept}
                    disabled={loading}
                >
                    <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    time: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 4,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    mechanicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mechanicDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    mechanicName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    stats: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    distance: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    disabledButton: {
        opacity: 0.6,
    },
});
