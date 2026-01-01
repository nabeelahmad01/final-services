import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Linking,
    Image,
    Modal,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { 
    subscribeToServiceRequests, 
    createProposal, 
    updateMechanicDiamonds, 
    getMechanic,
    subscribeToMechanicScheduledBookings,
    subscribeToMechanicProposals,
} from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceRequest, Booking, ServiceCategory, Proposal } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

type TabType = 'requests' | 'scheduled';

// Format date for display
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
};

export default function MechanicRequests() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState<TabType>('requests');
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [scheduledBookings, setScheduledBookings] = useState<Booking[]>([]);
    const [mechanicCategories, setMechanicCategories] = useState<ServiceCategory[]>([]);
    const [mechanicProposals, setMechanicProposals] = useState<Proposal[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Proposal Modal States
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [proposalPrice, setProposalPrice] = useState('');
    const [proposalMessage, setProposalMessage] = useState('');

    useEffect(() => {
        if (!user) return;

        let unsubscribers: (() => void)[] = [];

        // Fetch mechanic's categories and subscribe to matching requests
        const setupSubscriptions = async () => {
            const mechanicData = await getMechanic(user.id);
            setMechanicCategories(mechanicData?.categories || []);
            
            if (mechanicData?.categories && mechanicData.categories.length > 0) {
                // Subscribe to each category the mechanic has selected
                const allRequests: Map<string, ServiceRequest> = new Map();
                
                mechanicData.categories.forEach(category => {
                    const unsubscribe = subscribeToServiceRequests(category, (categoryRequests) => {
                        // Merge requests from this category
                        categoryRequests.forEach(req => allRequests.set(req.id, req));
                        // Convert map to array and sort by date
                        const mergedRequests = Array.from(allRequests.values())
                            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                        setRequests(mergedRequests);
                    });
                    unsubscribers.push(unsubscribe);
                });
            }
        };

        setupSubscriptions();
        
        // Subscribe to scheduled bookings
        const unsubscribeScheduled = subscribeToMechanicScheduledBookings(user.id, setScheduledBookings);
        
        // Subscribe to mechanic's own proposals to filter out requests
        const unsubscribeProposals = subscribeToMechanicProposals(user.id, setMechanicProposals);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            unsubscribeScheduled();
            unsubscribeProposals();
        };
    }, [user]);

    // Open proposal modal with request details
    const openProposalModal = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setProposalPrice('');
        setProposalMessage('');
        setShowProposalModal(true);
    };

    // Submit the actual proposal
    const submitProposal = async () => {
        if (!user || !selectedRequest) return;
        
        if (!proposalPrice || parseInt(proposalPrice) <= 0) {
            showErrorModal(showModal, 'Error', 'Please enter a valid price');
            return;
        }

        setSubmitting(selectedRequest.id);
        try {
            // Deduct diamond
            await updateMechanicDiamonds(user.id, 1, 'subtract');

            // Get mechanic details
            const mechanicData = await getMechanic(user.id);
            if (!mechanicData) throw new Error('Mechanic data not found');

            // Create proposal object
            const proposalData: any = {
                requestId: selectedRequest.id,
                customerId: selectedRequest.customerId,
                mechanicId: user.id,
                mechanicName: user.name,
                mechanicRating: mechanicData.rating,
                mechanicTotalRatings: mechanicData.totalRatings,
                price: parseInt(proposalPrice),
                estimatedTime: '1-2 hours',
                message: proposalMessage || 'I can help you with this!',
                distance: 2.5,
                status: 'pending',
            };

            if (user.profilePic) {
                proposalData.mechanicPhoto = user.profilePic;
            }

            await createProposal(proposalData);

            setShowProposalModal(false);
            setSelectedRequest(null);
            showSuccessModal(showModal, 'Success', 'Proposal submitted!');
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setSubmitting(null);
        }
    };

    const handleNavigateToCustomer = (booking: Booking) => {
        router.push({
            pathname: '/(mechanic)/navigate',
            params: { bookingId: booking.id },
        });
    };

    const handleCallCustomer = (phone?: string) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleStartJob = async (booking: Booking) => {
        showConfirmModal(
            showModal,
            'Start Job',
            `Are you ready to start work for ${booking.customerName}?\n\nThis will mark the job as active.`,
            async () => {
                try {
                    const { updateBooking } = require('@/services/firebase/firestore');
                    await updateBooking(booking.id, {
                        status: 'ongoing',
                    });

                    showSuccessModal(
                        showModal,
                        'Job Started!',
                        'You can now navigate to the customer. The booking is now active.',
                        () => router.push('/(mechanic)/active-job')
                    );
                } catch (error: any) {
                    showErrorModal(showModal, 'Error', error.message);
                }
            },
            undefined,
            'Start Job',
            'Not Yet'
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Play voice message from service request
    const playVoiceMessage = async (voiceUrl: string, requestId: string) => {
        try {
            if (playingVoice === requestId && sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setPlayingVoice(null);
                setSound(null);
                return;
            }

            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: playbackSound } = await Audio.Sound.createAsync(
                { uri: voiceUrl }
            );
            setSound(playbackSound);
            setPlayingVoice(requestId);

            playbackSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingVoice(null);
                }
            });

            await playbackSound.playAsync();
        } catch (error) {
            console.error('Error playing voice:', error);
        }
    };

    // Filter out requests where mechanic has already submitted a proposal
    const filteredRequests = requests.filter(request => {
        const hasProposal = mechanicProposals.some(
            proposal => proposal.requestId === request.id
        );
        return !hasProposal; // Only show requests without any proposal from this mechanic
    });

    const renderRequestsTab = () => (
        <>
            {mechanicCategories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="construct-outline" size={64} color={COLORS.warning} />
                    <Text style={styles.emptyTitle}>No Categories Selected</Text>
                    <Text style={styles.emptySubtitle}>
                        Please select your service categories to receive requests
                    </Text>
                    <TouchableOpacity
                        style={styles.selectCategoriesBtn}
                        onPress={() => router.push('/(auth)/mechanic-categories')}
                    >
                        <Ionicons name="settings" size={18} color={COLORS.white} />
                        <Text style={styles.selectCategoriesBtnText}>Select Categories</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredRequests.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Requests Available</Text>
                    <Text style={styles.emptySubtitle}>
                        New service requests for your categories will appear here
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>
                        {filteredRequests.length} Request{filteredRequests.length > 1 ? 's' : ''} Available
                    </Text>

                    {filteredRequests.map((request) => {
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

                                {/* Voice Message */}
                                {request.voiceMessage && (
                                    <TouchableOpacity
                                        style={styles.voiceMessageBtn}
                                        onPress={() => playVoiceMessage(request.voiceMessage!, request.id)}
                                    >
                                        <Ionicons
                                            name={playingVoice === request.id ? 'pause-circle' : 'play-circle'}
                                            size={28}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.voiceMessageText}>
                                            {playingVoice === request.id ? 'Playing...' : 'Play Voice Message'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Images */}
                                {request.images && request.images.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                        {request.images.map((imgUri, idx) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: imgUri }}
                                                style={styles.requestImage}
                                            />
                                        ))}
                                    </ScrollView>
                                )}

                                <View style={styles.costBadge}>
                                    <Ionicons name="diamond" size={16} color={COLORS.primary} />
                                    <Text style={styles.costText}>1 Diamond to send proposal</Text>
                                </View>

                                <Button
                                    title="Submit Proposal"
                                    onPress={() => openProposalModal(request)}
                                    loading={submitting === request.id}
                                    disabled={submitting !== null}
                                    size="small"
                                />
                            </Card>
                        );
                    })}
                </>
            )}
        </>
    );

    const renderScheduledTab = () => (
        <>
            {scheduledBookings.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Scheduled Bookings</Text>
                    <Text style={styles.emptySubtitle}>
                        Your upcoming scheduled jobs will appear here
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>
                        {scheduledBookings.length} Scheduled Booking{scheduledBookings.length > 1 ? 's' : ''}
                    </Text>

                    {scheduledBookings.map((booking) => {
                        const category = CATEGORIES.find(c => c.id === booking.category);
                        const scheduledDateStr = booking.scheduledDate
                            ? formatDate(booking.scheduledDate)
                            : 'TBD';

                        return (
                            <Card key={booking.id} style={[styles.requestCard, styles.scheduledCard]}>
                                <View style={styles.categoryHeader}>
                                    <View style={[styles.categoryIcon, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                                        <Ionicons name={category?.icon as any || 'construct'} size={24} color={category?.color || COLORS.primary} />
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{category?.name || 'Service'}</Text>
                                        <Text style={styles.customerName}>{booking.customerName}</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceText}>PKR {booking.price?.toLocaleString()}</Text>
                                    </View>
                                </View>

                                {/* Schedule Info */}
                                <View style={styles.scheduleInfoRow}>
                                    <View style={styles.scheduleBadge}>
                                        <Ionicons name="calendar" size={16} color={COLORS.info} />
                                        <Text style={styles.scheduleBadgeText}>{scheduledDateStr}</Text>
                                    </View>
                                    {booking.scheduledTime && (
                                        <View style={styles.scheduleBadge}>
                                            <Ionicons name="time" size={16} color={COLORS.info} />
                                            <Text style={styles.scheduleBadgeText}>{booking.scheduledTime}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Customer Address */}
                                <View style={styles.addressRow}>
                                    <Ionicons name="location" size={18} color={COLORS.primary} />
                                    <Text style={styles.addressText} numberOfLines={2}>
                                        {booking.customerLocation?.address || 'Address not available'}
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.callBtn]}
                                        onPress={() => handleCallCustomer(booking.customerPhone || undefined)}
                                    >
                                        <Ionicons name="call" size={18} color={COLORS.success} />
                                        <Text style={styles.callBtnText}>Call</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.navigateBtn]}
                                        onPress={() => handleNavigateToCustomer(booking)}
                                    >
                                        <Ionicons name="navigate" size={18} color={COLORS.white} />
                                        <Text style={styles.navigateBtnText}>Navigate</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Start Job Button */}
                                <TouchableOpacity
                                    style={styles.startJobBtn}
                                    onPress={() => handleStartJob(booking)}
                                >
                                    <Ionicons name="play-circle" size={20} color={COLORS.white} />
                                    <Text style={styles.startJobBtnText}>Start Job</Text>
                                </TouchableOpacity>
                            </Card>
                        );
                    })}
                </>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service Requests</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Ionicons 
                        name="document-text-outline" 
                        size={20} 
                        color={activeTab === 'requests' ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        Requests
                    </Text>
                    {requests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{requests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]}
                    onPress={() => setActiveTab('scheduled')}
                >
                    <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={activeTab === 'scheduled' ? COLORS.info : COLORS.textSecondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabTextScheduled]}>
                        Scheduled
                    </Text>
                    {scheduledBookings.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: COLORS.info }]}>
                            <Text style={styles.badgeText}>{scheduledBookings.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'requests' ? renderRequestsTab() : renderScheduledTab()}
            </ScrollView>

            {/* Proposal Modal */}
            <Modal
                visible={showProposalModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProposalModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.proposalModal}>
                        <View style={styles.modalHandle} />
                        
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Proposal</Text>
                            <TouchableOpacity onPress={() => setShowProposalModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedRequest && (
                                <>
                                    {/* Customer Description */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.sectionLabel}>Customer's Request:</Text>
                                        <Text style={styles.requestDescription}>{selectedRequest.description}</Text>
                                    </View>

                                    {/* Voice Message */}
                                    {selectedRequest.voiceMessage && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.sectionLabel}>🎤 Voice Message:</Text>
                                            <TouchableOpacity
                                                style={styles.voicePlayBtn}
                                                onPress={() => playVoiceMessage(selectedRequest.voiceMessage!, selectedRequest.id)}
                                            >
                                                <Ionicons
                                                    name={playingVoice === selectedRequest.id ? 'pause-circle' : 'play-circle'}
                                                    size={36}
                                                    color={COLORS.primary}
                                                />
                                                <Text style={styles.voicePlayText}>
                                                    {playingVoice === selectedRequest.id ? 'Playing...' : 'Tap to Play'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Images */}
                                    {selectedRequest.images && selectedRequest.images.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.sectionLabel}>📷 Photos ({selectedRequest.images.length}):</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {selectedRequest.images.map((imgUri, idx) => (
                                                    <Image
                                                        key={idx}
                                                        source={{ uri: imgUri }}
                                                        style={styles.modalImage}
                                                    />
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* Price Input */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.sectionLabel}>Your Price (PKR):</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            placeholder="Enter price..."
                                            keyboardType="numeric"
                                            value={proposalPrice}
                                            onChangeText={setProposalPrice}
                                            placeholderTextColor={COLORS.textSecondary}
                                        />
                                    </View>

                                    {/* Message Input */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.sectionLabel}>Message (Optional):</Text>
                                        <TextInput
                                            style={styles.messageInput}
                                            placeholder="Add a message to customer..."
                                            multiline
                                            numberOfLines={3}
                                            value={proposalMessage}
                                            onChangeText={setProposalMessage}
                                            placeholderTextColor={COLORS.textSecondary}
                                        />
                                    </View>

                                    {/* Diamond Cost */}
                                    <View style={styles.diamondCost}>
                                        <Ionicons name="diamond" size={20} color={COLORS.primary} />
                                        <Text style={styles.diamondCostText}>Cost: 1 Diamond</Text>
                                    </View>

                                    {/* Submit Button */}
                                    <Button
                                        title="Submit Proposal"
                                        onPress={submitProposal}
                                        loading={submitting === selectedRequest.id}
                                    />
                                </>
                            )}
                        </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SIZES.padding,
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: COLORS.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    activeTabTextScheduled: {
        color: COLORS.info,
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: 24,
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
    scheduledCard: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
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
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.success,
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
    scheduleInfoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    scheduleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.info + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scheduleBadgeText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.info,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 16,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
    },
    callBtn: {
        backgroundColor: COLORS.success + '15',
    },
    callBtnText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.success,
    },
    navigateBtn: {
        backgroundColor: COLORS.primary,
    },
    navigateBtnText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.white,
    },
    startJobBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 12,
    },
    startJobBtnText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    selectCategoriesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    selectCategoriesBtnText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.white,
    },
    // Voice and Image display styles
    voiceMessageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        gap: 8,
        marginBottom: 12,
    },
    voiceMessageText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.primary,
    },
    imagesScroll: {
        marginBottom: 12,
    },
    requestImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 8,
    },
    // Proposal Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    proposalModal: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    requestDescription: {
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 22,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 10,
    },
    voicePlayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    voicePlayText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.primary,
    },
    modalImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginRight: 10,
    },
    priceInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    messageInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: SIZES.base,
        color: COLORS.text,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    diamondCost: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary + '10',
        padding: 12,
        borderRadius: 10,
        gap: 8,
        marginBottom: 16,
    },
    diamondCostText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
