import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function About() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About FixKar</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* App Icon */}
                <View style={styles.appIconContainer}>
                    <View style={styles.appIcon}>
                        <Ionicons name="construct" size={48} color={COLORS.white} />
                    </View>
                    <Text style={styles.appName}>FixKar</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                </View>

                {/* Mission */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                    <Text style={styles.cardText}>
                        FixKar is Pakistan's leading service marketplace connecting customers with verified skilled professionals. We're on a mission to make quality services accessible, affordable, and reliable for everyone.
                    </Text>
                </Card>

                {/* Features */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>What We Offer</Text>
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.featureText}>Verified Professionals</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.featureText}>Instant Service Requests</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.featureText}>Secure Payments</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.featureText}>Real-time Tracking</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.featureText}>24/7 Support</Text>
                        </View>
                    </View>
                </Card>

                {/* Contact Info */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Contact Information</Text>
                    <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.contactText}>support@fixkar.com</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.contactText}>+92 300 1234567</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.contactText}>Lahore, Pakistan</Text>
                    </View>
                </Card>

                {/* Copyright */}
                <Text style={styles.copyright}>
                    © 2024 FixKar. All rights reserved.
                </Text>
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
    appIconContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    appVersion: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    card: {
        padding: SIZES.padding,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    cardText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    featureList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    contactText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    copyright: {
        textAlign: 'center',
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        paddingVertical: 24,
    },
});
