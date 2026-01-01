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
    updateMechanic,
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
    const [isOnline, setIsOnline] = useState(true); // Online/Offline toggle

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

    // Toggle online/offline status
    const toggleOnlineStatus = async () => {
        if (!user) return;
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await updateMechanic(user.id, { isOnline: newStatus });
        } catch (error) {
            console.error('Error updating online status:', error);
            // Revert on error
            setIsOnline(!newStatus);
        }
    };

    // Sync isOnline state with mechanic data
    useEffect(() => {
        if (mechanic?.isOnline !== undefined) {
            setIsOnline(mechanic.isOnline);
        }
    }, [mechanic?.isOnline]);

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
                {/* Enhanced Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>
                            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
                        </Text>
                        <Text style={styles.userName}>{mechanic.name}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            style={styles.notificationBtn}
                            onPress={() => router.push('/(mechanic)/requests')}
                        >
                            <Ionicons name="notifications" size={24} color={COLORS.text} />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>!</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(shared)/profile')}>
                            <Avatar name={mechanic.name} uri={mechanic.profilePic} size={48} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Service Requests Call To Action */}
                <TouchableOpacity 
                    style={styles.serviceRequestsCTA}
                    onPress={() => router.push('/(mechanic)/requests')}
                >
                    <View style={styles.ctaLeft}>
                        <View style={styles.ctaIconBg}>
                            <Ionicons name="document-text" size={28} color={COLORS.white} />
                        </View>
                        <View>
                            <Text style={styles.ctaTitle}>View Service Requests</Text>
                            <Text style={styles.ctaSubtitle}>Tap to see available jobs</Text>
                        </View>
                    </View>
                    <View style={styles.ctaRight}>
                        <Text style={styles.ctaArrow}>→</Text>
                    </View>
                </TouchableOpacity>

                {/* Status Bar - Compact Verification + Online Toggle */}
                <View style={styles.statusBar}>
                    {/* Verification Badge */}
                    {mechanic.isVerified ? (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                            <Text style={styles.verifiedBadgeText}>Verified</Text>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={styles.pendingBadge}
                            onPress={() => router.push('/(mechanic)/kyc-upload')}
                        >
                            <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                            <Text style={styles.pendingBadgeText}>KYC Pending</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.warning} />
                        </TouchableOpacity>
                    )}

                    {/* Online/Offline Toggle */}
                    <TouchableOpacity 
                        style={[styles.onlineToggle, isOnline ? styles.onlineActive : styles.onlineInactive]}
                        onPress={toggleOnlineStatus}
                    >
                        <View style={[styles.toggleDot, isOnline && styles.toggleDotActive]} />
                        <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Improvement Tips - Show when rating is low or no reviews */}
                {(calculateRating(mechanic) < 4 || mechanic.completedJobs < 5) && (
                    <Card style={styles.tipsCard}>
                        <View style={styles.tipsHeader}>
                            <Ionicons name="bulb" size={20} color={COLORS.warning} />
                            <Text style={styles.tipsTitle}>Tips to Grow</Text>
                        </View>
                        <View style={styles.tipsList}>
                            {calculateRating(mechanic) < 4 && (
                                <Text style={styles.tipItem}>💡 Complete jobs carefully to improve your rating</Text>
                            )}
                            {mechanic.completedJobs < 5 && (
                                <Text style={styles.tipItem}>🚀 Accept more jobs to build your reputation</Text>
                            )}
                            <Text style={styles.tipItem}>⚡ Respond quickly to get more requests</Text>
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

                {/* Today's Activity Card */}
                <View style={styles.todaySection}>
                    <Text style={styles.todaySectionTitle}>📊 Today's Activity</Text>
                    <Text style={styles.todayDate}>{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                    <View style={styles.todayStatsRow}>
                        <View style={styles.todayStatItem}>
                            <View style={[styles.todayStatIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                            </View>
                            <Text style={styles.todayStatValue}>{completedJobs.filter(j => {
                                if (!j.completedAt) return false;
                                const today = new Date();
                                return j.completedAt.toDateString() === today.toDateString();
                            }).length}</Text>
                            <Text style={styles.todayStatLabel}>Jobs Done</Text>
                        </View>
                        <View style={styles.todayStatItem}>
                            <View style={[styles.todayStatIcon, { backgroundColor: COLORS.warning + '20' }]}>
                                <Ionicons name="star" size={24} color={COLORS.warning} />
                            </View>
                            <Text style={styles.todayStatValue}>{reviews.filter(r => {
                                const today = new Date();
                                return r.createdAt.toDateString() === today.toDateString();
                            }).length}</Text>
                            <Text style={styles.todayStatLabel}>Reviews</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.todayStatItem}
                            onPress={() => router.push('/(mechanic)/requests')}
                        >
                            <View style={[styles.todayStatIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="calendar" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.todayStatValue}>{scheduledJobs.length}</Text>
                            <Text style={styles.todayStatLabel}>Scheduled</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* COMMENTED OUT - Uncomment when needed
                {/* Recent Reviews Section */}
                {/* reviews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>⭐ Recent Reviews</Text>
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
                                        {formatTimeAgo(review.createdAt)}
                                    </Text>
                                </View>
                                {review.comment && (
                                    <Text style={styles.reviewComment}>"{review.comment}"</Text>
                                )}
                            </Card>
                        ))}
                    </View>
                ) */}

                {/* Recent Jobs - Improved Design */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🔧 Recent Jobs</Text>
                        <TouchableOpacity onPress={() => router.push('/(mechanic)/history')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {completedJobs.length === 0 ? (
                        <Card style={styles.emptyJobsCard}>
                            <Ionicons name="construct-outline" size={40} color={COLORS.textSecondary} />
                            <Text style={styles.emptyJobsTitle}>No Jobs Yet</Text>
                            <Text style={styles.emptyJobsText}>Complete jobs to see them here</Text>
                        </Card>
                    ) : (
                        completedJobs.map((job) => {
                            const category = CATEGORIES.find((c) => c.id === job.category);
                            return (
                                <Card key={job.id} style={styles.improvedJobCard}>
                                    {/* Top Row: Category + Customer + Price */}
                                    <View style={styles.jobCardTop}>
                                        <View style={[styles.jobIconLarge, { backgroundColor: (category?.color || COLORS.primary) + '15' }]}>
                                            <Ionicons name={category?.icon as any || 'construct'} size={28} color={category?.color || COLORS.primary} />
                                        </View>
                                        <View style={styles.jobCardInfo}>
                                            <Text style={styles.jobCardCategory}>{category?.name || 'Service'}</Text>
                                            <Text style={styles.jobCardCustomer}>{job.customerName}</Text>
                                        </View>
                                        <View style={styles.jobCardPriceBox}>
                                            <Text style={styles.jobCardPrice}>PKR {job.price?.toLocaleString() || 0}</Text>
                                            <View style={styles.completedBadge}>
                                                <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                                                <Text style={styles.completedBadgeText}>Done</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Rating Row */}
                                    <View style={styles.jobCardRating}>
                                        {job.isReviewed && job.rating !== undefined ? (
                                            <View style={styles.ratingContent}>
                                                <View style={styles.ratingStarsRow}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Ionicons
                                                            key={star}
                                                            name={star <= (job.rating || 0) ? 'star' : 'star-outline'}
                                                            size={18}
                                                            color={COLORS.warning}
                                                        />
                                                    ))}
                                                    <Text style={styles.ratingText}>{job.rating}/5</Text>
                                                </View>
                                                {job.reviewComment && (
                                                    <Text style={styles.reviewQuote} numberOfLines={2}>"{job.reviewComment}"</Text>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={styles.pendingReviewBadge}>
                                                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                                                <Text style={styles.pendingReviewText}>Awaiting review</Text>
                                            </View>
                                        )}
                                        <Text style={styles.jobDate}>{job.completedAt ? formatTimeAgo(job.completedAt) : ''}</Text>
                                    </View>
                                </Card>
                            );
                        })
                    )}
                </View>

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
    // Enhanced Header Styles
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationBtn: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: COLORS.danger,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Service Requests CTA
    serviceRequestsCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    ctaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    ctaIconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    ctaSubtitle: {
        fontSize: SIZES.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    ctaRight: {
        paddingRight: 4,
    },
    ctaArrow: {
        fontSize: 24,
        color: COLORS.white,
    },
    // Today's Activity Section
    todaySection: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    todaySectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    todayDate: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
        marginBottom: 16,
    },
    todayStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    todayStatItem: {
        alignItems: 'center',
    },
    todayStatIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    todayStatValue: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    todayStatLabel: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Improved Job Cards
    emptyJobsCard: {
        alignItems: 'center',
        padding: 32,
        gap: 8,
    },
    emptyJobsTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 8,
    },
    emptyJobsText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    improvedJobCard: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
    },
    jobCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    jobIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jobCardInfo: {
        flex: 1,
    },
    jobCardCategory: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    jobCardCustomer: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    jobCardPriceBox: {
        alignItems: 'flex-end',
    },
    jobCardPrice: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    completedBadgeText: {
        fontSize: SIZES.xs,
        color: COLORS.success,
        fontWeight: '500',
    },
    jobCardRating: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    ratingContent: {
        flex: 1,
    },
    ratingStarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.warning,
        marginLeft: 6,
    },
    reviewQuote: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: 6,
        marginLeft: 2,
    },
    pendingReviewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.background,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    pendingReviewText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    jobDate: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    // Status Bar - Compact design
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.success + '15',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    verifiedBadgeText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.success,
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.warning + '15',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    pendingBadgeText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.warning,
    },
    // Online/Offline Toggle
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 2,
    },
    onlineActive: {
        backgroundColor: COLORS.success + '15',
        borderColor: COLORS.success,
    },
    onlineInactive: {
        backgroundColor: COLORS.textSecondary + '15',
        borderColor: COLORS.textSecondary,
    },
    toggleDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.textSecondary,
    },
    toggleDotActive: {
        backgroundColor: COLORS.success,
    },
    toggleText: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    toggleTextActive: {
        color: COLORS.success,
    },
    // Tips Card
    tipsCard: {
        marginBottom: 16,
        padding: 14,
        backgroundColor: COLORS.warning + '08',
        borderWidth: 1,
        borderColor: COLORS.warning + '30',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    tipsTitle: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tipsList: {
        gap: 6,
    },
    tipItem: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});
