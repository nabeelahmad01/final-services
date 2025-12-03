import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBannerStore, BannerType } from '@/stores/useBannerStore';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { playNotificationSound } from '@/services/audioService';

const { width } = Dimensions.get('window');

const getBannerStyles = (type: BannerType) => {
    switch (type) {
        case 'success':
            return {
                backgroundColor: COLORS.success,
                icon: 'checkmark-circle' as const,
            };
        case 'error':
            return {
                backgroundColor: COLORS.danger,
                icon: 'alert-circle' as const,
            };
        case 'warning':
            return {
                backgroundColor: COLORS.warning,
                icon: 'warning' as const,
            };
        case 'info':
        default:
            return {
                backgroundColor: COLORS.primary,
                icon: 'information-circle' as const,
            };
    }
};

export const BannerNotification: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { currentBanner, hideBanner } = useBannerStore();
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const panAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentBanner) {
            // Play sound when banner appears
            playNotificationSound();

            // Slide down animation
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            // Slide up animation
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [currentBanner]);

    if (!currentBanner) return null;

    const bannerStyle = getBannerStyles(currentBanner.type);

    const handlePress = () => {
        if (currentBanner.onPress) {
            currentBanner.onPress();
        }
        hideBanner();
    };

    const handleSwipeUp = () => {
        Animated.timing(panAnim, {
            toValue: -200,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            panAnim.setValue(0);
            hideBanner();
        });
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 8,
                    transform: [
                        { translateY: slideAnim },
                        { translateY: panAnim },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={[styles.banner, { backgroundColor: bannerStyle.backgroundColor }]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={bannerStyle.icon} size={24} color={COLORS.white} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {currentBanner.title}
                    </Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {currentBanner.message}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleSwipeUp}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingHorizontal: 16,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 2,
    },
    message: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.white + 'E6', // 90% opacity
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});
