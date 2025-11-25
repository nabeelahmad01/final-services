import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const buttonStyles = [
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`text_${variant}`],
        styles[`text_${size}`],
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? COLORS.primary : COLORS.white}
                />
            ) : (
                <>
                    {icon && icon}
                    <Text style={textStyles}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: SIZES.borderRadius,
        gap: 8,
    },
    button_primary: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.small,
    },
    button_secondary: {
        backgroundColor: COLORS.secondary,
        ...SHADOWS.small,
    },
    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    button_danger: {
        backgroundColor: COLORS.danger,
        ...SHADOWS.small,
    },
    button_small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    button_medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    button_large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    button_disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: '600',
    },
    text_primary: {
        color: COLORS.white,
    },
    text_secondary: {
        color: COLORS.white,
    },
    text_outline: {
        color: COLORS.primary,
    },
    text_danger: {
        color: COLORS.white,
    },
    text_small: {
        fontSize: SIZES.sm,
    },
    text_medium: {
        fontSize: SIZES.base,
    },
    text_large: {
        fontSize: SIZES.lg,
    },
});
