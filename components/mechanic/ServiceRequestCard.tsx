import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest } from '@/types';

interface ServiceRequestCardProps {
    request: ServiceRequest;
    onAccept: () => void;
}

export const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({
    request,
    onAccept,
}) => {
    const category = CATEGORIES.find((c) => c.id === request.category);

    return (
        <View style={styles.card}>
            {/* Price Badge - Top Right */}
            <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>PKR</Text>
                <Text style={styles.priceValue}>{request.offeredPrice || 260}</Text>
            </View>

            {/* Category Badge - Below Price */}
            <View style={[styles.categoryBadge, { backgroundColor: category?.color || COLORS.primary }]}>
                <Ionicons name={category?.icon as any || 'construct'} size={14} color={COLORS.white} />
                <Text style={styles.categoryText}>{category?.name || 'Service'}</Text>
            </View>

            {/* Customer Info - Left Side */}
            <View style={styles.customerInfo}>
                {/* Profile Photo */}
                <View style={styles.profilePhotoContainer}>
                    {request.customerPhoto ? (
                        <Image
                            source={{ uri: request.customerPhoto }}
                            style={styles.profilePhoto}
                        />
                    ) : (
                        <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                            <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                        </View>
                    )}
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    {/* Customer Name */}
                    <Text style={styles.customerName}>{request.customerName}</Text>

                    {/* Location */}
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {request.location?.address || 'Location available'}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>
                        {request.description}
                    </Text>
                </View>
            </View>

            {/* Accept Button */}
            <TouchableOpacity
                style={styles.acceptButton}
                onPress={onAccept}
                activeOpacity={0.8}
            >
                <Text style={styles.acceptButtonText}>View & Submit Proposal</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    priceContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    priceLabel: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    categoryBadge: {
        position: 'absolute',
        top: 70,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        zIndex: 10,
    },
    categoryText: {
        color: COLORS.white,
        fontSize: SIZES.xs,
        fontWeight: '600',
    },
    customerInfo: {
        flexDirection: 'row',
        marginBottom: 16,
        marginRight: 100, // Space for price
    },
    profilePhotoContainer: {
        marginRight: 12,
    },
    profilePhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.border,
    },
    placeholderPhoto: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    customerName: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    locationText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        flex: 1,
    },
    description: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 18,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 25,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptButtonText: {
        fontSize: SIZES.base,
        fontWeight: '700',
        color: COLORS.white,
    },
});
