import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Card, EmptyState } from '@/components';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function Earnings() {
    const router = useRouter();
    const { user } = useAuthStore();

    // TODO: Fetch earnings data from Firestore
    const [stats, setStats] = useState({
        totalEarnings: 25000,
        thisMonth: 8500,
        pendingPayouts: 2500,
        completedJobs: 42,
    });

    const [transactions, setTransactions] = useState<any[]>([
        {
            id: '1',
            type: 'earning',
            amount: 1500,
            description: 'Car Engine Repair',
            date: '2024-01-15',
        },
        {
            id: '2',
            type: 'purchase',
            amount: -500,
            description: 'Diamond Purchase (10 diamonds)',
            date: '2024-01-14',
        },
    ]);

    // Chart data for last 7 days
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                data: [1200, 1800, 1500, 2200, 1900, 2500, 2100],
            },
        ],
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Earnings</Text>
                <Text style={styles.headerSubtitle}>Track your income and transactions</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="cash" size={24} color={COLORS.success} />
                        </View>
                        <Text style={styles.statLabel}>Total Earned</Text>
                        <Text style={styles.statValue}>PKR {stats.totalEarnings.toLocaleString()}</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
                            <Ionicons name="calendar" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statLabel}>This Month</Text>
                        <Text style={styles.statValue}>PKR {stats.thisMonth.toLocaleString()}</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
                            <Ionicons name="time" size={24} color={COLORS.warning} />
                        </View>
                        <Text style={styles.statLabel}>Pending</Text>
                        <Text style={styles.statValue}>PKR {stats.pendingPayouts.toLocaleString()}</Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                            <Ionicons name="checkmark-done" size={24} color={COLORS.secondary} />
                        </View>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                        <Text style={styles.statValue}>{stats.completedJobs}</Text>
                    </Card>
                </View>

                {/* Earnings Chart */}
                <Card style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Weekly Earnings</Text>
                    <LineChart
                        data={chartData}
                        width={screenWidth - SIZES.padding * 4}
                        height={200}
                        chartConfig={{
                            backgroundColor: COLORS.surface,
                            backgroundGradientFrom: COLORS.surface,
                            backgroundGradientTo: COLORS.surface,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 172, 193, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
                            style: {
                                borderRadius: 16,
                            },
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: COLORS.primary,
                            },
                        }}
                        bezier
                        style={styles.chart}
                    />
                </Card>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>

                    {transactions.length === 0 ? (
                        <EmptyState
                            icon="receipt-outline"
                            title="No Transactions"
                            message="Your transaction history will appear here"
                        />
                    ) : (
                        transactions.map((transaction) => (
                            <Card key={transaction.id} style={styles.transactionCard}>
                                <View style={styles.transactionMain}>
                                    <View
                                        style={[
                                            styles.transactionIcon,
                                            {
                                                backgroundColor:
                                                    transaction.type === 'earning'
                                                        ? COLORS.success + '20'
                                                        : COLORS.danger + '20',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={transaction.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                                            size={20}
                                            color={transaction.type === 'earning' ? COLORS.success : COLORS.danger}
                                        />
                                    </View>
                                    <View style={styles.transactionDetails}>
                                        <Text style={styles.transactionDescription}>
                                            {transaction.description}
                                        </Text>
                                        <Text style={styles.transactionDate}>{transaction.date}</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.transactionAmount,
                                            {
                                                color:
                                                    transaction.type === 'earning' ? COLORS.success : COLORS.danger,
                                            },
                                        ]}
                                    >
                                        {transaction.amount > 0 ? '+' : ''}PKR {Math.abs(transaction.amount)}
                                    </Text>
                                </View>
                            </Card>
                        ))
                    )}
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
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: (screenWidth - SIZES.padding * 2 - 12) / 2,
        padding: SIZES.padding,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    chartCard: {
        padding: SIZES.padding,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    transactionCard: {
        padding: SIZES.padding,
        marginBottom: 12,
    },
    transactionMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: SIZES.base,
        fontWeight: '500',
        fontFamily: FONTS.medium,
        color: COLORS.text,
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    transactionAmount: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
    },
});
