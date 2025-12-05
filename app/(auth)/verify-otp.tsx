import React, { useState, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { verifyOTP, sendOTP, getPendingPhone } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyOTPScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showModal } = useModal();
    const { setUser } = useAuthStore();

    const phone = params.phone as string;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<TextInput[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleOtpChange = (value: string, index: number) => {
        const numericValue = value.replace(/\D/g, '');

        const newOtp = [...otp];
        newOtp[index] = numericValue.slice(-1);
        setOtp(newOtp);

        if (numericValue && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && numericValue) {
            const fullOtp = [...newOtp.slice(0, 5), numericValue.slice(-1)].join('');
            if (fullOtp.length === 6) {
                handleVerify(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpCode?: string) => {
        const code = otpCode || otp.join('');

        if (code.length !== 6) {
            showErrorModal(showModal, 'Invalid OTP', 'Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyOTP(code);

            if (result.success) {
                if (result.isNewUser) {
                    // New user - go to profile completion with phone
                    router.replace({
                        pathname: '/(auth)/complete-profile',
                        params: { phone: result.phone || phone }
                    });
                } else {
                    // Existing user - go to password login screen
                    router.replace({
                        pathname: '/(auth)/password-login',
                        params: { phone: result.phone || phone }
                    });
                }
            } else {
                showErrorModal(showModal, 'Invalid Code', result.error || 'Please check and try again');
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setLoading(true);
        try {
            const result = await sendOTP(phone);
            if (result.success) {
                setResendTimer(60);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();

                if (result.otp) {
                    Alert.alert(
                        '🔐 New OTP',
                        `Your new OTP code is: ${result.otp}`,
                        [{ text: 'OK' }]
                    );
                }
            } else {
                showErrorModal(showModal, 'Error', result.error || 'Failed to resend');
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.iconGradient}
                            >
                                <Ionicons name="shield-checkmark" size={40} color={COLORS.white} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Verify Phone</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code sent to{'\n'}
                            <Text style={styles.phoneText}>{phone}</Text>
                        </Text>
                    </View>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    if (ref) inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    <View style={styles.resendContainer}>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResend} disabled={loading}>
                                <Text style={styles.resendText}>
                                    Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.timerText}>
                                Resend code in <Text style={styles.timerNumber}>{resendTimer}s</Text>
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            otp.join('').length !== 6 && styles.verifyButtonDisabled
                        ]}
                        onPress={() => handleVerify()}
                        disabled={loading || otp.join('').length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.changeNumberButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.changeNumberText}>Change phone number</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    phoneText: {
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    otpInput: {
        width: 50,
        height: 60,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: COLORS.text,
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    resendText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    resendLink: {
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    timerText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    timerNumber: {
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    verifyButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    changeNumberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 20,
        paddingVertical: 12,
    },
    changeNumberText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
});
