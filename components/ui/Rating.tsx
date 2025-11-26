import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface RatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    editable?: boolean;
    onChange?: (rating: number) => void;
}

export function Rating({ rating, maxRating = 5, size = 20, editable = false, onChange }: RatingProps) {
    const handlePress = (index: number) => {
        if (editable && onChange) {
            onChange(index + 1);
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const filled = index < Math.floor(rating);
                const halfFilled = index < rating && index >= Math.floor(rating);

                const Component = editable ? TouchableOpacity : View;

                return (
                    <Component
                        key={index}
                        onPress={() => handlePress(index)}
                        disabled={!editable}
                        style={styles.star}
                    >
                        <Ionicons
                            name={filled ? 'star' : halfFilled ? 'star-half' : 'star-outline'}
                            size={size}
                            color={COLORS.warning}
                        />
                    </Component>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 2,
    },
});
