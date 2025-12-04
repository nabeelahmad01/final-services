import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
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
    updateMechanicDiamonds,
    getMechanicReviews,
    Review,
} from '@/services/firebase/firestore';
import { notifyNewProposal } from '@/services/firebase/notifications';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { Mechanic, ServiceRequest } from '@/types';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';
import { startLocationTracking } from '@/services/location/locationTrackingService';
import { calculateDistance } from '@/services/location/locationService';
import { ServiceRequestModal } from '@/components/shared/ServiceRequestModal';
import { ServiceRequestCard } from '@/components/mechanic/ServiceRequestCard';

export default function MechanicDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        if (!user) return;

        // Fetch mechanic details
        getMechanic(user.id).then(setMechanic);

        // Fetch reviews
        getMechanicReviews(user.id, 5).then(setReviews);

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

    const handleSelectRequest = (request: ServiceRequest) => {
        setSelectedRequest(request);
    };

    const handleSubmitProposal = async (price: string, time: string, message: string) => {
        if (!user || !selectedRequest || !mechanic) return;

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
                price: parseInt(price),
                estimatedTime: time,
                message: message,
                distance: actualDistance,
                status: 'pending',
            };

            // Only add mechanicPhoto if it exists
            if (user.profilePic) {
                proposalData.mechanicPhoto = user.profilePic;
            }

            const proposalId = await createProposal(proposalData);

            // 🚀 Notify customer about new proposal
            try {
                await notifyNewProposal(proposalId, user.name, parseInt(price));
                console.log('✅ Customer notified of new proposal');
            } catch (error) {
                console.log('❌ Failed to notify customer:', error);
            }

            // Close modal
            setSelectedRequest(null);

            showSuccessModal(showModal, 'Success', 'Proposal submitted!');
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelModal = () => {
        setSelectedRequest(null);
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
                        <Ionicons name="cash" size={32} color={COLORS.success} />
                        <Text style={styles.statValue}>{(mechanic.totalEarnings || 0).toLocaleString()}</Text>
                        <Text style={styles.statLabel}>PKR Earned</Text>
                    </Card>
                </View>

                {/* Diamond Balance Card */}
                <Card style={styles.earningsCard}>
                    <View style={styles.earningsContent}>
                        <View style={styles.earningsLeft}>
                            <View style={styles.diamondIconBg}>
                                <Ionicons name="diamond" size={28} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.earningsLabel}>Diamond Balance</Text>
                                <Text style={styles.earningsValue}>{mechanic.diamondBalance} Diamonds</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.buyButton}
                            onPress={() => router.push('/(mechanic)/wallet')}
                        >
                            <Ionicons name="add" size={18} color={COLORS.white} />
                            <Text style={styles.buyButtonText}>Buy</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Recent Reviews Section */}
                {reviews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Reviews</Text>
                            <TouchableOpacity onPress={() => router.push('/(mechanic)/reviews')}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {reviews.map((review) => (
                            <Card key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerInfo}>
                                        {review.customerPhoto ? (
                                            <Image source={{ uri: review.customerPhoto }} style={styles.reviewerPhoto} />
                                        ) : (
                                            <View style={[styles.reviewerPhoto, styles.reviewerPhotoPlaceholder]}>
                                                <Ionicons name="person" size={16} color={COLORS.textSecondary} />
                                            </View>
                                        )}
                                        <View>
                                            <Text style={styles.reviewerName}>{review.customerName}</Text>
                                            <View style={styles.reviewStars}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Ionicons
                                                        key={star}
                                                        name={star <= review.rating ? "star" : "star-outline"}
                                                        size={14}
                                                        color={COLORS.warning}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewDate}>
                                        {review.createdAt.toLocaleDateString()}
                                    </Text>
                                </View>
                                {review.comment && (
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                )}
                            </Card>
                        ))}
                    </View>
                )}

                {/* Service Requests - Show all available requests */}
                {serviceRequests.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Live Service Requests</Text>
                            <View style={styles.requestCountBadge}>
                                <Text style={styles.requestCountText}>{serviceRequests.length}</Text>
                            </View>
                        </View>

                        {serviceRequests.map((request) => (
                            <ServiceRequestCard
                                key={request.id}
                                request={request}
                                onAccept={() => handleSelectRequest(request)}
                            />
                        ))}
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

            {/* Service Request Modal - Shows when mechanic selects a request */}
            <ServiceRequestModal
                request={selectedRequest}
                onSubmitProposal={handleSubmitProposal}
                onCancel={handleCancelModal}
            />
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    seeAllText: {
        fontSize: SIZES.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    earningsCard: {
        marginBottom: 24,
        padding: 16,
    },
    earningsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    earningsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    diamondIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    earningsLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    earningsValue: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    buyButtonText: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    reviewCard: {
        marginBottom: 12,
        padding: 14,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    reviewerPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewerPhotoPlaceholder: {
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    reviewDate: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    reviewComment: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        marginTop: 10,
        lineHeight: 20,
    },
    requestCountBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    requestCountText: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    requestCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    requestIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestContent: {
        flex: 1,
    },
    requestTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    requestCustomer: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    requestDescription: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    requestRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    requestPrice: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.primary,
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
    // Service Request Card Styles (legacy)
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
    requestCustomerLegacy: {
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
    requestDescriptionLegacy: {
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
