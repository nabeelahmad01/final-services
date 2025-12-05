import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { Rating } from '@/components/ui/Rating';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { addReview } from '@/services/firebase/reviewService';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showWarningModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

export default function LeaveReview() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    const bookingId = params.bookingId as string;
    const mechanicName = params.mechanicName as string || 'Mechanic';
    const mechanicId = params.mechanicId as string;

    const handleSubmit = async () => {
        if (rating === 0) {
            showWarningModal(showModal, 'Rating Required', 'Please select a rating before submitting');
            return;
        }

        setLoading(true);
        try {
            await addReview(
                bookingId || 'test-booking',
                mechanicId || 'test-mechanic',
                user?.id || 'anonymous',
                user?.name || 'Customer',
                user?.profilePic || undefined,
                rating,
                review
            );

            showSuccessModal(
                showModal,
                'Review Submitted',
                'Thank you for your feedback!',
                () => router.push('/(customer)/home')
            );
        } catch (error: any) {
            console.error('Review error:', error);
            showErrorModal(showModal, 'Error', 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave a Review</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Mechanic Info */}
                <Card style={styles.mechanicCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{mechanicName.charAt(0)}</Text>
                    </View>
                    <Text style={styles.mechanicName}>{mechanicName}</Text>
                    <Text style={styles.subtitle}>How was your experience?</Text>
                </Card>

                {/* Star Rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Rating</Text>
                    <View style={styles.ratingContainer}>
                        <Rating
                            rating={rating}
                            maxRating={5}
                            size={40}
                            editable
                            onChange={setRating}
                        />
                    </View>
                    <Text style={styles.ratingText}>
                        {rating === 0 && 'Tap to rate'}
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                    </Text>
                </View>

                {/* Review Text */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share your experience with others..."
                        value={review}
                        onChangeText={setReview}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        placeholderTextColor={COLORS.textSecondary}
                    />
                </View>

                {/* Submit Button */}
                <Button
                    title="Submit Review"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={rating === 0}
                    style={styles.submitButton}
                />

                {/* Skip Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.skipButton}
                >
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    mechanicCard: {
        alignItems: 'center',
        padding: SIZES.padding * 2,
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    mechanicName: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    ratingContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        marginTop: 12,
    },
    textInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SIZES.padding,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 120,
    },
    submitButton: {
        marginBottom: 12,
    },
    skipButton: {
        alignItems: 'center',
        padding: 12,
    },
    skipText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
});
