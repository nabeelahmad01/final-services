import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

interface ProtectionCard {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconBgColor: string;
}

export default function SafetyScreen() {
    const router = useRouter();

    const protectionCards: ProtectionCard[] = [
        {
            id: 'proactive_support',
            title: 'Proactive safety support',
            icon: 'shield-checkmark',
            iconBgColor: '#C6F135',
        },
        {
            id: 'verification',
            title: 'Drivers verification',
            icon: 'card',
            iconBgColor: '#C6F135',
        },
        {
            id: 'privacy',
            title: 'Protecting your privacy',
            icon: 'call',
            iconBgColor: '#C6F135',
        },
        {
            id: 'safe_ride',
            title: 'Staying safe on every ride',
            icon: 'settings',
            iconBgColor: '#C6F135',
        },
        {
            id: 'accidents',
            title: 'Accidents: Steps to take',
            icon: 'warning',
            iconBgColor: '#FFD93D',
        },
    ];

    const handleCallEmergency = () => {
        Linking.openURL('tel:15');
    };

    const handleSupport = () => {
        router.push('/(shared)/help-support');
    };

    const handleEmergencyContacts = () => {
        // Future: Navigate to emergency contacts management screen
        // For now, show help-support
        router.push('/(shared)/help-support');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="menu" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Safety</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleSupport}>
                        <Ionicons name="chatbox-ellipses" size={24} color={COLORS.text} />
                        <Text style={styles.quickActionText}>Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionCard} onPress={handleEmergencyContacts}>
                        <Ionicons name="people" size={24} color={COLORS.text} />
                        <Text style={styles.quickActionText}>Emergency contacts</Text>
                    </TouchableOpacity>
                </View>

                {/* Call 15 Emergency Button */}
                <TouchableOpacity style={styles.emergencyButton} onPress={handleCallEmergency}>
                    <View style={styles.emergencyIconContainer}>
                        <Ionicons name="medical" size={24} color={COLORS.white} />
                    </View>
                    <Text style={styles.emergencyButtonText}>Call 15</Text>
                </TouchableOpacity>

                {/* How you're protected Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How you're protected</Text>

                    <View style={styles.cardsGrid}>
                        {protectionCards.map((card, index) => (
                            <TouchableOpacity
                                key={card.id}
                                style={[
                                    styles.protectionCard,
                                    index % 2 === 0 ? styles.cardLeft : styles.cardRight,
                                ]}
                            >
                                <Text style={styles.cardTitle}>{card.title}</Text>
                                <View style={[styles.cardIconContainer, { backgroundColor: card.iconBgColor }]}>
                                    <Ionicons name={card.icon} size={32} color={COLORS.text} />
                                </View>
                            </TouchableOpacity>
                        ))}
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
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    quickActionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.surface,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    quickActionText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: COLORS.danger,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 28,
        marginBottom: 24,
    },
    emergencyIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 16,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    protectionCard: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    cardLeft: {
        marginRight: 'auto',
    },
    cardRight: {
        marginLeft: 'auto',
    },
    cardTitle: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    cardIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
});
