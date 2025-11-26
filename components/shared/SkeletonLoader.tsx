import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonLoaderProps) {
    const opacity = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <SkeletonLoader width="100%" height={120} borderRadius={12} />
            <View style={styles.content}>
                <SkeletonLoader width="70%" height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="50%" height={16} />
            </View>
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View style={styles.list}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.border,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SIZES.padding,
        marginBottom: 12,
    },
    content: {
        marginTop: 12,
    },
    list: {
        gap: 12,
    },
});
