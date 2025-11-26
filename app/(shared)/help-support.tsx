import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

interface FAQItem {
    question: string;
    answer: string;
}

export default function HelpSupport() {
    const router = useRouter();
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            question: 'How do I request a service?',
            answer: 'Simply select the service category you need from the home screen, describe your issue, and submit your request. Nearby verified mechanics will send you proposals.',
        },
        {
            question: 'How does payment work?',
            answer: 'You can pay through JazzCash or EasyPaisa after the service is completed. Your payment is secure and processed through our verified payment partners.',
        },
        {
            question: 'How are mechanics verified?',
            answer: 'All mechanics must complete KYC verification including CNIC and relevant certifications before they can accept service requests.',
        },
        {
            question: 'Can I cancel a booking?',
            answer: 'Yes, you can cancel a booking before the mechanic arrives. However, repeated cancellations may affect your account standing.',
        },
        {
            question: 'How do I report an issue?',
            answer: 'You can report issues through the support contact options below or directly from the booking details screen.',
        },
    ];

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@fixkar.com');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+923001234567');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>

                    <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                        <View style={[styles.contactIcon, { backgroundColor: COLORS.primary + '20' }]}>
                            <Ionicons name="mail" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Email Support</Text>
                            <Text style={styles.contactValue}>support@fixkar.com</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                        <View style={[styles.contactIcon, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="call" size={24} color={COLORS.success} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Phone Support</Text>
                            <Text style={styles.contactValue}>+92 300 1234567</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                    {faqs.map((faq, index) => (
                        <Card key={index} style={styles.faqCard}>
                            <TouchableOpacity
                                onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                                style={styles.faqHeader}
                            >
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                            {expandedFAQ === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </Card>
                    ))}
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
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.surface,
        padding: SIZES.padding,
        borderRadius: 12,
        marginBottom: 12,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    faqCard: {
        padding: SIZES.padding,
        marginBottom: 12,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    faqQuestion: {
        flex: 1,
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    faqAnswer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
});
