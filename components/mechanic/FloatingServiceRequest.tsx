import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest } from '@/types';
import { playNotificationSound } from '@/services/audioService';

const { width } = Dimensions.get('window');

interface FloatingServiceRequestProps {
    requests: ServiceRequest[];
    onAccept: (request: ServiceRequest) => void;
    onCancel: (requestId: string) => void;
}

export const FloatingServiceRequest: React.FC<FloatingServiceRequestProps> = ({
    requests,
    onAccept,
    onCancel,
}) => {
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Filter out dismissed requests
    const activeRequests = requests.filter(r => !dismissedIds.has(r.id));
    const currentRequest = activeRequests[currentIndex] || null;

    useEffect(() => {
        if (currentRequest) {
            // Play notification sound
            playNotificationSound();

            // Animate slide down
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            // Slide up when no requests
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [currentRequest?.id]);

    const handleAccept = () => {
        if (currentRequest) {
            onAccept(currentRequest);
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        if (currentRequest) {
            // Animate out
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setDismissedIds(prev => new Set(prev).add(currentRequest.id));
                onCancel(currentRequest.id);

                // Move to next request
                if (currentIndex < activeRequests.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    setCurrentIndex(0);
                }
            });
        }
    };

    const handleNext = () => {
        if (activeRequests.length > 1) {
            Animated.sequence([
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
            ]).start();

            setCurrentIndex(prev => (prev + 1) % activeRequests.length);
        }
    };

    if (!currentRequest) return null;

    const category = CATEGORIES.find((c) => c.id === currentRequest.category);

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={styles.card}>
                {/* Request count indicator */}
                {activeRequests.length > 1 && (
                    <TouchableOpacity style={styles.countBadge} onPress={handleNext}>
                        <Text style={styles.countText}>
                            {currentIndex + 1}/{activeRequests.length}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.white} />
                    </TouchableOpacity>
                )}

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Left: Customer Photo */}
                    <View style={styles.photoContainer}>
                        {currentRequest.customerPhoto ? (
                            <Image
                                source={{ uri: currentRequest.customerPhoto }}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={[styles.photo, styles.placeholderPhoto]}>
                                <Ionicons name="person" size={28} color={COLORS.textSecondary} />
                            </View>
                        )}
                    </View>

                    {/* Center: Info */}
                    <View style={styles.info}>
                        <View style={styles.headerRow}>
                            <Text style={styles.customerName} numberOfLines={1}>
                                {currentRequest.customerName}
                            </Text>
                            <View style={[styles.categoryTag, { backgroundColor: category?.color || COLORS.primary }]}>
                                <Text style={styles.categoryText}>{category?.name || 'Service'}</Text>
                            </View>
                        </View>
                        <Text style={styles.description} numberOfLines={1}>
                            {currentRequest.description}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Offered: </Text>
                            <Text style={styles.priceValue}>PKR {currentRequest.offeredPrice || 260}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleDismiss}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close" size={20} color={COLORS.danger} />
                        <Text style={styles.cancelText}>Skip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={handleAccept}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark" size={20} color={COLORS.white} />
                        <Text style={styles.acceptText}>View & Accept</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 140,
        left: 12,
        right: 12,
        zIndex: 9999,
        elevation: 999,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    countBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 2,
    },
    countText: {
        fontSize: SIZES.xs,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    photoContainer: {
        marginRight: 12,
    },
    photo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.border,
    },
    placeholderPhoto: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    customerName: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.white,
    },
    description: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: COLORS.danger + '15',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger + '30',
    },
    cancelText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.danger,
    },
    acceptButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    acceptText: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
