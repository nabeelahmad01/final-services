import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function TermsOfService() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                    <Text style={styles.sectionText}>
                        By accessing and using FixKar, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Description of Service</Text>
                    <Text style={styles.sectionText}>
                        FixKar is a platform that connects customers with verified service providers including mechanics, electricians, plumbers, and other skilled professionals. We facilitate the connection but are not responsible for the actual services provided.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. User Accounts</Text>
                    <Text style={styles.sectionText}>
                        • You must provide accurate and complete registration information{'\n'}
                        • You are responsible for maintaining the security of your account{'\n'}
                        • You must notify us immediately of any unauthorized access{'\n'}
                        • One person may only have one active account
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Service Provider Terms</Text>
                    <Text style={styles.sectionText}>
                        Service providers must:{'\n\n'}
                        • Complete KYC verification before accepting requests{'\n'}
                        • Provide accurate information about their qualifications{'\n'}
                        • Maintain professional conduct at all times{'\n'}
                        • Honor the prices quoted in their proposals{'\n'}
                        • Complete services as described
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Customer Terms</Text>
                    <Text style={styles.sectionText}>
                        Customers must:{'\n\n'}
                        • Provide accurate service request information{'\n'}
                        • Be available at the specified location{'\n'}
                        • Make timely payments for completed services{'\n'}
                        • Treat service providers with respect
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Payments</Text>
                    <Text style={styles.sectionText}>
                        • All payments are processed through secure payment gateways{'\n'}
                        • Service providers receive payment after service completion{'\n'}
                        • Diamond credits are non-refundable{'\n'}
                        • Disputed payments will be resolved per our dispute policy
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Prohibited Conduct</Text>
                    <Text style={styles.sectionText}>
                        Users may not:{'\n\n'}
                        • Provide false information{'\n'}
                        • Engage in fraudulent activities{'\n'}
                        • Harass other users{'\n'}
                        • Circumvent the platform for direct transactions{'\n'}
                        • Violate any applicable laws
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Termination</Text>
                    <Text style={styles.sectionText}>
                        We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through the app settings.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Contact</Text>
                    <Text style={styles.sectionText}>
                        For questions about these Terms, contact us at:{'\n\n'}
                        Email: support@fixkar.com{'\n'}
                        Phone: +92 300 1234567
                    </Text>
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
    lastUpdated: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    sectionText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
});
