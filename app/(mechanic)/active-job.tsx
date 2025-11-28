import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToActiveBooking } from '@/services/firebase/firestore';
import { createChat } from '@/services/firebase/chatService';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/Button';
import { Alert } from 'react-native';

export default function ActiveJob() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { activeBooking, setActiveBooking } = useBookingStore();

    React.useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToActiveBooking(user.id, 'mechanic', setActiveBooking);
        return () => unsubscribe();
    }, [user]);

    const handleChat = async () => {
        if (!user || !activeBooking) return;
        try {
            const chatId = await createChat([user.id, activeBooking.customerId], activeBooking.id);
            router.push(`/(shared)/chat/${chatId}`);
        } catch (error) {
            console.error('Error opening chat:', error);
            Alert.alert('Error', 'Could not open chat');
        }
    };

    if (!activeBooking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Job</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="briefcase-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Active Job</Text>
                    <Text style={styles.emptySubtitle}>
                        Your current job details will appear here
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(mechanic)/dashboard')}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Job</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.card}>
                    <View style={styles.customerInfo}>
                        <Avatar name={activeBooking.customerName || 'Customer'} size={60} />
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{activeBooking.customerName}</Text>
                            <Text style={styles.serviceType}>{activeBooking.category}</Text>
                        </View>
                        <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                            <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.locationInfo}>
                        <Ionicons name="location" size={24} color={COLORS.primary} />
                        <Text style={styles.address}>{activeBooking.customerLocation?.address || 'Address not available'}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <Button
                            title="Navigate"
                            onPress={() => {/* TODO: Open Maps */ }}
                            style={{ flex: 1 }}
                            variant="outline"
                        />
                        <Button
                            title="Complete Job"
                            onPress={() => {/* TODO: Complete Job logic */ }}
                            style={{ flex: 1 }}
                        />
                    </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
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
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    serviceType: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    chatButton: {
        padding: 8,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 50,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    address: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
});
