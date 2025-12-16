import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface Analytics {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalCustomers: number;
    totalMechanics: number;
    newUsersToday: number;
    categoryBreakdown: { category: string; count: number }[];
    weeklyData: { day: string; revenue: number; bookings: number }[];
}

export default function AdminAnalyticsScreen() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAnalytics = async () => {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Fetch all bookings
            const bookingsSnapshot = await getDocs(collection(firestore, 'bookings'));
            const bookings = bookingsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    status: data.status as string,
                    price: data.price as number || 0,
                    category: data.category as string || 'Other',
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });

            // Fetch users
            const customersSnapshot = await getDocs(collection(firestore, 'customers'));
            const mechanicsSnapshot = await getDocs(collection(firestore, 'mechanics'));

            // Calculate analytics
            const completedBookings = bookings.filter(b => b.status === 'completed');
            const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

            const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
            
            const todayBookings = completedBookings.filter(b => b.createdAt >= todayStart);
            const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.price || 0), 0);

            const weekBookings = completedBookings.filter(b => b.createdAt >= weekAgo);
            const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.price || 0), 0);

            const monthBookings = completedBookings.filter(b => b.createdAt >= monthAgo);
            const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.price || 0), 0);

            // New users today
            const newCustomersToday = customersSnapshot.docs.filter(doc => {
                const createdAt = doc.data().createdAt?.toDate();
                return createdAt && createdAt >= todayStart;
            }).length;
            const newMechanicsToday = mechanicsSnapshot.docs.filter(doc => {
                const createdAt = doc.data().createdAt?.toDate();
                return createdAt && createdAt >= todayStart;
            }).length;

            // Category breakdown
            const categoryCount: { [key: string]: number } = {};
            completedBookings.forEach(b => {
                const cat = b.category || 'Other';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
            const categoryBreakdown = Object.entries(categoryCount)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Weekly data (last 7 days)
            const weeklyData: Analytics['weeklyData'] = [];
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
                const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                
                const dayBookings = completedBookings.filter(b => 
                    b.createdAt >= date && b.createdAt < nextDate
                );
                
                weeklyData.push({
                    day: days[date.getDay()],
                    revenue: dayBookings.reduce((sum, b) => sum + (b.price || 0), 0),
                    bookings: dayBookings.length,
                });
            }

            setAnalytics({
                totalRevenue,
                todayRevenue,
                weekRevenue,
                monthRevenue,
                totalBookings: bookings.length,
                completedBookings: completedBookings.length,
                cancelledBookings: cancelledBookings.length,
                totalCustomers: customersSnapshot.size,
                totalMechanics: mechanicsSnapshot.size,
                newUsersToday: newCustomersToday + newMechanicsToday,
                categoryBreakdown,
                weeklyData,
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAnalytics();
    }, []);

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!analytics) {
        return (
            <View style={styles.errorContainer}>
                <Text>Failed to load analytics</Text>
            </View>
        );
    }

    const chartConfig = {
        backgroundColor: COLORS.surface,
        backgroundGradientFrom: COLORS.surface,
        backgroundGradientTo: COLORS.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 172, 193, ${opacity})`,
        labelColor: () => COLORS.textSecondary,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: COLORS.primary,
        },
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Revenue Cards */}
                <Text style={styles.sectionTitle}>Revenue Overview</Text>
                <View style={styles.revenueGrid}>
                    <Card style={[styles.revenueCard, styles.todayCard]}>
                        <Text style={styles.revenueLabel}>Today</Text>
                        <Text style={styles.revenueValue}>
                            PKR {analytics.todayRevenue.toLocaleString()}
                        </Text>
                    </Card>
                    <Card style={styles.revenueCard}>
                        <Text style={styles.revenueLabel}>This Week</Text>
                        <Text style={styles.revenueValue}>
                            PKR {analytics.weekRevenue.toLocaleString()}
                        </Text>
                    </Card>
                    <Card style={styles.revenueCard}>
                        <Text style={styles.revenueLabel}>This Month</Text>
                        <Text style={styles.revenueValue}>
                            PKR {analytics.monthRevenue.toLocaleString()}
                        </Text>
                    </Card>
                    <Card style={[styles.revenueCard, styles.totalCard]}>
                        <Text style={styles.revenueLabel}>Total Revenue</Text>
                        <Text style={[styles.revenueValue, { color: COLORS.success }]}>
                            PKR {analytics.totalRevenue.toLocaleString()}
                        </Text>
                    </Card>
                </View>

                {/* Weekly Revenue Chart */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Revenue Trend</Text>
                    <LineChart
                        data={{
                            labels: analytics.weeklyData.map(d => d.day),
                            datasets: [{
                                data: analytics.weeklyData.map(d => d.revenue || 0),
                            }],
                        }}
                        width={screenWidth - 64}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />
                </Card>

                {/* Bookings Stats */}
                <Text style={styles.sectionTitle}>Booking Statistics</Text>
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color={COLORS.primary} />
                        <Text style={styles.statValue}>{analytics.totalBookings}</Text>
                        <Text style={styles.statLabel}>Total Bookings</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        <Text style={styles.statValue}>{analytics.completedBookings}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                        <Text style={styles.statValue}>{analytics.cancelledBookings}</Text>
                        <Text style={styles.statLabel}>Cancelled</Text>
                    </Card>
                </View>

                {/* Users Stats */}
                <Text style={styles.sectionTitle}>User Statistics</Text>
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Ionicons name="people" size={24} color={COLORS.info} />
                        <Text style={styles.statValue}>{analytics.totalCustomers}</Text>
                        <Text style={styles.statLabel}>Customers</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="construct" size={24} color={COLORS.secondary} />
                        <Text style={styles.statValue}>{analytics.totalMechanics}</Text>
                        <Text style={styles.statLabel}>Mechanics</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Ionicons name="person-add" size={24} color={COLORS.success} />
                        <Text style={styles.statValue}>{analytics.newUsersToday}</Text>
                        <Text style={styles.statLabel}>New Today</Text>
                    </Card>
                </View>

                {/* Category Breakdown */}
                <Card style={styles.categoryCard}>
                    <Text style={styles.chartTitle}>Top Categories</Text>
                    {analytics.categoryBreakdown.map((item, index) => (
                        <View key={item.category} style={styles.categoryItem}>
                            <View style={styles.categoryRank}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.categoryName}>{item.category}</Text>
                            <Text style={styles.categoryCount}>{item.count} bookings</Text>
                        </View>
                    ))}
                </Card>

                <View style={{ height: 32 }} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    content: {
        flex: 1,
        padding: SIZES.padding,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 8,
    },
    revenueGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    revenueCard: {
        width: '48%',
        padding: 16,
        alignItems: 'center',
    },
    todayCard: {
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    totalCard: {
        width: '100%',
    },
    revenueLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    revenueValue: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginTop: 4,
    },
    chartCard: {
        padding: 16,
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: SIZES.xl,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    categoryCard: {
        padding: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    categoryRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    categoryName: {
        flex: 1,
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    categoryCount: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
