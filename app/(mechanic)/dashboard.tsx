import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import {
    getMechanic,
    subscribeToServiceRequests,
    subscribeToActiveBooking,
    createProposal,
    updateMechanicDiamonds
} from '@/services/firebase/firestore';
import { notifyNewProposal } from '@/services/firebase/notifications';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { Mechanic, ServiceRequest } from '@/types';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';
import { startLocationTracking } from '@/services/location/locationTrackingService';
import { calculateDistance } from '@/services/location/locationService';

export default function MechanicDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [proposalModalVisible, setProposalModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [proposalPrice, setProposalPrice] = useState('');
    const [proposalTime, setProposalTime] = useState('');
    const [proposalMessage, setProposalMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Fetch mechanic details
        getMechanic(user.id).then(setMechanic);

        // Subscribe to active booking
        const unsubscribeBooking = subscribeToActiveBooking(user.id, 'mechanic', (booking) => {
            setActiveBooking(booking);
            if (booking) {
                router.push('/(mechanic)/active-job');
            }
        });

        // Subscribe to service requests
        const unsubscribeRequests = subscribeToServiceRequests('car_mechanic', setServiceRequests);

        return () => {
            unsubscribeBooking();
            unsubscribeRequests();
        };
    }, [user]);

    // Start location tracking when mechanic is verified and idle
    useEffect(() => {
        if (!mechanic?.isVerified || !user) return;

        let locationCleanup: (() => void) | null = null;

        startLocationTracking(user.id).then((cleanup: any) => {
            locationCleanup = cleanup?.remove || cleanup || null;
        }).catch((error: any) => {
            console.log('Location tracking not available:', error.message);
        });

        return () => {
            if (locationCleanup) locationCleanup();
        };
    }, [mechanic?.isVerified, user]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) {
            await getMechanic(user.id).then(setMechanic);
        }
        setRefreshing(false);
    };

    const handleOpenProposalModal = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setProposalPrice(request.offeredPrice?.toString() || '');
        setProposalTime('30 min');
        setProposalMessage('I can help you with this!');
        setProposalModalVisible(true);
    };

    const handleSubmitProposal = async () => {
        if (!user || !selectedRequest || !mechanic) return;

        if (!proposalPrice || !proposalTime) {
            showErrorModal(showModal, 'Error', 'Please enter price and estimated time');
            return;
        }

        setSubmitting(true);
        try {
            // Deduct diamond
            await updateMechanicDiamonds(user.id, 1, 'subtract');

            // Calculate actual distance if both have locations
            let actualDistance = 2.5; // Default
            if (mechanic.location && selectedRequest.location) {
                actualDistance = calculateDistance(
                    mechanic.location.latitude,
                    mechanic.location.longitude,
                    selectedRequest.location.latitude,
                    selectedRequest.location.longitude
                );
            }

            // Create proposal object
            const proposalData: any = {
                requestId: selectedRequest.id,
                customerId: selectedRequest.customerId,
                mechanicId: user.id,
                mechanicName: user.name,
                mechanicRating: mechanic.rating,
                mechanicTotalRatings: mechanic.totalRatings,
                price: parseInt(proposalPrice),
                estimatedTime: proposalTime,
                message: proposalMessage,
                distance: actualDistance,
                status: 'pending',
            };

            // Only add mechanicPhoto if it exists
            if (user.profilePic) {
                proposalData.mechanicPhoto = user.profilePic;
            }

            const proposalId = await createProposal(proposalData);

            // 🚀 NEW: Notify customer about new proposal
            try {
                await notifyNewProposal(proposalId, user.name, parseInt(proposalPrice));
                console.log('✅ Customer notified of new proposal');
            } catch (error) {
                console.log('❌ Failed to notify customer:', error);
            }

            setProposalModalVisible(false);
            setProposalPrice('');
            setProposalTime('');
            setProposalMessage('');
            showSuccessModal(showModal, 'Success', 'Proposal submitted!');
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading spinner while fetching mechanic data
    if (!mechanic) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

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
                    <View>
                        <Text style={styles.greeting}>Dashboard</Text>
                        <Text style={styles.userName}>{mechanic.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(shared)/profile')}>
                        <Avatar name={mechanic.name} uri={mechanic.profilePic} size={48} />
                    </TouchableOpacity>
                </View>

                {/* Verification Status */}
                {!mechanic.isVerified && (
                    <Card style={[styles.statusCard, { backgroundColor: COLORS.warning + '20', borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}>
                        <View style={styles.statusContent}>
                            <View style={styles.statusIconContainer}>
                                <Ionicons name="time-outline" size={32} color={COLORS.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statusTitle}>KYC Verification Pending</Text>
                                <Text style={styles.statusText}>
                                    Complete your KYC to start receiving service requests
                                </Text>
                                <TouchableOpacity
                                    style={styles.kycButton}
                                    onPress={() => router.push('/(mechanic)/kyc-upload')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.kycButtonText}>Upload Documents</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                )}

                {mechanic.isVerified && (
                    <Card style={[styles.statusCard, { backgroundColor: COLORS.success + '20', borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
                        <View style={styles.statusContent}>
                            <View style={[styles.statusIconContainer, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statusTitle, { color: COLORS.success }]}>✓ Verified Account</Text>
                                <Text style={styles.statusText}>You can now accept service requests</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Ionicons name="star" size={32} color={COLORS.warning} />
                        <Text style={styles.statValue}>{mechanic.rating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="checkmark-done" size={32} color={COLORS.success} />
                        <Text style={styles.statValue}>{mechanic.completedJobs}</Text>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Ionicons name="diamond" size={32} color={COLORS.primary} />
                        <Text style={styles.statValue}>{mechanic.diamondBalance}</Text>
                        <Text style={styles.statLabel}>Diamonds</Text>
                    </Card>
                </View>

                {/* Service Requests Section */}
                {mechanic.isVerified && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Nearby Service Requests ({serviceRequests.length})
                        </Text>

                        {serviceRequests.length > 0 ? (
                            serviceRequests.slice(0, 3).map((request) => {
                                const category = CATEGORIES.find((c) => c.id === request.category);
                                return (
                                    <Card key={request.id} style={styles.requestCardDashboard}>
                                        {/* Category Header */}
                                        <View style={styles.requestHeader}>
                                            <View
                                                style={[
                                                    styles.categoryIconSmall,
                                                    { backgroundColor: category?.color + '20' },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={category?.icon as any}
                                                    size={20}
                                                    color={category?.color}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.requestCategory}>{category?.name}</Text>
                                                <Text style={styles.requestCustomer}>
                                                    {request.customerName}
                                                </Text>
                                            </View>
                                            <View style={styles.priceBadge}>
                                                <Text style={styles.priceText}>
                                                    PKR {request.offeredPrice || 260}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Description */}
                                        <Text style={styles.requestDescription} numberOfLines={2}>
                                            {request.description}
                                        </Text>

                                        {/* Location Info */}
                                        <View style={styles.requestFooter}>
                                            <View style={styles.locationBadge}>
                                                <Ionicons
                                                    name="location-outline"
                                                    size={14}
                                                    color={COLORS.textSecondary}
                                                />
                                                <Text style={styles.locationText}>Nearby</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.submitProposalButton}
                                                onPress={() => handleOpenProposalModal(request)}
                                            >
                                                <Ionicons name="add-circle" size={18} color={COLORS.white} />
                                                <Text style={styles.submitProposalText}>
                                                    Submit Proposal
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card style={styles.emptyCard}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={48}
                                    color={COLORS.textSecondary}
                                />
                                <Text style={styles.emptyCardText}>No requests available</Text>
                                <Text style={styles.emptyCardSubtext}>
                                    New service requests will appear here
                                </Text>
                            </Card>
                        )}

                        {serviceRequests.length > 3 && (
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => router.push('/(mechanic)/requests')}
                            >
                                <Text style={styles.viewAllText}>
                                    View All {serviceRequests.length} Requests
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(mechanic)/wallet')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                            <Ionicons name="wallet" size={24} color={COLORS.secondary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Buy Diamonds</Text>
                            <Text style={styles.actionSubtitle}>
                                Current balance: {mechanic.diamondBalance} diamonds
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(mechanic)/history')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="time" size={24} color={COLORS.success} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Job History</Text>
                            <Text style={styles.actionSubtitle}>View past completed jobs</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Proposal Input Modal */}
            <Modal
                visible={proposalModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setProposalModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Proposal</Text>
                            <TouchableOpacity onPress={() => setProposalModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.costBadgeModal}>
                            <Ionicons name="diamond" size={16} color={COLORS.primary} />
                            <Text style={styles.costTextModal}>1 Diamond will be deducted</Text>
                        </View>

                        {selectedRequest && (
                            <View style={styles.customerInfo}>
                                <Ionicons name="person" size={18} color={COLORS.textSecondary} />
                                <Text style={styles.customerInfoText}>
                                    {selectedRequest.customerName} - {selectedRequest.category}
                                </Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Your Price (PKR)</Text>
                            <View style={styles.priceInputContainer}>
                                <TextInput
                                    style={styles.priceInput}
                                    value={proposalPrice}
                                    onChangeText={setProposalPrice}
                                    keyboardType="numeric"
                                    placeholder="Enter your price"
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                                <TouchableOpacity
                                    style={styles.useCustomerPriceButton}
                                    onPress={() =>
                                        setProposalPrice(selectedRequest?.offeredPrice?.toString() || '260')
                                    }
                                >
                                    <Text style={styles.useCustomerPriceText}>
                                        Use customer's price
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Estimated Time</Text>
                            <TextInput
                                style={styles.textInput}
                                value={proposalTime}
                                onChangeText={setProposalTime}
                                placeholder="e.g., 30 min, 1-2 hours"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Message (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={proposalMessage}
                                onChangeText={setProposalMessage}
                                placeholder="Tell the customer why you're the best choice..."
                                placeholderTextColor={COLORS.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setProposalModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled]}
                                onPress={handleSubmitProposal}
                                disabled={submitting}
                            >
                                <Text style={styles.modalSubmitText}>
                                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: 20,
    },
    statusIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statusTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    statusText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    kycButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.warning,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginTop: 8,
        shadowColor: COLORS.warning,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    kycButtonText: {
        color: COLORS.white,
        fontSize: SIZES.base,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    actionCardDisabled: {
        opacity: 0.5,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    actionSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Service Request Card Styles
    requestCardDashboard: {
        marginBottom: 12,
        padding: 14,
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    categoryIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestCategory: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    requestCustomer: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    priceBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceText: {
        fontSize: SIZES.sm,
        fontWeight: '700',
        color: COLORS.primary,
    },
    requestDescription: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
        marginBottom: 10,
    },
    requestFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    submitProposalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    submitProposalText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.white,
    },
    emptyCard: {
        alignItems: 'center',
        padding: 40,
    },
    emptyCardText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
    },
    emptyCardSubtext: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 12,
    },
    viewAllText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.primary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    costBadgeModal: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 16,
    },
    costTextModal: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    customerInfoText: {
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    priceInputContainer: {
        gap: 8,
    },
    priceInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    textInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    useCustomerPriceButton: {
        backgroundColor: COLORS.primary + '10',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    useCustomerPriceText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: COLORS.border,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalSubmitButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalSubmitButtonDisabled: {
        opacity: 0.5,
    },
    modalSubmitText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
