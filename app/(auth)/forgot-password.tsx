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
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const { showModal } = useModal();

    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleContactAdmin = async () => {
        const cleanNumber = phone.replace(/\s/g, '');
        if (cleanNumber.length < 10) {
            showErrorModal(showModal, t('common.error'), t('errors.invalidPhone'));
            return;
        }

        setLoading(true);
        try {
            const fullNumber = '+92' + cleanNumber.replace(/^0/, '');

            // Check if account exists
            const [mechanicsSnap, customersSnap] = await Promise.all([
                getDocs(query(collection(firestore, 'mechanics'), where('phone', '==', fullNumber))),
                getDocs(query(collection(firestore, 'customers'), where('phone', '==', fullNumber)))
            ]);

            if (mechanicsSnap.empty && customersSnap.empty) {
                showErrorModal(
                    showModal,
                    isUrdu ? 'اکاؤنٹ نہیں ملا' : 'Account not found',
                    isUrdu ? 'اس نمبر سے کوئی اکاؤنٹ رجسٹرڈ نہیں ہے۔ براہ کرم نیا اکاؤنٹ بنائیں۔' : 'No account is registered with this number. Please register a new account.'
                );
                return;
            }

            // Get the user's name
            let userName = '';
            if (!mechanicsSnap.empty) {
                userName = mechanicsSnap.docs[0].data().name;
            } else if (!customersSnap.empty) {
                userName = customersSnap.docs[0].data().name;
            }

            showSuccessModal(
                showModal,
                isUrdu ? 'اکاؤنٹ تصدیق' : 'Account Confirmed',
                isUrdu 
                    ? `اکاؤنٹ "${userName}" ملا۔\n\nپاسورڈ ری سیٹ کے لیے ایڈمن سے رابطہ کریں یا نیا اکاؤنٹ بنائیں۔`
                    : `Account "${userName}" found.\n\nPlease contact administration to reset your password or create a new account.`,
                () => router.replace('/(auth)/phone-login')
            );

        } catch (error: any) {
            showErrorModal(showModal, t('common.error'), error.message);
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
                            <Ionicons name="key" size={40} color={COLORS.white} />
                        </LinearGradient>
                        <Text style={[styles.title, isUrdu && styles.urduText]}>
                            {t('auth.forgotPassword')}
                        </Text>
                        <Text style={[styles.subtitle, isUrdu && styles.urduText]}>
                            {isUrdu ? 'اپنا فون نمبر درج کریں تاکہ ہم آپ کا اکاؤنٹ تلاش کر سکیں' : 'Enter your phone number so we can find your account'}
                        </Text>
                    </View>

                    <View style={[styles.phoneInputContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.countryCode, isUrdu && { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
                            <Text style={styles.flag}>🇵🇰</Text>
                            <Text style={styles.countryCodeText}>+92</Text>
                        </View>
                        <TextInput
                            style={[styles.phoneInput, isUrdu && styles.rtlInput]}
                            placeholder="3XX XXX XXXX"
                            placeholderTextColor={COLORS.textSecondary}
                            value={phone}
                            onChangeText={formatPhoneNumber}
                            keyboardType="phone-pad"
                            maxLength={12}
                            autoFocus
                        />
                    </View>

                    {/* Info Box */}
                    <View style={[styles.infoContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                        <Text style={[styles.infoText, isUrdu && styles.urduText]}>
                            {isUrdu 
                                ? "پاسورڈ ری سیٹ کے لیے ایڈمن آپ کی شناخت تصدیق کرے گا اور نیا پاسورڈ سیٹ کرے گا۔" 
                                : "The administrator will verify your identity and set a new password for password reset."}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            phone.replace(/\s/g, '').length < 10 && styles.buttonDisabled,
                            isUrdu && { flexDirection: 'row-reverse' }
                        ]}
                        onPress={handleContactAdmin}
                        disabled={loading || phone.replace(/\s/g, '').length < 10}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>
                                    {isUrdu ? "اکاؤنٹ تلاش کریں" : "Find Account"}
                                </Text>
                                <Ionicons name="search" size={20} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Create New Account Option */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>{t('common.or')}</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={[styles.newAccountButton, isUrdu && { flexDirection: 'row-reverse' }]}
                        onPress={() => router.replace('/(auth)/complete-profile')}
                    >
                        <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.newAccountText}>
                            {t('auth.signup')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.backToLoginButton, isUrdu && { flexDirection: 'row-reverse' }]}
                        onPress={() => router.replace('/(auth)/phone-login')}
                    >
                        <Ionicons name={isUrdu ? "arrow-forward-circle" : "arrow-back-circle"} size={18} color={COLORS.primary} />
                        <Text style={styles.backToLoginText}>
                            {isUrdu ? "لاگ ان پر واپس جائیں" : "Back to Login"}
                        </Text>
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
        lineHeight: 22,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    newAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '30',
    },
    newAccountText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
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
    urduText: {
        writingDirection: 'rtl',
        textAlign: 'right',
    },
    rtlInput: {
        textAlign: 'right',
    },
});
