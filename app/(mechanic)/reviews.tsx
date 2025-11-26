import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Card, EmptyState } from '@/components';
import { Rating } from '@/components/ui/Rating';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function Reviews() {
    const router = useRouter();
    const { user } = useAuthStore();

    // TODO: Fetch reviews from Firestore
    const [reviews, setReviews] = useState<any[]>([]);

    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Reviews</Text>
                {reviews.length > 0 && (
                    <View style={styles.ratingHeader}>
                        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                        <Rating rating={averageRating} size={20} />
                        <Text style={styles.reviewCount}>
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {reviews.length === 0 ? (
                    <EmptyState
                        icon="star-outline"
                        title="No Reviews Yet"
                        message="Reviews from your customers will appear here. Complete more jobs to start receiving reviews!"
                        actionLabel="View Available Jobs"
                        onAction={() => router.push('/(mechanic)/requests')}
                    />
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.customerInfo}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {review.customerName.charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.customerName}>{review.customerName}</Text>
                                        <Text style={styles.reviewDate}>{review.date}</Text>
                                    </View>
                                </View>
                                <Rating rating={review.rating} size={16} />
                            </View>

                            {review.comment && (
                                <Text style={styles.reviewComment}>{review.comment}</Text>
                            )}

                            <View style={styles.reviewFooter}>
                                <View style={styles.jobInfo}>
                                    <Ionicons name="construct" size={16} color={COLORS.textSecondary} />
                                    <Text style={styles.jobCategory}>{review.category}</Text>
                                </View>
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 8,
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    averageRating: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    reviewCount: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.padding,
        flexGrow: 1,
    },
    reviewCard: {
        padding: SIZES.padding,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    customerInfo: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    customerName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    reviewComment: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    reviewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    jobInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    jobCategory: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
});
