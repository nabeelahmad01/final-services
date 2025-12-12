import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
    Linking,
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
    subscribeToActiveBooking,
    getMechanicReviews,
    getCompletedBookings,
    subscribeToMechanicScheduledBookings,
    Review,
} from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { Mechanic, Booking } from '@/types';
import { useModal } from '@/utils/modalService';
import { startLocationTracking } from '@/services/location/locationTrackingService';

// Helper function to format time smartly
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Calculate proper average rating
const calculateRating = (mechanic: Mechanic): number => {
    if (mechanic.ratingCount && mechanic.ratingCount > 0 && mechanic.totalRating) {
        return mechanic.totalRating / mechanic.ratingCount;
    }
    return mechanic.rating || 0;
};

export default function MechanicDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [completedJobs, setCompletedJobs] = useState<Booking[]>([]);
    const [scheduledJobs, setScheduledJobs] = useState<Booking[]>([]);

    useEffect(() => {
        if (!user) return;

        // Fetch mechanic details
        getMechanic(user.id).then(setMechanic);

        // Fetch reviews
        getMechanicReviews(user.id, 5).then(setReviews);

        // Fetch completed jobs
        getCompletedBookings(user.id, 5).then(setCompletedJobs);

        // Subscribe to active booking
        const unsubscribeBooking = subscribeToActiveBooking(user.id, 'mechanic', (booking) => {
            setActiveBooking(booking);
            if (booking) {
                router.push('/(mechanic)/active-job');
            }
        });

        // Subscribe to scheduled bookings (real-time)
        const unsubscribeScheduled = subscribeToMechanicScheduledBookings(user.id, setScheduledJobs);

        return () => {
            unsubscribeBooking();
            unsubscribeScheduled();
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
            try {
                // Fetch all data in parallel
                const [mechanicData, reviewsData, jobsData] = await Promise.all([
                    getMechanic(user.id),
                    getMechanicReviews(user.id, 5),
                    getCompletedBookings(user.id, 5),
                ]);

                setMechanic(mechanicData);
                setReviews(reviewsData);
                setCompletedJobs(jobsData);
            } catch (error) {
                console.error('Error refreshing dashboard:', error);
            }
        }
        setRefreshing(false);
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
                        <Text style={styles.statValue}>{calculateRating(mechanic).toFixed(1)}</Text>
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

                {/* Scheduled Jobs Section */}
                {scheduledJobs.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>📅 Upcoming Scheduled Jobs</Text>
                            <View style={[styles.countBadge, { backgroundColor: COLORS.info + '20' }]}>
                                <Text style={[styles.countText, { color: COLORS.info }]}>{scheduledJobs.length}</Text>
                            </View>
                        </View>

                        {scheduledJobs.map((job) => {
                            const category = CATEGORIES.find((c) => c.id === job.category);
                            const scheduledDateStr = job.scheduledDate
                                ? (typeof (job.scheduledDate as any).toDate === 'function'
                                    ? (job.scheduledDate as any).toDate().toLocaleDateString()
                                    : job.scheduledDate.toLocaleDateString?.() || 'TBD')
                                : 'TBD';

                            return (
                                <TouchableOpacity
                                    key={job.id}
                                    onPress={() => router.push({
                                        pathname: '/(mechanic)/navigate',
                                        params: { bookingId: job.id }
                                    })}
                                >
                                    <Card style={[styles.jobHistoryCard, { borderLeftWidth: 4, borderLeftColor: COLORS.info }]}>
                                        <View style={styles.jobHistoryHeader}>
                                            <View style={[styles.jobCategoryIcon, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                                                <Ionicons name={category?.icon as any || 'construct'} size={24} color={category?.color || COLORS.primary} />
                                            </View>
                                            <View style={styles.jobHistoryInfo}>
                                                <Text style={styles.jobHistoryTitle}>{category?.name || 'Service'}</Text>
                                                <Text style={styles.jobHistoryCustomer}>{job.customerName}</Text>
                                            </View>
                                            <View style={styles.jobHistoryRight}>
                                                <Text style={styles.jobHistoryPrice}>PKR {job.price?.toLocaleString() || 0}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.scheduledInfoRow}>
                                            <View style={styles.scheduledBadge}>
                                                <Ionicons name="calendar" size={14} color={COLORS.info} />
                                                <Text style={styles.scheduledBadgeText}>{scheduledDateStr}</Text>
                                            </View>
                                            {job.scheduledTime && (
                                                <View style={styles.scheduledBadge}>
                                                    <Ionicons name="time" size={14} color={COLORS.info} />
                                                    <Text style={styles.scheduledBadgeText}>{job.scheduledTime}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => job.customerPhone && Linking.openURL(`tel:${job.customerPhone}`)}
                                            >
                                                <Ionicons name="call" size={16} color={COLORS.success} />
                                                <Text style={styles.actionButtonText}>Call</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: COLORS.primary + '15' }]}
                                                onPress={() => router.push({
                                                    pathname: '/(mechanic)/navigate',
                                                    params: { bookingId: job.id }
                                                })}
                                            >
                                                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                                                <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Navigate</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Card>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Recent Reviews Section - Always show */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        {reviews.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/(mechanic)/reviews')}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {reviews.length === 0 ? (
                        <Card style={styles.emptyReviewCard}>
                            <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textSecondary} />
                            <Text style={styles.emptyReviewTitle}>No Reviews Yet</Text>
                            <Text style={styles.emptyReviewText}>
                                Complete jobs to get reviews from customers
                            </Text>
                        </Card>
                    ) : (
                        reviews.map((review) => (
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
                                        {formatTimeAgo(review.createdAt)}
                                    </Text>
                                </View>
                                {review.comment && (
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                )}
                            </Card>
                        ))
                    )}
                </View>

                {/* Job History - Show completed jobs */}
                {completedJobs.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Jobs</Text>
                            <TouchableOpacity onPress={() => router.push('/(mechanic)/history')}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {completedJobs.map((job) => {
                            const category = CATEGORIES.find((c) => c.id === job.category);
                            return (
                                <Card key={job.id} style={styles.jobHistoryCard}>
                                    <View style={styles.jobHistoryHeader}>
                                        <View style={[styles.jobCategoryIcon, { backgroundColor: (category?.color || COLORS.primary) + '20' }]}>
                                            <Ionicons name={category?.icon as any || 'construct'} size={24} color={category?.color || COLORS.primary} />
                                        </View>
                                        <View style={styles.jobHistoryInfo}>
                                            <Text style={styles.jobHistoryTitle}>{category?.name || 'Service'}</Text>
                                            <Text style={styles.jobHistoryCustomer}>{job.customerName}</Text>
                                        </View>
                                        <View style={styles.jobHistoryRight}>
                                            <Text style={styles.jobHistoryPrice}>PKR {job.price?.toLocaleString() || 0}</Text>
                                            <Text style={styles.jobHistoryDate}>
                                                {job.completedAt ? formatTimeAgo(job.completedAt) : 'Completed'}
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Show review info if available, or awaiting review */}
                                    <View style={styles.jobReviewSection}>
                                        {job.isReviewed && job.rating !== undefined ? (
                                            <>
                                                <View style={styles.jobReviewStars}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Ionicons
                                                            key={star}
                                                            name={star <= (job.rating || 0) ? 'star' : 'star-outline'}
                                                            size={16}
                                                            color={COLORS.warning}
                                                        />
                                                    ))}
                                                    <Text style={styles.jobReviewRating}>{job.rating}/5</Text>
                                                </View>
                                                {job.reviewComment && (
                                                    <Text style={styles.jobReviewComment} numberOfLines={2}>
                                                        "{job.reviewComment}"
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <View style={styles.awaitingReviewRow}>
                                                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.awaitingReviewText}>Awaiting customer review</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.jobHistoryStatus}>
                                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                                        <Text style={styles.jobHistoryStatusText}>Completed</Text>
                                    </View>
                                </Card>
                            );
                        })}
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
    jobHistoryCard: {
        marginBottom: 12,
        padding: 14,
    },
    jobHistoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    jobCategoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jobHistoryInfo: {
        flex: 1,
    },
    jobHistoryTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    jobHistoryCustomer: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    jobHistoryRight: {
        alignItems: 'flex-end',
    },
    jobHistoryPrice: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    jobHistoryDate: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    jobHistoryStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    jobHistoryStatusText: {
        fontSize: SIZES.sm,
        color: COLORS.success,
        fontWeight: '500',
    },
    jobReviewSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    jobReviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    jobReviewRating: {
        fontSize: SIZES.sm,
        color: COLORS.warning,
        fontWeight: '600',
        marginLeft: 6,
    },
    jobReviewComment: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: 4,
        lineHeight: 18,
    },
    awaitingReviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    awaitingReviewText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    reviewCard: {
        marginBottom: 12,
        padding: 14,
    },
    emptyReviewCard: {
        alignItems: 'center',
        padding: 24,
        gap: 8,
    },
    emptyReviewTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 8,
    },
    emptyReviewText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
    // Scheduled Jobs section styles
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        fontSize: SIZES.sm,
        fontWeight: 'bold',
    },
    scheduledInfoRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    scheduledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.info + '15',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    scheduledBadgeText: {
        fontSize: SIZES.sm,
        color: COLORS.info,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.success + '15',
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.success,
    },
});
