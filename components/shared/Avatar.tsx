import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface AvatarProps {
    uri?: string;
    photo?: string;
    name?: string;
    size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
    uri,
    photo,
    name = 'User',
    size = 48
}) => {
    const imageUri = uri || photo;

    const getInitials = (displayName: string) => {
        if (!displayName || displayName.trim() === '') {
            return 'U';
        }
        const parts = displayName.trim().split(' ');
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return displayName.substring(0, 2).toUpperCase();
    };

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
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
