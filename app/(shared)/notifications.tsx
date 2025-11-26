import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications } from '@/stores/useNotifications';
import { subscribeToNotifications, markNotificationAsRead } from '@/services/firebase/firestore';
import { Notification } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card } from '@/components/ui/Card';

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { notifications, setNotifications, markAsRead } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.id, (notifs) => {
            setNotifications(notifs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            markAsRead(notification.id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'new_proposal':
                router.push('/(customer)/proposals');
                break;
            case 'proposal_accepted':
                router.push('/(mechanic)/active-job');
                break;
            case 'booking_started':
            case 'booking_completed':
                user?.role === 'customer'
                    ? router.push('/(customer)/tracking')
                    : router.push('/(mechanic)/active-job');
                break;
            case 'chat':
                router.push('/(shared)/chat');
                break;
            case 'new_request':
                router.push('/(mechanic)/requests');
                break;
            default:
                break;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Notifications are real-time, so just a visual refresh
        setTimeout(() => setRefreshing(false), 1000);
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_request':
                return { name: 'hammer' as const, color: COLORS.primary };
            case 'new_proposal':
                return { name: 'document-text' as const, color: COLORS.secondary };
            case 'proposal_accepted':
                return { name: 'checkmark-circle' as const, color: COLORS.success };
            case 'booking_started':
                return { name: 'time' as const, color: COLORS.warning };
            case 'booking_completed':
                return { name: 'checkmark-done' as const, color: COLORS.success };
            case 'payment':
                return { name: 'wallet' as const, color: COLORS.primary };
            case 'kyc_update':
                return { name: 'shield-checkmark' as const, color: COLORS.success };
            case 'chat':
                return { name: 'chatbubble' as const, color: COLORS.primary };
            case 'call':
                return { name: 'call' as const, color: COLORS.secondary };
            default:
                return { name: 'notifications' as const, color: COLORS.textSecondary };
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
        const icon = getNotificationIcon(item.type);

        return (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
                <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    <Card
                        style={[
                            styles.notificationCard,
                            !item.read && styles.unreadCard,
                        ]}
                    >
                        <View style={styles.notificationContent}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: icon.color + '20' },
                                ]}
                            >
                                <Ionicons name={icon.name} size={24} color={icon.color} />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.message}>{item.message}</Text>
                                <Text style={styles.time}>
                                    {formatTime(item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt))}
                                </Text>
                            </View>

                            {!item.read && <View style={styles.unreadDot} />}
                        </View>
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-outline" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptySubtitle}>
                        You're all caught up! Notifications will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContent: {
        padding: SIZES.padding,
    },
    notificationCard: {
        marginBottom: 12,
        padding: 16,
    },
    unreadCard: {
        backgroundColor: COLORS.primary + '05',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    message: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 6,
    },
    time: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding * 2,
    },
    emptyTitle: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
