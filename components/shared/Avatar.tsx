import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface AvatarProps {
    uri?: string;
    name: string;
    size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
    uri,
    name,
    size = 48
}) => {
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            {uri ? (
                <Image source={{ uri }} style={styles.image} />
            ) : (
                <Text style={[styles.initials, { fontSize: size / 2.5 }]}>
                    {getInitials(name)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    initials: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});
