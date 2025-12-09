import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, CATEGORIES } from '@/constants/theme';
import { ServiceRequest } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { playServiceRequestRingtone, stopServiceRequestRingtone } from '@/services/audioService';

interface ServiceRequestModalProps {
    request: ServiceRequest | null;
    onSubmitProposal: (price: string, time: string, message: string) => Promise<void> | void;
    onCancel: () => void;
}

const { width } = Dimensions.get('window');

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
    request,
    onSubmitProposal,
    onCancel,
}) => {
    const [price, setPrice] = useState('');
    const [time, setTime] = useState('30 min');
    const [message, setMessage] = useState('I can help you with this!');
    const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Play ringtone when modal opens, stop when closed
    useEffect(() => {
        if (request) {
            // Play ringtone
            playServiceRequestRingtone();
        } else {
            // Stop ringtone
            stopServiceRequestRingtone();
        }

        return () => {
            stopServiceRequestRingtone();
        };
    }, [!!request]);

    // Reset state when new request arrives
    useEffect(() => {
        if (request) {
            setPrice(request.offeredPrice?.toString() || '');
            setTime('30 min');
            setMessage('I can help you with this!');
            setTimeRemaining(120);
            setIsSubmitting(false); // Reset submission state
        }
    }, [request?.id]);

    // Countdown timer
    useEffect(() => {
        if (!request) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onCancel(); // Auto-cancel after 2 minutes
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [request?.id]);

    // Pulsing animation for urgency
    useEffect(() => {
        if (!request) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        return () => pulse.stop();
    }, [request]);

    if (!request) return null;

    const category = CATEGORIES.find((c) => c.id === request.category);
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const isUrgent = timeRemaining < 30;

    const handleSubmit = async () => {
        if (!price || !time || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await onSubmitProposal(price, time, message);
        } catch (error) {
            console.error('Error submitting proposal:', error);
            setIsSubmitting(false); // Re-enable on error
        }
    };

    return (
        <Modal
            visible={!!request}
            animationType="slide"
            transparent
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ scale: pulseAnim }] }]}>
                    {/* Timer Badge */}
                    <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                        <Ionicons
                            name="timer-outline"
                            size={16}
                            color={isUrgent ? COLORS.danger : COLORS.white}
                        />
                        <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
                            {minutes}:{seconds.toString().padStart(2, '0')}
                        </Text>
                    </View>

                    {/* Header */}
                    <LinearGradient
                        colors={[category?.color || COLORS.primary, COLORS.primaryDark]}
                        style={styles.header}
                    >
                        <View style={styles.categoryIcon}>
                            <Ionicons name={category?.icon as any} size={32} color={COLORS.white} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>New Service Request</Text>
                            <Text style={styles.subtitle}>{category?.name}</Text>
                        </View>
                    </LinearGradient>

                    {/* Customer Info */}
                    <View style={styles.customerSection}>
                        <View style={styles.customerRow}>
                            <Ionicons name="person" size={20} color={COLORS.textSecondary} />
                            <Text style={styles.customerName}>{request.customerName}</Text>
                        </View>
                        <Text style={styles.description}>{request.description}</Text>
                    </View>

                    {/* Price Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Your Price (PKR)</Text>
                        <View style={styles.priceInputContainer}>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="Enter price"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                            <TouchableOpacity
                                style={styles.suggestedPriceButton}
                                onPress={() => setPrice(request.offeredPrice?.toString() || '')}
                            >
                                <Text style={styles.suggestedPriceText}>
                                    Use PKR {request.offeredPrice || 260}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Time Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Estimated Time</Text>
                        <TextInput
                            style={styles.input}
                            value={time}
                            onChangeText={setTime}
                            placeholder="e.g., 30 min, 1 hour"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, (!price || !time || isSubmitting) && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!price || !time || isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            )}
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Diamond Cost */}
                    <View style={styles.costNote}>
                        <Ionicons name="diamond" size={14} color={COLORS.primary} />
                        <Text style={styles.costNoteText}>1 Diamond will be deducted</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    timerBadge: {
        position: 'absolute',
        top: -15,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    timerBadgeUrgent: {
        backgroundColor: COLORS.danger,
    },
    timerText: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    timerTextUrgent: {
        color: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: SIZES.base,
        color: COLORS.white,
        opacity: 0.9,
    },
    customerSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    customerName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    description: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    inputSection: {
        paddingHorizontal: 20,
        marginTop: 16,
    },
    label: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    priceInputContainer: {
        gap: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    suggestedPriceButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.primary + '15',
        borderRadius: 8,
    },
    suggestedPriceText: {
        fontSize: SIZES.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    costNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    costNoteText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
});
