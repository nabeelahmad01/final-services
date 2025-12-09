import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { Proposal } from '@/types';

interface ProposalCardProps {
    proposal: Proposal;
    onAccept: () => void;
    onDecline: () => void;
    isProcessing?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
    proposal,
    onAccept,
    onDecline,
    isProcessing = false,
    isFavorite = false,
    onToggleFavorite,
}) => {
    return (
        <View style={styles.card}>
            {/* Price Badge - Top Right */}
            <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>PKR</Text>
                <Text style={styles.priceValue}>{proposal.price}</Text>
            </View>

            {/* ETA Badge - Below Price */}
            <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={14} color={COLORS.white} />
                <Text style={styles.etaText}>{proposal.estimatedTime}</Text>
            </View>

            {/* Mechanic Info - Left Side */}
            <View style={styles.mechanicInfo}>
                {/* Profile Photo */}
                <View style={styles.profilePhotoContainer}>
                    {proposal.mechanicPhoto ? (
                        <Image
                            source={{ uri: proposal.mechanicPhoto }}
                            style={styles.profilePhoto}
                        />
                    ) : (
                        <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                            <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                        </View>
                    )}
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    {/* Name Row with Favorite Toggle */}
                    <View style={styles.nameRow}>
                        <Text style={styles.mechanicName}>{proposal.mechanicName}</Text>
                        {onToggleFavorite && (
                            <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
                                <Ionicons
                                    name={isFavorite ? "heart" : "heart-outline"}
                                    size={20}
                                    color={isFavorite ? COLORS.danger : COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={16} color={COLORS.warning} />
                        <Text style={styles.ratingText}>
                            {proposal.mechanicRating.toFixed(2)}
                        </Text>
                        <Text style={styles.totalRatings}>
                            {proposal.mechanicTotalRatings} rides
                        </Text>
                    </View>

                    {/* Distance */}
                    <View style={styles.distanceRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.distanceText}>{proposal.distance} km away</Text>
                    </View>

                    {/* Message */}
                    {proposal.message && (
                        <Text style={styles.message} numberOfLines={2}>
                            {proposal.message}
                        </Text>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={onDecline}
                    disabled={isProcessing}
                >
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={onAccept}
                    disabled={isProcessing}
                >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    priceContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    priceLabel: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    etaBadge: {
        position: 'absolute',
        top: 70,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        zIndex: 10,
    },
    etaText: {
        color: COLORS.white,
        fontSize: SIZES.xs,
        fontWeight: '600',
    },
    mechanicInfo: {
        flexDirection: 'row',
        marginBottom: 16,
        marginRight: 100, // Space for price
    },
    profilePhotoContainer: {
        marginRight: 12,
    },
    profilePhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.border,
    },
    placeholderPhoto: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    favoriteButton: {
        padding: 4,
    },
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    ratingText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalRatings: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    distanceText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    message: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontStyle: 'italic',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButton: {
        backgroundColor: COLORS.border,
    },
    acceptButton: {
        backgroundColor: '#7FD957', // Bright green like InDrive
    },
    declineButtonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    acceptButtonText: {
        fontSize: SIZES.base,
        fontWeight: '700',
        color: COLORS.white,
    },
});
