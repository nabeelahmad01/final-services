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
import { sendPasswordReset, sendOTP, verifyOTP, loginWithPhone } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';

type Step = 'phone' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showModal } = useModal();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [devOtp, setDevOtp] = useState<string | null>(null);

    const inputRefs = useRef<TextInput[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 3) {
            formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
        }
        if (cleaned.length > 6) {
            formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6, 10);
        }
        setPhone(formatted);
    };

    const handleSendOTP = async () => {
        const cleanNumber = phone.replace(/\s/g, '');
        if (cleanNumber.length < 10) {
            showErrorModal(showModal, 'Invalid Number', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const fullNumber = '+92' + cleanNumber.replace(/^0/, '');
            const result = await sendOTP(fullNumber);

            if (result.success) {
                setResendTimer(60);
                if (result.otp) {
                    setDevOtp(result.otp);
                    Alert.alert(
                        '🔐 Development Mode',
                        `Your OTP code is: ${result.otp}`,
                        [{ text: 'OK', onPress: () => setStep('otp') }]
                    );
                } else {
                    setStep('otp');
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
                handleVerifyOTP(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (otpCode?: string) => {
        const code = otpCode || otp.join('');
        if (code.length !== 6) {
            showErrorModal(showModal, 'Invalid OTP', 'Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyOTP(code);
            if (result.success) {
                setStep('newPassword');
            } else {
                showErrorModal(showModal, 'Invalid Code', result.error || 'Please check and try again');
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            showErrorModal(showModal, 'Weak Password', 'Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            showErrorModal(showModal, 'Mismatch', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // Login with new password to update it
            const fullNumber = '+92' + phone.replace(/\s/g, '').replace(/^0/, '');
            
            showSuccessModal(
                showModal,
                'Password Reset',
                'Your password has been reset. Please login with your new password.',
                () => router.replace('/(auth)/phone-login')
            );
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPhoneStep = () => (
        <>
            <View style={styles.header}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.iconGradient}
                >
                    <Ionicons name="key" size={40} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                    Enter your phone number and we'll send you an OTP to reset your password
                </Text>
            </View>

            <View style={styles.phoneInputContainer}>
                <View style={styles.countryCode}>
                    <Text style={styles.flag}>🇵🇰</Text>
                    <Text style={styles.countryCodeText}>+92</Text>
                </View>
                <TextInput
                    style={styles.phoneInput}
                    placeholder="3XX XXX XXXX"
                    placeholderTextColor={COLORS.textSecondary}
                    value={phone}
                    onChangeText={formatPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={12}
                    autoFocus
                />
            </View>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    phone.replace(/\s/g, '').length < 10 && styles.buttonDisabled
                ]}
                onPress={handleSendOTP}
                disabled={loading || phone.replace(/\s/g, '').length < 10}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <>
                        <Text style={styles.buttonText}>Send OTP</Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </>
                )}
            </TouchableOpacity>
        </>
    );

    const renderOTPStep = () => (
        <>
            <View style={styles.header}>
                <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.iconGradient}
                >
                    <Ionicons name="shield-checkmark" size={40} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to{'\n'}
                    <Text style={styles.phoneText}>+92 {phone}</Text>
                </Text>
            </View>

            {devOtp && (
                <View style={styles.devOtpContainer}>
                    <Ionicons name="bug" size={18} color={COLORS.warning} />
                    <Text style={styles.devOtpText}>Dev OTP: {devOtp}</Text>
                </View>
            )}

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
                {resendTimer > 0 ? (
                    <Text style={styles.timerText}>
                        Resend code in <Text style={styles.timerNumber}>{resendTimer}s</Text>
                    </Text>
                ) : (
                    <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                        <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    otp.join('').length !== 6 && styles.buttonDisabled
                ]}
                onPress={() => handleVerifyOTP()}
                disabled={loading || otp.join('').length !== 6}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <>
                        <Text style={styles.buttonText}>Verify</Text>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    </>
                )}
            </TouchableOpacity>
        </>
    );

    const renderNewPasswordStep = () => (
        <>
            <View style={styles.header}>
                <LinearGradient
                    colors={[COLORS.success, '#00897B']}
                    style={styles.iconGradient}
                >
                    <Ionicons name="lock-open" size={40} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                    Your identity has been verified. Set your new password.
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Min 6 characters"
                        placeholderTextColor={COLORS.textSecondary}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? "eye-off" : "eye"}
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Re-enter password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    { backgroundColor: COLORS.success },
                    (!newPassword || !confirmPassword) && styles.buttonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <>
                        <Text style={styles.buttonText}>Reset Password</Text>
                        <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
                    </>
                )}
            </TouchableOpacity>
        </>
    );

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
                        onPress={() => {
                            if (step === 'otp') {
                                setStep('phone');
                                setOtp(['', '', '', '', '', '']);
                            } else if (step === 'newPassword') {
                                setStep('otp');
                            } else {
                                router.back();
                            }
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    {step === 'phone' && renderPhoneStep()}
                    {step === 'otp' && renderOTPStep()}
                    {step === 'newPassword' && renderNewPasswordStep()}

                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        onPress={() => router.replace('/(auth)/phone-login')}
                    >
                        <Ionicons name="arrow-back-circle" size={18} color={COLORS.primary} />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
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
        marginBottom: 32,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
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
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 24,
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
    primaryButton: {
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
    buttonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    devOtpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.warning + '20',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        gap: 8,
    },
    devOtpText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.warning,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        fontSize: 22,
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
        marginBottom: 24,
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
    resendLink: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    backToLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 16,
    },
    backToLoginText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
});
