import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest } from '@/types';
import { playNotificationSound } from '@/services/audioService';

const { width } = Dimensions.get('window');

interface ServiceRequestModalProps {
    visible: boolean;
    request: ServiceRequest | null;
    onAccept: () => void;
    onDecline: () => void;
    onTimeout: () => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
    visible,
    request,
    onAccept,
    onDecline,
    onTimeout,
}) => {
    const [timeLeft, setTimeLeft] = useState(60); // 3 minutes in seconds

    useEffect(() => {
        if (visible && request) {
            setTimeLeft(60);
            playNotificationSound();
        }
    }, [visible, request]);

    useEffect(() => {
        if (!visible || !request) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [visible, request]);




    if (!request) return null;

    const category = CATEGORIES.find((c) => c.id === request.category);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Timer Bar */}
                    <View style={styles.timerContainer}>
                        <View style={styles.timerContent}>
                            <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                            <Text style={styles.timerText}>
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${(timeLeft / 180) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View
                                style={[
                                    styles.categoryIcon,
                                    { backgroundColor: category?.color + '20' },
                                ]}
                            >
                                <Ionicons
                                    name={category?.icon as any}
                                    size={32}
                                    color={category?.color}
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.categoryName}>{category?.name}</Text>
                                <Text style={styles.customerName}>{request.customerName}</Text>
                            </View>
                        </View>
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>PKR {request.offeredPrice || 260}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{request.description}</Text>
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Location</Text>
                        </View>
                        <Text style={styles.address}>
                            {request.location?.address || 'Location not available'}
                        </Text>
                    </View>

                    {/* Distance Badge */}
                    <View style={styles.distanceBadge}>
                        <Ionicons name="navigate-outline" size={16} color={COLORS.success} />
                        <Text style={styles.distanceText}>Nearby</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={onDecline}
                        >
                            <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                            <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={onAccept}
                        >
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                            <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
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
    timerContainer: {
        marginBottom: 20,
    },
    timerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.warning,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.warning,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    customerName: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
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
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    address: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 20,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.success,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    declineButton: {
        backgroundColor: COLORS.danger + '15',
        borderWidth: 1,
        borderColor: COLORS.danger + '30',
    },
    declineText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.danger,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    acceptText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
