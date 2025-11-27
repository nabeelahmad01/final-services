import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    // Animation values
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(0);
    const pulseScale = useSharedValue(1);
    const shimmerX = useSharedValue(-width);

    useEffect(() => {
        // Logo entrance animation
        logoScale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
        });

        // Subtle rotation
        logoRotate.value = withSequence(
            withTiming(-5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            withTiming(5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        );

        // Pulsing effect
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );

        // Shimmer effect
        shimmerX.value = withRepeat(
            withTiming(width, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: logoScale.value },
                { rotate: `${logoRotate.value}deg` },
            ],
        };
    });

    const pulseAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pulseScale.value }],
        };
    });

    return (
        <View style={styles.container}>
            {/* Gradient Background */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark || '#1a4d8f', '#0f2742']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative circles */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            <SafeAreaView style={styles.safeArea}>
                <Animated.View
                    entering={FadeIn.duration(600)}
                    style={styles.content}
                >
                    {/* Pulsing Glow Effect */}
                    <Animated.View style={[styles.glowContainer, pulseAnimatedStyle]}>
                        <View style={styles.glow} />
                    </Animated.View>

                    {/* Logo Container */}
                    <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                        <LinearGradient
                            colors={['#ffffff', '#f0f0f0']}
                            style={styles.logoGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.logoInner}>
                                <Ionicons name="construct" size={56} color={COLORS.primary} />
                                <View style={styles.logoAccent}>
                                    <Ionicons name="flash" size={24} color={COLORS.warning} />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* App Name with Animation */}
                    <Animated.View
                        entering={FadeInUp.delay(300).duration(800).springify()}
                    >
                        <Text style={styles.appName}>FixKar</Text>
                        <View style={styles.underline} />
                    </Animated.View>

                    {/* Tagline */}
                    <Animated.Text
                        entering={FadeInDown.delay(500).duration(800)}
                        style={styles.tagline}
                    >
                        Your On-Demand Service Experts
                    </Animated.Text>

                    {/* Features Pills */}
                    <Animated.View
                        entering={FadeInUp.delay(700).duration(800)}
                        style={styles.featuresContainer}
                    >
                        <View style={styles.featurePill}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.featureText}>Verified Mechanics</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <Ionicons name="time" size={16} color={COLORS.warning} />
                            <Text style={styles.featureText}>Quick Service</Text>
                        </View>
                        <View style={styles.featurePill}>
                            <Ionicons name="shield-checkmark" size={16} color={COLORS.info} />
                            <Text style={styles.featureText}>Trusted Platform</Text>
                        </View>
                    </Animated.View>

                    {/* Loading Animation */}
                    <Animated.View
                        entering={FadeIn.delay(900).duration(800)}
                        style={styles.loadingContainer}
                    >
                        <View style={styles.loadingBar}>
                            <LinearGradient
                                colors={['#ffffff40', '#ffffff', '#ffffff40']}
                                style={styles.loadingBarFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                        <Text style={styles.loadingText}>Loading your experience...</Text>
                    </Animated.View>

                    {/* Bottom Branding */}
                    <Animated.View
                        entering={FadeIn.delay(1100).duration(800)}
                        style={styles.bottomBranding}
                    >
                        <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff60" />
                        <Text style={styles.brandingText}>100% Secure & Reliable</Text>
                    </Animated.View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    safeArea: {
        flex: 1,
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#ffffff10',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#ffffff08',
    },
    decorativeCircle3: {
        position: 'absolute',
        top: height * 0.4,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#ffffff05',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding * 2,
    },
    glowContainer: {
        position: 'absolute',
        top: height * 0.25,
    },
    glow: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#ffffff',
        opacity: 0.1,
    },
    logoContainer: {
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    logoGradient: {
        width: 140,
        height: 140,
        borderRadius: 70,
        padding: 4,
    },
    logoInner: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 66,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    logoAccent: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.warning,
        shadowColor: COLORS.warning,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
    },
    appName: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: '#00000040',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    underline: {
        width: 100,
        height: 4,
        backgroundColor: COLORS.warning,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
    tagline: {
        fontSize: SIZES.lg,
        color: '#ffffffd0',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginTop: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 32,
        paddingHorizontal: 20,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff20',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffffff30',
    },
    featureText: {
        color: '#ffffff',
        fontSize: SIZES.sm,
        fontWeight: '600',
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        width: '80%',
    },
    loadingBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#ffffff20',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 12,
    },
    loadingBarFill: {
        width: '70%',
        height: '100%',
    },
    loadingText: {
        color: '#ffffffa0',
        fontSize: SIZES.sm,
        fontWeight: '500',
    },
    bottomBranding: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandingText: {
        color: '#ffffff60',
        fontSize: SIZES.sm,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
