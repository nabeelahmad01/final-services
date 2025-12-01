import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

export default function RateMechanicScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { activeBooking } = useBookingStore();
    const { showModal } = useModal();

    const [rating, setRating] = useState<number>(0);
    const [feedback, setFeedback] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const mechanicName = params.mechanicName as string || 'Mechanic';
    const mechanicPhoto = params.mechanicPhoto as string;
    const bookingId = params.bookingId as string;
    const mechanicId = params.mechanicId as string;

    const handleRatingPress = (value: number) => {
        setRating(value);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            showErrorModal(showModal, 'Error', 'Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const { addDoc, collection, doc, updateDoc, getDoc } = require('firebase/firestore');
            const { firestore } = require('@/services/firebase/config');

            // Create rating document
            await addDoc(collection(firestore, 'ratings'), {
                bookingId,
                customerId: user?.id,
                mechanicId,
                rating,
                feedback: feedback.trim() || null,
                createdAt: new Date(),
            });

            // Update mechanic's rating
            const mechanicRef = doc(firestore, 'mechanics', mechanicId);
            const mechanicSnap = await getDoc(mechanicRef);

            if (mechanicSnap.exists()) {
                const mechanicData = mechanicSnap.data();
                const currentRating = mechanicData.rating || 0;
                const totalRatings = mechanicData.totalRatings || 0;

                // Calculate new average
                const newTotalRatings = totalRatings + 1;
                const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

                await updateDoc(mechanicRef, {
                    rating: newRating,
                    totalRatings: newTotalRatings,
                });
            }

            showSuccessModal(
                showModal,
                'Thank You!',
                'Your rating has been submitted successfully.',
                () => router.replace('/(customer)/home')
            );
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Rate Your Experience</Text>
                    <Text style={styles.headerSubtitle}>
                        Help us improve our service
                    </Text>
                </View>

                {/* Mechanic Info */}
                <View style={styles.mechanicCard}>
                    {mechanicPhoto ? (
                        <View style={styles.mechanicPhotoContainer}>
                            <Text style={styles.mechanicPhotoPlaceholder}>
                                {mechanicName.charAt(0)}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.mechanicPhotoContainer}>
                            <Ionicons name="person" size={48} color={COLORS.textSecondary} />
                        </View>
                    )}
                    <Text style={styles.mechanicName}>{mechanicName}</Text>
                    <Text style={styles.serviceType}>Service Completed</Text>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingContainer}>
                    <Text style={styles.ratingLabel}>How would you rate the service?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleRatingPress(star)}
                                style={styles.starButton}
                            >
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={48}
                                    color={star <= rating ? COLORS.warning : COLORS.border}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingText}>
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </Text>
                    )}
                </View>

                {/* Feedback */}
                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>
                        Additional Comments (Optional)
                    </Text>
                    <TextInput
                        style={styles.feedbackInput}
                        placeholder="Share your experience..."
                        placeholderTextColor={COLORS.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={feedback}
                        onChangeText={setFeedback}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        rating === 0 && styles.submitButtonDisabled,
                        submitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={rating === 0 || submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                    </Text>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.replace('/(customer)/home')}
                >
                    <Text style={styles.skipButtonText}>Skip for Now</Text>
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
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    mechanicCard: {
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    mechanicPhotoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    mechanicPhotoPlaceholder: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    mechanicName: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    serviceType: {
        fontSize: SIZES.sm,
        color: COLORS.success,
        fontWeight: '600',
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    ratingLabel: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.primary,
    },
    feedbackContainer: {
        marginBottom: 24,
    },
    feedbackLabel: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    feedbackInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: SIZES.base,
        color: COLORS.text,
        minHeight: 120,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.border,
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.white,
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});
