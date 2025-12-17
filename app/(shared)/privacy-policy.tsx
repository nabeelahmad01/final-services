import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.sectionText}>
                        We collect information you provide directly to us, including:{'\n\n'}
                        • Personal information (name, phone number, email){'\n'}
                        • Location data when using our services{'\n'}
                        • Payment information for transactions{'\n'}
                        • Service request details and history{'\n'}
                        • Communication between users and service providers
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                    <Text style={styles.sectionText}>
                        We use the information we collect to:{'\n\n'}
                        • Provide, maintain, and improve our services{'\n'}
                        • Connect customers with verified service providers{'\n'}
                        • Process transactions and send related information{'\n'}
                        • Send technical notices and support messages{'\n'}
                        • Respond to your comments and questions{'\n'}
                        • Protect against fraudulent or illegal activity
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                    <Text style={styles.sectionText}>
                        We may share your information:{'\n\n'}
                        • With service providers to complete your requests{'\n'}
                        • With payment processors to process transactions{'\n'}
                        • When required by law or to protect our rights{'\n'}
                        • With your consent or at your direction{'\n\n'}
                        We do not sell your personal information to third parties.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Data Security</Text>
                    <Text style={styles.sectionText}>
                        We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We strive to use commercially acceptable means to protect your data.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Your Rights</Text>
                    <Text style={styles.sectionText}>
                        You have the right to:{'\n\n'}
                        • Access your personal information{'\n'}
                        • Correct inaccurate data{'\n'}
                        • Delete your account and data{'\n'}
                        • Opt-out of promotional communications
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Contact Us</Text>
                    <Text style={styles.sectionText}>
                        If you have questions about this Privacy Policy, please contact us at:{'\n\n'}
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
