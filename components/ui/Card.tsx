import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    elevated = true
}) => {
    return (
        <View style={[styles.card, elevated && SHADOWS.medium, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius,
        padding: SIZES.padding,
    },
});
