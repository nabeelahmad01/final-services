import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { Proposal } from '@/types';
import { Avatar } from '@/components/shared/Avatar';

interface ProposalCardProps {
    proposal: Proposal;
    onAccept: (proposal: Proposal) => void;
    onDecline: (proposal: Proposal) => void;
    accepting?: boolean;
}

export const ProposalCard = ({ proposal, onAccept, onDecline, accepting }: ProposalCardProps) => {
    return (
        <View style={styles.container}>
            {/* Header: Price and Time */}
            <View style={styles.header}>
                <View style={styles.priceContainer}>
                    <Text style={styles.currency}>PKR</Text>
                    <Text style={styles.price}>{proposal.price}</Text>
                </View>
                <Text style={styles.time}>{proposal.estimatedTime}</Text>
            </View>

            {/* Tag: Your fare (if matches) - Optional logic, for now static style */}
            <View style={styles.tagContainer}>
                <Ionicons name="thumbs-up" size={12} color={COLORS.text} />
                <Text style={styles.tagText}>Your fare</Text>
            </View>

            {/* Mechanic Info */}
            <View style={styles.mechanicInfo}>
                <Avatar name={proposal.mechanicName} size={40} uri={proposal.mechanicPhoto} />
                <View style={styles.mechanicDetails}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{proposal.mechanicName}</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color={COLORS.text} />
                            <Text style={styles.rating}>{proposal.mechanicRating.toFixed(2)}</Text>
                        </View>
                        <Text style={styles.rides}>{proposal.mechanicTotalRatings} rides</Text>
                    </View>
                    <Text style={styles.vehicleInfo}>
                        Mechanic • {proposal.distance ? `${proposal.distance.toFixed(1)} km away` : 'Nearby'}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => onDecline(proposal)}
                    disabled={accepting}
                >
                    <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => onAccept(proposal)}
                    disabled={accepting}
                >
                    <Text style={styles.acceptText}>
                        {accepting ? 'Accepting...' : 'Accept'}
                    </Text>
                    {!accepting && <View style={styles.acceptHighlight} />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginRight: 2,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    time: {
        fontSize: 18,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9', // Light green
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        marginBottom: 12,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    mechanicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    mechanicDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    rides: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    vehicleInfo: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    declineButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    acceptButton: {
        flex: 1.5,
        backgroundColor: '#CCFF00', // Lime green like image
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
    },
    acceptText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        zIndex: 1,
    },
    acceptHighlight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 20,
        backgroundColor: '#B2DF00', // Darker lime
    },
});
