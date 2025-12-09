import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToFavorites, removeFromFavorites, createOrGetChat } from '@/services/firebase/firestore';
import { Card, EmptyState } from '@/components';
import { Avatar } from '@/components/shared/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { COLORS, SIZES, FONTS, CATEGORIES } from '@/constants/theme';
import { FavoriteMechanic } from '@/types';

export default function Favorites() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [favorites, setFavorites] = useState<FavoriteMechanic[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = subscribeToFavorites(user.id, (favs) => {
            setFavorites(favs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleRemoveFavorite = async (mechanicId: string) => {
        if (!user?.id) return;

        Alert.alert(
            'Remove Favorite',
            'Are you sure you want to remove this mechanic from favorites?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setRemovingId(mechanicId);
                        try {
                            await removeFromFavorites(user.id, mechanicId);
                        } catch (error) {
                            console.error('Error removing favorite:', error);
                        } finally {
                            setRemovingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleChat = async (mechanic: FavoriteMechanic) => {
        if (!user?.id) return;

        try {
            const chatId = await createOrGetChat(user.id, mechanic.mechanicId);
            router.push({
                pathname: '/(shared)/chat',
                params: {
                    chatId,
                    recipientId: mechanic.mechanicId,
                    recipientName: mechanic.mechanicName,
                    recipientPhoto: mechanic.mechanicPhoto || '',
                },
            });
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    };

    const handleCall = (mechanic: FavoriteMechanic) => {
        router.push({
            pathname: '/(shared)/call',
            params: {
                userId: mechanic.mechanicId,
                userName: mechanic.mechanicName,
                userPhoto: mechanic.mechanicPhoto || '',
                callType: 'voice',
            },
        });
    };

    const handleBookNow = (mechanic: FavoriteMechanic) => {
        // Navigate to service request with mechanic pre-selected
        const category = mechanic.categories?.[0] || 'car_mechanic';
        router.push({
            pathname: '/(customer)/service-request',
            params: {
                category,
                mechanicId: mechanic.mechanicId,
                mechanicName: mechanic.mechanicName,
            },
        });
    };

    const handleScheduleBooking = (mechanic: FavoriteMechanic) => {
        router.push({
            pathname: '/(customer)/schedule-booking',
            params: {
                mechanicId: mechanic.mechanicId,
                mechanicName: mechanic.mechanicName,
                mechanicPhoto: mechanic.mechanicPhoto || '',
                mechanicRating: mechanic.mechanicRating.toString(),
                category: mechanic.categories?.[0] || 'car_mechanic',
            },
        });
    };

    const getCategoryNames = (categories: string[]) => {
        return categories
            .map((cat) => CATEGORIES.find((c) => c.id === cat)?.name || cat)
            .join(', ');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favorites</Text>
                <Text style={styles.headerSubtitle}>
                    Your saved mechanics for quick access
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {favorites.length === 0 ? (
                    <EmptyState
                        icon="heart-outline"
                        title="No Favorites Yet"
                        message="Save your favorite mechanics for quick rebooking. Look for the heart icon when viewing mechanic profiles."
                        actionLabel="Find Mechanics"
                        onAction={() => router.push('/(customer)/home')}
                    />
                ) : (
                    favorites.map((mechanic) => (
                        <Card key={mechanic.id} style={styles.mechanicCard}>
                            {/* Header with Avatar and Favorite Button */}
                            <View style={styles.mechanicHeader}>
                                <View style={styles.mechanicInfo}>
                                    <Avatar
                                        name={mechanic.mechanicName}
                                        uri={mechanic.mechanicPhoto}
                                        size={56}
                                    />
                                    <View style={styles.mechanicDetails}>
                                        <Text style={styles.mechanicName}>{mechanic.mechanicName}</Text>
                                        <View style={styles.ratingContainer}>
                                            <Rating rating={mechanic.mechanicRating} size={16} />
                                            <Text style={styles.ratingText}>
                                                ({mechanic.mechanicTotalRatings})
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveFavorite(mechanic.mechanicId)}
                                    disabled={removingId === mechanic.mechanicId}
                                    style={styles.heartButton}
                                >
                                    <Ionicons
                                        name="heart"
                                        size={24}
                                        color={removingId === mechanic.mechanicId ? COLORS.textSecondary : COLORS.danger}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Categories */}
                            <Text style={styles.category}>
                                {getCategoryNames(mechanic.categories)}
                            </Text>

                            {/* Stats */}
                            <Text style={styles.completedJobs}>
                                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} /> {mechanic.completedJobs} jobs completed
                            </Text>

                            {/* Action Buttons */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.chatButton]}
                                    onPress={() => handleChat(mechanic)}
                                >
                                    <Ionicons name="chatbubble" size={18} color={COLORS.white} />
                                    <Text style={styles.actionButtonText}>Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.callButton]}
                                    onPress={() => handleCall(mechanic)}
                                >
                                    <Ionicons name="call" size={18} color={COLORS.white} />
                                    <Text style={styles.actionButtonText}>Call</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Booking Buttons */}
                            <View style={styles.bookingButtons}>
                                <Button
                                    title="Book Now"
                                    onPress={() => handleBookNow(mechanic)}
                                    style={styles.bookNowButton}
                                    icon={<Ionicons name="flash" size={18} color={COLORS.white} />}
                                />
                                <Button
                                    title="Schedule"
                                    onPress={() => handleScheduleBooking(mechanic)}
                                    variant="outline"
                                    style={styles.scheduleButton}
                                    icon={<Ionicons name="calendar-outline" size={18} color={COLORS.primary} />}
                                />
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
        marginBottom: 4,
    },
    headerSubtitle: {
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
    mechanicCard: {
        marginBottom: 16,
        padding: SIZES.padding,
    },
    mechanicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    mechanicInfo: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    mechanicDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    heartButton: {
        padding: 8,
    },
    category: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        marginBottom: 4,
    },
    completedJobs: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    chatButton: {
        backgroundColor: COLORS.secondary,
    },
    callButton: {
        backgroundColor: COLORS.primary,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
    },
    bookingButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    bookNowButton: {
        flex: 1,
    },
    scheduleButton: {
        flex: 1,
    },
});
