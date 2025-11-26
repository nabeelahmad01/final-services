import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Card, EmptyState } from '@/components';
import { Rating } from '@/components/ui/Rating';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function Favorites() {
    const router = useRouter();
    const { user } = useAuthStore();

    // TODO: Fetch favorites from Firestore
    const [favorites, setFavorites] = useState<any[]>([]);

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
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
                        <Card
                            key={mechanic.id}
                            style={styles.mechanicCard}
                            onPress={() => {
                                // TODO: Navigate to mechanic profile
                            }}
                        >
                            <View style={styles.mechanicHeader}>
                                <View style={styles.mechanicInfo}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {mechanic.name.charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={styles.mechanicDetails}>
                                        <Text style={styles.mechanicName}>{mechanic.name}</Text>
                                        <View style={styles.ratingContainer}>
                                            <Rating rating={mechanic.rating} size={16} />
                                            <Text style={styles.ratingText}>
                                                ({mechanic.totalRatings})
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Ionicons name="heart" size={24} color={COLORS.danger} />
                            </View>
                            <Text style={styles.category}>{mechanic.category}</Text>
                            <Text style={styles.completedJobs}>
                                {mechanic.completedJobs} jobs completed
                            </Text>
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
        marginBottom: 12,
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
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
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
    },
});
