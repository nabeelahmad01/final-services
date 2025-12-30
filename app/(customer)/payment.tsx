import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';

export default function Payment() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [selectedMethod, setSelectedMethod] = useState<'jazzcash' | 'easypaisa' | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [processing, setProcessing] = useState(false);

    const amount = params.amount ? parseInt(params.amount as string) : 0;

    const handlePayment = async () => {
        if (!selectedMethod) {
            showErrorModal(showModal, 'Error', 'Please select a payment method');
            return;
        }

        if (!phoneNumber) {
            showErrorModal(showModal, 'Error', 'Please enter your phone number');
            return;
        }

        // Payment integration coming soon
        showErrorModal(
            showModal,
            'Coming Soon',
            'Customer payment integration will be available soon!'
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Amount Summary */}
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={styles.summaryAmount}>PKR {amount}</Text>
                </Card>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Payment Method</Text>

                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            selectedMethod === 'jazzcash' && styles.methodCardSelected,
                        ]}
                        onPress={() => setSelectedMethod('jazzcash')}
                    >
                        <View style={styles.methodInfo}>
                            <View style={[styles.methodIcon, { backgroundColor: COLORS.danger + '20' }]}>
                                <Ionicons name="wallet" size={24} color={COLORS.danger} />
                            </View>
                            <View style={styles.methodDetails}>
                                <Text style={styles.methodName}>JazzCash</Text>
                                <Text style={styles.methodDescription}>Pay via JazzCash</Text>
                            </View>
                        </View>
                        {selectedMethod === 'jazzcash' && (
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            selectedMethod === 'easypaisa' && styles.methodCardSelected,
                        ]}
                        onPress={() => setSelectedMethod('easypaisa')}
                    >
                        <View style={styles.methodInfo}>
                            <View style={[styles.methodIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="wallet" size={24} color={COLORS.success} />
                            </View>
                            <View style={styles.methodDetails}>
                                <Text style={styles.methodName}>EasyPaisa</Text>
                                <Text style={styles.methodDescription}>Pay via EasyPaisa</Text>
                            </View>
                        </View>
                        {selectedMethod === 'easypaisa' && (
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Phone Number Input */}
                {selectedMethod && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="+92 3XX XXXXXXX"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>
                    </View>
                )}

                {/* Payment Button */}
                <Button
                    title={`Pay PKR ${amount}`}
                    onPress={handlePayment}
                    loading={processing}
                    disabled={!selectedMethod || !phoneNumber}
                    style={styles.payButton}
                />

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                    <Text style={styles.securityText}>
                        Your payment is secure and encrypted
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
    summaryCard: {
        alignItems: 'center',
        padding: SIZES.padding * 1.5,
        marginBottom: 24,
        backgroundColor: COLORS.primary + '10',
    },
    summaryLabel: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    summaryAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.primary,
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
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    methodCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    methodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodDetails: {
        gap: 2,
    },
    methodName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    methodDescription: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.surface,
        padding: SIZES.padding,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        flex: 1,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    payButton: {
        marginBottom: 16,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
    },
    securityText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
});
