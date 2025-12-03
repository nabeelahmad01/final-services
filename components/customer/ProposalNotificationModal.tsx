import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { COLORS } from '@/constants/theme';
import { Proposal } from '@/types';
import { playNotificationSound } from '@/services/firebase/notifications';

const { width } = Dimensions.get('window');

interface ProposalNotificationModalProps {
    visible: boolean;
    proposal: Proposal | null;
    onView: () => void;
    onClose: () => void;
}

export const ProposalNotificationModal: React.FC<ProposalNotificationModalProps> = ({
    visible,
    proposal,
    onView,
    onClose,
}) => {
    useEffect(() => {
        if (visible && proposal) {
            playNotificationSound();
        }
    }, [visible, proposal]);

    if (!proposal) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>New Proposal Received!</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Mechanic Info */}
                    <View style={styles.mechanicInfo}>
                        <Avatar
                            uri={proposal.mechanicPhoto}
                            name={proposal.mechanicName}
                            size={60}
                        />
                        <View style={styles.infoContent}>
                            <Text style={styles.mechanicName}>{proposal.mechanicName}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color={COLORS.warning} />
                                <Text style={styles.ratingText}>
                                    {proposal.mechanicRating.toFixed(1)} ({proposal.mechanicTotalRatings})
                                </Text>
                            </View>
                        </View>
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>PKR {proposal.price}</Text>
                        </View>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.detailText}>{proposal.estimatedTime}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.detailText}>{proposal.distance.toFixed(1)} km away</Text>
                        </View>
                    </View>

                    {/* Message */}
                    {proposal.message && (
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageLabel}>Message:</Text>
                            <Text style={styles.messageText} numberOfLines={2}>
                                {proposal.message}
                            </Text>
                        </View>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity style={styles.button} onPress={onView}>
                        <Text style={styles.buttonText}>View Proposal</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width - 40,
        maxWidth: 400,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    mechanicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoContent: {
        flex: 1,
    },
    mechanicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    priceBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    detailsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.background,
        padding: 10,
        borderRadius: 12,
        flex: 1,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    messageContainer: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    messageLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    button: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
