import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '@/constants/theme';

export default function WelcomeScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const toggleLanguage = () => {
        i18n.changeLanguage(isUrdu ? 'en' : 'ur');
    };

    const handleGetStarted = () => {
        router.push('/(auth)/phone-login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.surface]}
                style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.content}>
                {/* Language Toggle */}
                <Animated.View 
                    entering={FadeInDown.delay(100)}
                    style={styles.languageToggle}
                >
                    <TouchableOpacity
                        onPress={toggleLanguage}
                        style={[styles.langButton, !isUrdu && styles.langButtonActive]}
                    >
                        <Text style={[styles.langText, !isUrdu && styles.langTextActive]}>EN 🇺🇸</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={toggleLanguage}
                        style={[styles.langButton, isUrdu && styles.langButtonActive]}
                    >
                        <Text style={[styles.langText, isUrdu && styles.langTextActive]}>اردو 🇵🇰</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Logo & Brand */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.logoSection}
                >
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark || '#1a6b5c']}
                            style={styles.logoGradient}
                        >
                            <Ionicons name="construct" size={48} color={COLORS.white} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.brandName}>FixKar</Text>
                    <Text style={[styles.tagline, isUrdu && styles.urduText]}>
                        {isUrdu ? 'آپ کی سروس، آپ کے دروازے پر' : 'Your Service, At Your Doorstep'}
                    </Text>
                </Animated.View>

                {/* Features */}
                <Animated.View 
                    entering={FadeInUp.delay(400)}
                    style={styles.featuresContainer}
                >
                    <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.featureText, isUrdu && styles.urduText]}>
                                {isUrdu ? 'تصدیق شدہ مستری' : 'Verified Mechanics'}
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                                <Ionicons name="location" size={24} color={COLORS.secondary} />
                            </View>
                            <Text style={[styles.featureText, isUrdu && styles.urduText]}>
                                {isUrdu ? 'لائیو ٹریکنگ' : 'Live Tracking'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Ionicons name="cash" size={24} color={COLORS.success} />
                            </View>
                            <Text style={[styles.featureText, isUrdu && styles.urduText]}>
                                {isUrdu ? 'آسان ادائیگی' : 'Easy Payment'}
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: COLORS.warning + '20' }]}>
                                <Ionicons name="star" size={24} color={COLORS.warning} />
                            </View>
                            <Text style={[styles.featureText, isUrdu && styles.urduText]}>
                                {isUrdu ? 'ریٹنگ سسٹم' : 'Rating System'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Get Started Button */}
                <Animated.View 
                    entering={FadeInUp.delay(600)}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        style={styles.getStartedButton}
                        onPress={handleGetStarted}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark || '#1a6b5c']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.getStartedText}>
                                {isUrdu ? 'شروع کریں' : 'Get Started'}
                            </Text>
                            <Ionicons 
                                name={isUrdu ? "arrow-back" : "arrow-forward"} 
                                size={24} 
                                color={COLORS.white} 
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        style={styles.loginLink}
                    >
                        <Text style={[styles.loginText, isUrdu && styles.urduText]}>
                            {isUrdu ? 'پہلے سے اکاؤنٹ ہے؟ ' : 'Already have an account? '}
                            <Text style={styles.loginTextBold}>{t('auth.login')}</Text>
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Admin Access - Hidden at bottom */}
                <TouchableOpacity
                    onPress={() => router.push('/(admin)')}
                    style={styles.adminLink}
                >
                    <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.adminText}>Admin</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SIZES.padding * 1.5,
        justifyContent: 'space-between',
    },
    languageToggle: {
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 25,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    langButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    langButtonActive: {
        backgroundColor: COLORS.primary,
    },
    langText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    langTextActive: {
        color: COLORS.white,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    brandName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    urduText: {
        writingDirection: 'rtl',
        textAlign: 'center',
    },
    featuresContainer: {
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    featureItem: {
        alignItems: 'center',
        width: 140,
    },
    featureIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        gap: 16,
    },
    getStartedButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    getStartedText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    loginLink: {
        alignItems: 'center',
        padding: 8,
    },
    loginText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    loginTextBold: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    adminLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 8,
        opacity: 0.5,
    },
    adminText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});
