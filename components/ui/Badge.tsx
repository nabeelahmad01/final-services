import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

interface BadgeProps {
    text: string;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
    style?: TextStyle;
}

export function Badge({ text, variant = 'default', style }: BadgeProps) {
    const backgroundColor = {
        success: COLORS.success + '20',
        danger: COLORS.danger + '20',
        warning: COLORS.warning + '20',
        info: COLORS.primary + '20',
        default: COLORS.border,
    }[variant];

    const textColor = {
        success: COLORS.success,
        danger: COLORS.danger,
        warning: COLORS.warning,
        info: COLORS.primary,
        default: COLORS.text,
    }[variant];

    return (
        <Text style={[styles.badge, { backgroundColor, color: textColor }, style]}>
            {text}
        </Text>
    );
}

const styles = StyleSheet.create({
    badge: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
});
