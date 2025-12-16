import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Avatar } from '@/components/shared/Avatar';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

interface Mechanic {
    id: string;
    name: string;
    phone: string;
    email?: string;
    profilePic?: string;
    createdAt: Date;
    isBlocked?: boolean;
    isVerified?: boolean;
    kycStatus: 'pending' | 'approved' | 'rejected';
    categories: string[];
    rating: number;
    totalRatings: number;
    completedJobs: number;
    diamondBalance: number;
    totalEarnings: number;
}

const FILTERS = ['All', 'Verified', 'Pending KYC', 'Blocked'];

export default function AdminMechanicsScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [processing, setProcessing] = useState<string | null>(null);

    const loadMechanics = async () => {
        try {
            const q = query(
                collection(firestore, 'mechanics'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);
            const mechanicsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Mechanic[];

            setMechanics(mechanicsData);
        } catch (error) {
            console.error('Error loading mechanics:', error);
            showErrorModal(showModal, 'Error', 'Failed to load mechanics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadMechanics();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMechanics();
    }, []);

    const handleBlockMechanic = (mechanic: Mechanic) => {
        const action = mechanic.isBlocked ? 'unblock' : 'block';
        
        showConfirmModal(
            showModal,
            `${action.charAt(0).toUpperCase() + action.slice(1)} Mechanic`,
            `Are you sure you want to ${action} ${mechanic.name}?`,
            async () => {
                setProcessing(mechanic.id);
                try {
                    await updateDoc(doc(firestore, 'mechanics', mechanic.id), {
                        isBlocked: !mechanic.isBlocked,
                        blockedAt: mechanic.isBlocked ? null : new Date(),
                    });
                    showSuccessModal(showModal, 'Success', `Mechanic ${action}ed successfully`);
                    loadMechanics();
                } catch (error) {
                    showErrorModal(showModal, 'Error', `Failed to ${action} mechanic`);
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    const handleAdjustDiamonds = (mechanic: Mechanic) => {
        // This would open a modal to adjust diamonds
        // For now, just show an alert
        showConfirmModal(
            showModal,
            'Add Diamonds',
            `Add 10 diamonds to ${mechanic.name}'s wallet?`,
            async () => {
                setProcessing(mechanic.id);
                try {
                    await updateDoc(doc(firestore, 'mechanics', mechanic.id), {
                        diamondBalance: (mechanic.diamondBalance || 0) + 10,
                    });
                    showSuccessModal(showModal, 'Success', '10 diamonds added');
                    loadMechanics();
                } catch (error) {
                    showErrorModal(showModal, 'Error', 'Failed to add diamonds');
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    const getFilteredMechanics = () => {
        let filtered = mechanics;

        // Apply search
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.name?.toLowerCase().includes(searchLower) ||
                m.phone?.includes(searchQuery)
            );
        }

        // Apply filter
        switch (activeFilter) {
            case 'Verified':
                filtered = filtered.filter(m => m.kycStatus === 'approved');
                break;
            case 'Pending KYC':
                filtered = filtered.filter(m => m.kycStatus === 'pending');
                break;
            case 'Blocked':
                filtered = filtered.filter(m => m.isBlocked);
                break;
        }

        return filtered;
    };

    const getKYCBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return { color: COLORS.success, text: 'Verified', icon: 'checkmark-circle' };
            case 'pending':
                return { color: COLORS.warning, text: 'Pending', icon: 'time' };
            case 'rejected':
                return { color: COLORS.danger, text: 'Rejected', icon: 'close-circle' };
            default:
                return { color: COLORS.textSecondary, text: 'Unknown', icon: 'help-circle' };
        }
    };

    const renderMechanic = ({ item }: { item: Mechanic }) => {
        const kycBadge = getKYCBadge(item.kycStatus);

        return (
            <Card style={styles.mechanicCard}>
                <View style={styles.mechanicHeader}>
                    <Avatar uri={item.profilePic} name={item.name} size={50} />
                    <View style={styles.mechanicInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.mechanicName}>{item.name}</Text>
                            {item.isBlocked && (
                                <View style={styles.blockedBadge}>
                                    <Text style={styles.blockedText}>Blocked</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.mechanicPhone}>{item.phone}</Text>
                        <View style={styles.kycBadge}>
                            <Ionicons name={kycBadge.icon as any} size={12} color={kycBadge.color} />
                            <Text style={[styles.kycText, { color: kycBadge.color }]}>
                                {kycBadge.text}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.completedJobs || 0}</Text>
                        <Text style={styles.statLabel}>Jobs</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>💎 {item.diamondBalance || 0}</Text>
                        <Text style={styles.statLabel}>Diamonds</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>PKR {item.totalEarnings || 0}</Text>
                        <Text style={styles.statLabel}>Earnings</Text>
                    </View>
                </View>

                {/* Categories */}
                {item.categories && item.categories.length > 0 && (
                    <View style={styles.categoriesRow}>
                        {item.categories.map((cat, index) => (
                            <View key={index} style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{cat}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.primary + '20' }]}
                        onPress={() => handleAdjustDiamonds(item)}
                    >
                        <Ionicons name="diamond" size={16} color={COLORS.primary} />
                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Diamonds</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            { backgroundColor: item.isBlocked ? COLORS.success + '20' : COLORS.danger + '20' }
                        ]}
                        onPress={() => handleBlockMechanic(item)}
                    >
                        <Ionicons 
                            name={item.isBlocked ? "checkmark-circle" : "ban"} 
                            size={16} 
                            color={item.isBlocked ? COLORS.success : COLORS.danger}
                        />
                        <Text style={[
                            styles.actionBtnText,
                            { color: item.isBlocked ? COLORS.success : COLORS.danger }
                        ]}>
                            {item.isBlocked ? 'Unblock' : 'Block'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const filteredMechanics = getFilteredMechanics();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Mechanic Management</Text>
                    <Text style={styles.headerSubtitle}>{mechanics.length} mechanics</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or phone..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {FILTERS.map(filter => (
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

            {/* Mechanics List */}
            <FlatList
                data={filteredMechanics}
                renderItem={renderMechanic}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="construct-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No Mechanics Found</Text>
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
        color: COLORS.textSecondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: SIZES.padding,
        marginBottom: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginBottom: 8,
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
    },
    mechanicCard: {
        marginBottom: 12,
        padding: 16,
    },
    mechanicHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    mechanicInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mechanicName: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    mechanicPhone: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    kycBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    kycText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
    },
    blockedBadge: {
        backgroundColor: COLORS.danger + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    blockedText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.danger,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginBottom: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    statLabel: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    categoriesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    categoryChip: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    actionBtnText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
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
});
