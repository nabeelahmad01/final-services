import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, SIZES } from '@/constants/theme';

export default function SplashScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                entering={FadeIn.duration(800)}
                exiting={FadeOut.duration(400)}
                style={styles.content}
            >
                {/* Logo Icon - Placeholder for now */}
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>FK</Text>
                    </View>
                </View>

                {/* App Name */}
                <Text style={styles.appName}>FixKar</Text>

                {/* Tagline */}
                <Text style={styles.tagline}>Your On-Demand Service Marketplace</Text>

                {/* Loading Indicator */}
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingDot} />
                    <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
                    <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding * 2,
    },
    logoContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    iconText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    appName: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 12,
    },
    tagline: {
        fontSize: SIZES.base,
        color: COLORS.white,
        opacity: 0.9,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        flexDirection: 'row',
        marginTop: 60,
        gap: 12,
    },
    loadingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.white,
        opacity: 0.6,
    },
    loadingDotDelay1: {
        opacity: 0.4,
    },
    loadingDotDelay2: {
        opacity: 0.2,
    },
});
