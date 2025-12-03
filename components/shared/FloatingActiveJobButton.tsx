import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SIZES } from '@/constants/theme';

export const FloatingActiveJobButton: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { activeBooking } = useBookingStore();
    const { user } = useAuthStore();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulsing animation
    useEffect(() => {
        if (!activeBooking) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();

        return () => pulse.stop();
    }, [activeBooking]);

    // Don't show if no active booking
    if (!activeBooking || !user) return null;

    // Don't show on active job screens
    const hideOnScreens = [
        '/(mechanic)/active-job',
        '/(customer)/tracking',
    ];

    if (hideOnScreens.some(screen => pathname?.includes(screen))) {
        return null;
    }

    const handlePress = () => {
        // Navigate based on user role
        if (user.role === 'mechanic') {
            router.push('/(mechanic)/active-job');
        } else {
            router.push('/(customer)/tracking');
        }
    };

    const label = user.role === 'mechanic' ? 'Active Job' : 'Track Mechanic';
    const icon = user.role === 'mechanic' ? 'briefcase' : 'navigate';

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ scale: pulseAnim }] }
            ]}
        >
            <TouchableOpacity
                style={styles.button}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={COLORS.white} />
                </View>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.badge}>
                    <View style={styles.badgeDot} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        right: 20,
        zIndex: 9998,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.white,
    },
});
