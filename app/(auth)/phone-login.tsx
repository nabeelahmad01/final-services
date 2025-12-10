import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { sendOTP, isDevMode } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal } from '@/utils/modalService';

export default function PhoneLoginScreen() {
    const router = useRouter();
    const { showModal } = useModal();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [countryCode] = useState('+92');

    const handleSendOTP = async () => {
        const cleanNumber = phoneNumber.replace(/\s/g, '');
        if (cleanNumber.length < 10) {
            showErrorModal(showModal, 'Invalid Number', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const fullNumber = countryCode + cleanNumber.replace(/^0/, '');
            const result = await sendOTP(fullNumber);

            if (result.success) {
                // Show OTP for development testing
                if (result.otp) {
                    Alert.alert(
                        '🔐 Development Mode',
                        `Your OTP code is: ${result.otp}\n\nIn production, SMS would be sent.`,
                        [
                            {
                                text: 'Continue',
                                onPress: () => {
                                    router.push({
                                        pathname: '/(auth)/verify-otp',
                                        params: { phone: fullNumber }
                                    });
                                }
                            }
                        ]
                    );
                } else {
                    router.push({
                        pathname: '/(auth)/verify-otp',
                        params: { phone: fullNumber }
                    });
                }
            } else {
                showErrorModal(showModal, 'Error', result.error || 'Failed to send OTP');
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 3) {
            formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
        }
        if (cleaned.length > 6) {
            formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6, 10);
        }
        setPhoneNumber(formatted);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.header}
                    >
                        <View style={styles.logoContainer}>
                            <Ionicons name="construct" size={48} color={COLORS.white} />
                        </View>
                        <Text style={styles.appName}>FixKar</Text>
                        <Text style={styles.tagline}>Your trusted service partner</Text>
                    </LinearGradient>

                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Login with Phone</Text>
                        <Text style={styles.subtitle}>
                            Enter your phone number to receive a verification code
                        </Text>

                        <View style={styles.phoneInputContainer}>
                            <View style={styles.countryCode}>
                                <Text style={styles.flag}>🇵🇰</Text>
                                <Text style={styles.countryCodeText}>{countryCode}</Text>
                                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="3XX XXX XXXX"
                                placeholderTextColor={COLORS.textSecondary}
                                value={phoneNumber}
                                onChangeText={formatPhoneNumber}
                                keyboardType="phone-pad"
                                maxLength={12}
                                autoFocus
                            />
                        </View>

                        <View style={styles.infoContainer}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                We'll send you a 6-digit code via SMS to verify your number
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                phoneNumber.replace(/\s/g, '').length < 10 && styles.sendButtonDisabled
                            ]}
                            onPress={handleSendOTP}
                            disabled={loading || phoneNumber.replace(/\s/g, '').length < 10}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <Text style={styles.sendButtonText}>Send OTP</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.termsText}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
        marginBottom: 8,
    },
    tagline: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.white,
        opacity: 0.9,
    },
    formContainer: {
        flex: 1,
        padding: 24,
        marginTop: -30,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 10,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginBottom: 32,
        lineHeight: 22,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 16,
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        gap: 6,
    },
    flag: {
        fontSize: 20,
    },
    countryCodeText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 18,
        fontSize: SIZES.lg,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        letterSpacing: 1,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primary + '10',
        padding: 14,
        borderRadius: 12,
        marginBottom: 24,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    termsText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 20,
    },
    termsLink: {
        color: COLORS.primary,
        fontFamily: FONTS.medium,
    },
});
