import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Avatar } from '@/components/shared/Avatar';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

interface Dispute {
    id: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    mechanicId: string;
    mechanicName: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved' | 'rejected';
    resolution?: string;
    createdAt: Date;
    resolvedAt?: Date;
    amount?: number;
}

const STATUS_FILTERS = ['All', 'Open', 'Under Review', 'Resolved'];

export default function AdminDisputesScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [processing, setProcessing] = useState<string | null>(null);

    const loadDisputes = async () => {
        try {
            const q = query(
                collection(firestore, 'disputes'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const disputesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                resolvedAt: doc.data().resolvedAt?.toDate(),
            })) as Dispute[];

            setDisputes(disputesData);
        } catch (error) {
            console.error('Error loading disputes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDisputes();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDisputes();
    }, []);

    const handleResolve = (dispute: Dispute, action: 'refund' | 'reject' | 'warn') => {
        let title = '';
        let message = '';
        let resolution = '';

        switch (action) {
            case 'refund':
                title = 'Issue Refund';
                message = `Issue full refund of PKR ${dispute.amount || 0} to ${dispute.customerName}?`;
                resolution = 'Refund issued to customer';
                break;
            case 'reject':
                title = 'Reject Dispute';
                message = `Reject this dispute from ${dispute.customerName}?`;
                resolution = 'Dispute rejected - no action taken';
                break;
            case 'warn':
                title = 'Warn Mechanic';
                message = `Send warning to ${dispute.mechanicName}?`;
                resolution = 'Warning issued to mechanic';
                break;
        }

        showConfirmModal(
            showModal,
            title,
            message,
            async () => {
                setProcessing(dispute.id);
                try {
                    await updateDoc(doc(firestore, 'disputes', dispute.id), {
                        status: action === 'reject' ? 'rejected' : 'resolved',
                        resolution,
                        resolvedAt: Timestamp.now(),
                    });

                    // If warning, update mechanic record
                    if (action === 'warn') {
                        await updateDoc(doc(firestore, 'mechanics', dispute.mechanicId), {
                            warningCount: (dispute as any).warningCount ? (dispute as any).warningCount + 1 : 1,
                            lastWarning: new Date(),
                        });
                    }

                    showSuccessModal(showModal, 'Success', 'Dispute resolved successfully');
                    loadDisputes();
                } catch (error) {
                    showErrorModal(showModal, 'Error', 'Failed to resolve dispute');
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return COLORS.danger;
            case 'under_review':
                return COLORS.warning;
            case 'resolved':
                return COLORS.success;
            case 'rejected':
                return COLORS.textSecondary;
            default:
                return COLORS.textSecondary;
        }
    };

    const getFilteredDisputes = () => {
        if (activeFilter === 'All') return disputes;
        const filterMap: { [key: string]: string } = {
            'Open': 'open',
            'Under Review': 'under_review',
            'Resolved': 'resolved',
        };
        return disputes.filter(d => d.status === filterMap[activeFilter]);
    };

    const renderDispute = ({ item }: { item: Dispute }) => (
        <Card style={styles.disputeCard}>
            <View style={styles.disputeHeader}>
                <View style={styles.disputeId}>
                    <Text style={styles.disputeIdText}>Case #{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.disputeDate}>
                        {item.createdAt.toLocaleDateString()}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.participants}>
                <View style={styles.participantCard}>
                    <Text style={styles.participantLabel}>Customer</Text>
                    <Text style={styles.participantName}>{item.customerName}</Text>
                </View>
                <Text style={styles.vsText}>vs</Text>
                <View style={styles.participantCard}>
                    <Text style={styles.participantLabel}>Mechanic</Text>
                    <Text style={styles.participantName}>{item.mechanicName}</Text>
                </View>
            </View>

            <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Description:</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
            </View>

            {item.amount && (
                <View style={styles.amountSection}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.amountText}>Disputed Amount: PKR {item.amount}</Text>
                </View>
            )}

            {item.status === 'open' && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.success + '20' }]}
                        onPress={() => handleResolve(item, 'refund')}
                        disabled={processing === item.id}
                    >
                        <Ionicons name="cash" size={16} color={COLORS.success} />
                        <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Refund</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.warning + '20' }]}
                        onPress={() => handleResolve(item, 'warn')}
                        disabled={processing === item.id}
                    >
                        <Ionicons name="warning" size={16} color={COLORS.warning} />
                        <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>Warn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.danger + '20' }]}
                        onPress={() => handleResolve(item, 'reject')}
                        disabled={processing === item.id}
                    >
                        <Ionicons name="close" size={16} color={COLORS.danger} />
                        <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.resolution && (
                <View style={styles.resolutionSection}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.resolutionText}>{item.resolution}</Text>
                </View>
            )}
        </Card>
    );

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const filteredDisputes = getFilteredDisputes();
    const openCount = disputes.filter(d => d.status === 'open').length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Dispute Resolution</Text>
                    <Text style={styles.headerSubtitle}>
                        {openCount} open {openCount === 1 ? 'case' : 'cases'}
                    </Text>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {STATUS_FILTERS.map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            activeFilter === filter && styles.filterChipActive
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter && styles.filterTextActive
                        ]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Disputes List */}
            <FlatList
                data={filteredDisputes}
                renderItem={renderDispute}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-checkmark-outline" size={64} color={COLORS.success} />
                        <Text style={styles.emptyTitle}>No Disputes</Text>
                        <Text style={styles.emptyText}>
                            {activeFilter === 'All' 
                                ? 'No disputes have been reported' 
                                : `No ${activeFilter.toLowerCase()} disputes`}
                        </Text>
                    </View>
                }
            />
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 16,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.danger,
    },
    filtersContainer: {
        flexDirection: 'row',
        padding: SIZES.padding,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    list: {
        padding: SIZES.padding,
        paddingTop: 0,
    },
    disputeCard: {
        marginBottom: 16,
        padding: 16,
    },
    disputeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    disputeId: {},
    disputeIdText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    disputeDate: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.bold,
    },
    participants: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    participantCard: {
        flex: 1,
        alignItems: 'center',
    },
    participantLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    participantName: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginTop: 2,
    },
    vsText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.danger,
        marginHorizontal: 8,
    },
    reasonSection: {
        marginBottom: 8,
    },
    reasonLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    reasonText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.danger,
        marginTop: 2,
    },
    descriptionSection: {
        marginBottom: 12,
    },
    descriptionLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    descriptionText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        marginTop: 4,
        lineHeight: 20,
    },
    amountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        padding: 8,
        backgroundColor: COLORS.warning + '10',
        borderRadius: 8,
    },
    amountText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.warning,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 4,
    },
    actionBtnText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.semiBold,
    },
    resolutionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 10,
        backgroundColor: COLORS.success + '10',
        borderRadius: 8,
    },
    resolutionText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.success,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginTop: 16,
    },
    emptyText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
});
