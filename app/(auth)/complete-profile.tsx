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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { signUpWithPhonePassword } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { validatePhone } from '@/utils/validation';
import { useTranslation } from 'react-i18next';

export default function SignupScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const { showModal } = useModal();
    const { setUser } = useAuthStore();

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [countryCode] = useState('+92');

    const formatPhoneDisplay = (text: string) => {
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

    const handleSignup = async () => {
        // Validate name
        if (!name.trim()) {
            showErrorModal(showModal, t('common.error'), isUrdu ? 'براہ کرم اپنا نام درج کریں' : 'Please enter your name');
            return;
        }

        // Validate phone
        const cleanNumber = phoneNumber.replace(/\s/g, '');
        const validation = validatePhone(cleanNumber);
        if (!validation.isValid) {
            showErrorModal(showModal, t('common.error'), t('errors.invalidPhone'));
            return;
        }

        // Validate password
        if (!password || password.length < 6) {
            showErrorModal(showModal, t('common.error'), t('errors.passwordTooShort'));
            return;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            showErrorModal(showModal, t('common.error'), t('errors.passwordMismatch'));
            return;
        }

        // Validate role
        if (!role) {
            showErrorModal(showModal, t('common.error'), isUrdu ? 'براہ کرم اپنا کردار منتخب کریں' : 'Please select your role');
            return;
        }

        setLoading(true);
        try {
            const fullNumber = countryCode + cleanNumber.replace(/^0/, '');
            const result = await signUpWithPhonePassword({
                phone: fullNumber,
                password,
                name: name.trim(),
                role,
            });

            if (result.success && result.user) {
                setUser(result.user);

                showSuccessModal(
                    showModal,
                    isUrdu ? 'FixKar میں خوش آمدید!' : 'Welcome to FixKar!',
                    role === 'mechanic'
                        ? (isUrdu ? 'اب اپنی سروس کیٹیگریز منتخب کریں' : 'Now select your service categories')
                        : (isUrdu ? 'اب آپ قریبی پیشہ ور سے سروس طلب کر سکتے ہیں' : 'Now you can request services from nearby professionals'),
                    () => {
                        if (role === 'mechanic') {
                            router.replace('/(auth)/mechanic-categories');
                        } else {
                            router.replace('/(customer)/home');
                        }
                    }
                );
            } else {
                showErrorModal(showModal, t('common.error'), result.error || (isUrdu ? 'اکاؤنٹ بنانے میں ناکامی' : 'Failed to create account'));
            }
        } catch (error: any) {
            showErrorModal(showModal, t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const RoleCard = ({
        roleType,
        icon,
        title,
        description
    }: {
        roleType: UserRole;
        icon: string;
        title: string;
        description: string;
    }) => (
        <TouchableOpacity
            style={[
                styles.roleCard,
                role === roleType && styles.roleCardSelected,
                isUrdu && { flexDirection: 'row-reverse' }
            ]}
            onPress={() => setRole(roleType)}
        >
            <View style={[
                styles.roleIconContainer,
                role === roleType && styles.roleIconContainerSelected
            ]}>
                <Ionicons
                    name={icon as any}
                    size={28}
                    color={role === roleType ? COLORS.white : COLORS.primary}
                />
            </View>
            <View style={[styles.roleContent, isUrdu && { alignItems: 'flex-end', paddingRight: 0, paddingLeft: 10 }]}>
                <Text style={[
                    styles.roleTitle,
                    role === roleType && styles.roleTitleSelected,
                    isUrdu && styles.urduText
                ]}>
                    {title}
                </Text>
                <Text style={[styles.roleDescription, isUrdu && styles.urduText]}>{description}</Text>
            </View>
            <View style={[
                styles.radioOuter,
                role === roleType && styles.radioOuterSelected
            ]}>
                {role === roleType && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>
    );

    const isFormValid = name.trim() && phoneNumber.replace(/\s/g, '').length >= 10 && password.length >= 6 && confirmPassword === password && role;

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
                        style={[styles.backButton, isUrdu && { alignSelf: 'flex-end' }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name={isUrdu ? "arrow-forward" : "arrow-back"} size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="person-add" size={36} color={COLORS.white} />
                        </LinearGradient>
                        <Text style={[styles.title, isUrdu && styles.urduText]}>
                            {t('auth.signup')}
                        </Text>
                        <Text style={[styles.subtitle, isUrdu && styles.urduText]}>
                            {isUrdu ? 'نیا اکاؤنٹ بنانے کے لیے اپنی تفصیلات درج کریں' : 'Enter your details to create a new account'}
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isUrdu && styles.urduText]}>
                            {t('auth.fullName')} *
                        </Text>
                        <View style={[styles.inputContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={[styles.input, isUrdu && styles.rtlInput]}
                                placeholder={isUrdu ? "اپنا نام درج کریں" : "Enter your full name"}
                                placeholderTextColor={COLORS.textSecondary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Phone Number Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isUrdu && styles.urduText]}>
                            {t('auth.phoneNumber')} *
                        </Text>
                        <View style={[styles.phoneInputContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <View style={[styles.countryCode, isUrdu && { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
                                <Text style={styles.flag}>🇵🇰</Text>
                                <Text style={styles.countryCodeText}>{countryCode}</Text>
                              </View>
                            <TextInput
                                style={[styles.phoneInput, isUrdu && styles.rtlInput]}
                                placeholder="3XX XXX XXXX"
                                placeholderTextColor={COLORS.textSecondary}
                                value={phoneNumber}
                                onChangeText={formatPhoneDisplay}
                                keyboardType="phone-pad"
                                maxLength={12}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isUrdu && styles.urduText]}>
                            {t('auth.password')} *
                        </Text>
                        <View style={[styles.inputContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={[styles.input, isUrdu && styles.rtlInput]}
                                placeholder={isUrdu ? "کم از کم 6 حروف" : "Minimum 6 characters"}
                                placeholderTextColor={COLORS.textSecondary}
                                value={password}
                                onChangeText={setPassword}
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

                    {/* Confirm Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isUrdu && styles.urduText]}>
                            {isUrdu ? 'پاسورڈ دوبارہ *' : 'Confirm Password *'}
                        </Text>
                        <View style={[styles.inputContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={[styles.input, isUrdu && styles.rtlInput]}
                                placeholder={isUrdu ? "پاسورڈ دوبارہ درج کریں" : "Re-enter your password"}
                                placeholderTextColor={COLORS.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                            {confirmPassword.length > 0 && (
                                <Ionicons
                                    name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={password === confirmPassword ? COLORS.success : COLORS.danger}
                                />
                            )}
                        </View>
                    </View>

                    {/* Role Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isUrdu && styles.urduText]}>
                            {t('auth.selectRole')} *
                        </Text>

                        <RoleCard
                            roleType="customer"
                            icon="person"
                            title={isUrdu ? "کسٹمر / صارف" : "Customer / User"}
                            description={isUrdu ? "مجھے سروس کی ضرورت ہے" : "I need a service"}
                        />

                        <RoleCard
                            roleType="mechanic"
                            icon="construct"
                            title={isUrdu ? "سروس دینے والا / مستری" : "Service Provider / Mechanic"}
                            description={isUrdu ? "میں سروس فراہم کرتا ہوں" : "I provide services"}
                        />
                    </View>

                    {role === 'mechanic' && (
                        <View style={[styles.noteContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                            <Text style={[styles.noteText, isUrdu && styles.urduText]}>
                                {isUrdu 
                                    ? "اگلے مرحلے میں آپ اپنی سروس کیٹیگریز منتخب کریں گے۔ KYC تصدیق کے بعد آپ کو جاب ریکویسٹس ملنا شروع ہوں گی۔" 
                                    : "In the next step, you will select your service categories. You will start receiving job requests after KYC approval."}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.signupButton,
                            !isFormValid && styles.signupButtonDisabled
                        ]}
                        onPress={handleSignup}
                        disabled={loading || !isFormValid}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.signupButtonText}>{t('auth.signup')}</Text>
                                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={[styles.loginLinkContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <Text style={styles.loginLinkText}>
                            {t('auth.alreadyHaveAccount')}{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace('/(auth)/phone-login')}
                        >
                            <Text style={styles.loginLink}>{t('auth.login')}</Text>
                        </TouchableOpacity>
                    </View>
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
        marginBottom: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        gap: 4,
    },
    flag: {
        fontSize: 18,
    },
    countryCodeText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        letterSpacing: 1,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
        gap: 14,
    },
    roleCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08',
    },
    roleIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleIconContainerSelected: {
        backgroundColor: COLORS.primary,
    },
    roleContent: {
        flex: 1,
    },
    roleTitle: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 4,
    },
    roleTitleSelected: {
        color: COLORS.primary,
    },
    roleDescription: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primary + '12',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    noteText: {
        flex: 1,
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
    signupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    signupButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    signupButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    loginLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    loginLinkText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    loginLink: {
        fontSize: SIZES.base,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    urduText: {
        writingDirection: 'rtl',
        textAlign: 'right',
    },
    rtlInput: {
        textAlign: 'right',
    },
});
