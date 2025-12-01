import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToServiceRequests, createProposal, updateMechanicDiamonds, getMechanic } from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

export default function MechanicRequests() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // For now, show all pending requests
        // TODO: Filter by mechanic's categories
        const unsubscribe = subscribeToServiceRequests('car_mechanic', setRequests);
        return () => unsubscribe();
    }, [user]);

    const handleSubmitProposal = async (request: ServiceRequest) => {
        if (!user) return;

        showConfirmModal(
            showModal,
            'Submit Proposal',
            'Cost: 1 Diamond\n\nEnter your proposal details:',
            async () => {
                setSubmitting(request.id);
                try {
                    // Deduct diamond
                    await updateMechanicDiamonds(user.id, 1, 'subtract');

                    // Get mechanic details
                    const mechanicData = await getMechanic(user.id);
                    if (!mechanicData) throw new Error('Mechanic data not found');

                    // Create proposal object
                    const proposalData: any = {
                        requestId: request.id,
                        customerId: request.customerId,
                        mechanicId: user.id,
                        mechanicName: user.name,
                        mechanicRating: mechanicData.rating,
                        mechanicTotalRatings: mechanicData.totalRatings,
                        price: 100, // TODO: Let mechanic input
                        estimatedTime: '1-2 hours', // TODO: Let mechanic input
                        message: 'I can help you with this!',
                        distance: 2.5, // TODO: Calculate actual distance
                        status: 'pending',
                    };

                    // Only add mechanicPhoto if it exists
                    if (user.profilePic) {
                        proposalData.mechanicPhoto = user.profilePic;
                    }

                    await createProposal(proposalData);

                    showSuccessModal(showModal, 'Success', 'Proposal submitted!');
                } catch (error: any) {
                    showErrorModal(showModal, 'Error', error.message);
                } finally {
                    setSubmitting(null);
                }
            },
            undefined,
            'Submit',
            'Cancel'
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Service Requests</Text>
                    <View style={{ width: 24 }} />
                </View>

                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No Requests Available</Text>
                        <Text style={styles.emptySubtitle}>
                            New service requests will appear here
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>
                            {requests.length} Request{requests.length > 1 ? 's' : ''} Available
                        </Text>

                        {requests.map((request) => {
                            const category = CATEGORIES.find(c => c.id === request.category);
                            return (
                                <Card key={request.id} style={styles.requestCard}>
                                    <View style={styles.categoryHeader}>
                                        <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' }]}>
                                            <Ionicons name={category?.icon as any} size={24} color={category?.color} />
                                        </View>
                                        <View style={styles.categoryInfo}>
                                            <Text style={styles.categoryName}>{category?.name}</Text>
                                            <Text style={styles.customerName}>by {request.customerName}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.requestDetails}>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                                            <Text style={styles.detailText}>Nearby</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                                            <Text style={styles.detailText}>Just now</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.description}>{request.description}</Text>

                                    <View style={styles.costBadge}>
                                        <Ionicons name="diamond" size={16} color={COLORS.primary} />
                                        <Text style={styles.costText}>1 Diamond to send proposal</Text>
                                    </View>

                                    <Button
                                        title="Submit Proposal"
                                        onPress={() => handleSubmitProposal(request)}
                                        loading={submitting === request.id}
                                        disabled={submitting !== null}
                                        size="small"
                                    />
                                </Card>
                            );
                        })}
                    </>
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
    scrollContent: {
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    requestCard: {
        marginBottom: 16,
        padding: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    customerName: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    requestDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    description: {
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 12,
    },
    costText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
