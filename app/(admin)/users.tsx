import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Avatar } from '@/components/shared/Avatar';
import { useModal, showSuccessModal, showErrorModal, showConfirmModal } from '@/utils/modalService';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    profilePic?: string;
    createdAt: Date;
    isBlocked?: boolean;
    totalBookings?: number;
}

export default function AdminUsersScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const loadCustomers = async () => {
        try {
            const q = query(
                collection(firestore, 'customers'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);
            const customersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Customer[];

            setCustomers(customersData);
        } catch (error) {
            console.error('Error loading customers:', error);
            showErrorModal(showModal, 'Error', 'Failed to load customers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCustomers();
    }, []);

    const handleBlockUser = (customer: Customer) => {
        const action = customer.isBlocked ? 'unblock' : 'block';
        
        showConfirmModal(
            showModal,
            `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            `Are you sure you want to ${action} ${customer.name}?`,
            async () => {
                setProcessing(customer.id);
                try {
                    await updateDoc(doc(firestore, 'customers', customer.id), {
                        isBlocked: !customer.isBlocked,
                        blockedAt: customer.isBlocked ? null : new Date(),
                    });
                    showSuccessModal(showModal, 'Success', `User ${action}ed successfully`);
                    loadCustomers();
                } catch (error) {
                    showErrorModal(showModal, 'Error', `Failed to ${action} user`);
                } finally {
                    setProcessing(null);
                }
            },
            undefined,
            action.charAt(0).toUpperCase() + action.slice(1),
            'Cancel'
        );
    };

    const filteredCustomers = customers.filter(customer => {
        const searchLower = searchQuery.toLowerCase();
        return (
            customer.name?.toLowerCase().includes(searchLower) ||
            customer.phone?.includes(searchQuery) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    });

    const renderCustomer = ({ item }: { item: Customer }) => (
        <Card style={styles.customerCard}>
            <View style={styles.customerHeader}>
                <Avatar uri={item.profilePic} name={item.name} size={50} />
                <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerPhone}>{item.phone}</Text>
                    {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
                </View>
                {item.isBlocked && (
                    <View style={styles.blockedBadge}>
                        <Text style={styles.blockedText}>Blocked</Text>
                    </View>
                )}
            </View>

            <View style={styles.customerMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>
                        Joined: {item.createdAt.toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="car-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>
                        Bookings: {item.totalBookings || 0}
                    </Text>
                </View>
            </View>

            <View style={styles.customerActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: COLORS.info + '20' }]}
                    onPress={() => {/* View details */}}
                >
                    <Ionicons name="eye-outline" size={18} color={COLORS.info} />
                    <Text style={[styles.actionButtonText, { color: COLORS.info }]}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: item.isBlocked ? COLORS.success + '20' : COLORS.danger + '20' }
                    ]}
                    onPress={() => handleBlockUser(item)}
                    disabled={processing === item.id}
                >
                    <Ionicons 
                        name={item.isBlocked ? "checkmark-circle-outline" : "ban-outline"} 
                        size={18} 
                        color={item.isBlocked ? COLORS.success : COLORS.danger} 
                    />
                    <Text style={[
                        styles.actionButtonText, 
                        { color: item.isBlocked ? COLORS.success : COLORS.danger }
                    ]}>
                        {item.isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Customer Management</Text>
                    <Text style={styles.headerSubtitle}>{customers.length} customers</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, phone, or email..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Customer List */}
            <FlatList
                data={filteredCustomers}
                renderItem={renderCustomer}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No Customers Found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Try a different search term' : 'No customers registered yet'}
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
        color: COLORS.textSecondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: SIZES.padding,
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
    list: {
        padding: SIZES.padding,
        paddingTop: 0,
    },
    customerCard: {
        marginBottom: 12,
        padding: 16,
    },
    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    customerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    customerName: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    customerPhone: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    customerEmail: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    blockedBadge: {
        backgroundColor: COLORS.danger + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    blockedText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.medium,
        color: COLORS.danger,
    },
    customerMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: SIZES.xs,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    customerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
    },
    emptyState: {
        flex: 1,
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
