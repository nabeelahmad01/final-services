import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity, ViewProps } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
    onPress?: () => void;
}

export const Card = ({
    children,
    style,
    elevated = true,
    onPress,
    ...props
}: CardProps) => {
    const cardStyle = [styles.card, elevated && SHADOWS.medium, style];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7} {...(props as any)}>
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle} {...props}>
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
