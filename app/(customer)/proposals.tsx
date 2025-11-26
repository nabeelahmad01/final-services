import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subscribeToProposals, updateProposalStatus, createBooking, updateServiceRequestStatus, getServiceRequest } from '@/services/firebase/firestore';
import { COLORS, SIZES } from '@/constants/theme';
import { Proposal } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Proposals() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requestId = params.requestId as string;

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [accepting, setAccepting] = useState<string | null>(null);

    useEffect(() => {
        if (!requestId) return;

        const unsubscribe = subscribeToProposals(requestId, setProposals);
        return () => unsubscribe();
    }, [requestId]);

    const handleAcceptProposal = async (proposal: Proposal) => {
        Alert.alert(
            'Accept Proposal',
            `Accept proposal from ${proposal.mechanicName} for ${proposal.price} PKR?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        setAccepting(proposal.id);
                        try {
                            // Get service request details
                            const serviceRequest = await getServiceRequest(proposal.requestId);
                            if (!serviceRequest) {
                                throw new Error('Service request not found');
                            }

                            // Update proposal status
                            await updateProposalStatus(proposal.id, 'accepted');

                            // Create booking
                            await createBooking({
                                customerId: proposal.customerId,
                                mechanicId: proposal.mechanicId,
                                requestId: proposal.requestId,
                                proposalId: proposal.id,
                                category: serviceRequest.category,
                                customerLocation: serviceRequest.location,
                                price: proposal.price,
                                estimatedTime: proposal.estimatedTime,
                                status: 'ongoing',
                            });

                            // Update request status
                            await updateServiceRequestStatus(requestId, 'accepted');

                            Alert.alert('Success', 'Proposal accepted! Redirecting to tracking...', [
                                {
                                    text: 'OK',
                                    onPress: () => router.replace('/(customer)/tracking'),
                                },
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        } finally {
                            setAccepting(null);
                        }
                    },
                },
            ]
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
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Proposals</Text>
                    <View style={{ width: 24 }} />
                </View>

                {proposals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>Waiting for proposals...</Text>
                        <Text style={styles.emptySubtitle}>
                            Mechanics will send proposals soon. You'll be notified!
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>
                            {proposals.length} Proposal{proposals.length > 1 ? 's' : ''} Received
                        </Text>

                        {proposals.map((proposal) => (
                            <Card key={proposal.id} style={styles.proposalCard}>
                                <View style={styles.mechanicInfo}>
                                    <Avatar
                                        name={proposal.mechanicName}
                                        size={56}
                                    />
                                    <View style={styles.mechanicDetails}>
                                        <Text style={styles.mechanicName}>
                                            {proposal.mechanicName}
                                        </Text>
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={16} color={COLORS.warning} />
                                            <Text style={styles.rating}>4.5</Text>
                                            <Text style={styles.ratingCount}>(23 reviews)</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.proposalDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Price:</Text>
                                        <Text style={styles.detailValue}>{proposal.price} PKR</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Estimated Time:</Text>
                                        <Text style={styles.detailValue}>{proposal.estimatedTime}</Text>
                                    </View>

                                    {proposal.message && (
                                        <View style={styles.messageContainer}>
                                            <Text style={styles.messageLabel}>Message:</Text>
                                            <Text style={styles.messageText}>{proposal.message}</Text>
                                        </View>
                                    )}
                                </View>

                                <Button
                                    title="Accept Proposal"
                                    onPress={() => handleAcceptProposal(proposal)}
                                    loading={accepting === proposal.id}
                                    disabled={accepting !== null}
                                />
                            </Card>
                        ))}
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
        paddingVertical: 60,
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
        paddingHorizontal: 40,
    },
    proposalCard: {
        marginBottom: 16,
        padding: 16,
    },
    mechanicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    mechanicDetails: {
        flex: 1,
    },
    mechanicName: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    rating: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    ratingCount: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    proposalDetails: {
        marginBottom: 16,
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    detailValue: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        textAlign: 'right',
    },
    messageContainer: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginTop: 4,
    },
    messageLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    messageText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});
