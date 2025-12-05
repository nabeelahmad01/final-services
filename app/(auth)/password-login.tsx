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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { loginWithPhone } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { useAuthStore } from '@/stores/authStore';

export default function PasswordLoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showModal } = useModal();
    const { setUser } = useAuthStore();

    const phone = params.phone as string;

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!password) {
            showErrorModal(showModal, 'Required', 'Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const result = await loginWithPhone(phone, password);

            if (result.success && result.user) {
                setUser(result.user);

                showSuccessModal(
                    showModal,
                    'Welcome Back!',
                    'You have logged in successfully',
                    () => {
                        if (result.user?.role === 'mechanic') {
                            router.replace('/(mechanic)/dashboard');
                        } else {
                            router.replace('/(customer)/home');
                        }
                    }
                );
            } else {
                showErrorModal(showModal, 'Login Failed', result.error || 'Invalid credentials');
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
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="lock-closed" size={40} color={COLORS.white} />
                        </LinearGradient>
                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>
                            Enter your password for{'\n'}
                            <Text style={styles.phoneText}>{phone}</Text>
                        </Text>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={COLORS.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoFocus
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

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            !password && styles.loginButtonDisabled
                        ]}
                        onPress={handleLogin}
                        disabled={loading || !password}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Login</Text>
                                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Different Account */}
                    <TouchableOpacity
                        style={styles.differentAccountButton}
                        onPress={() => router.replace('/(auth)/phone-login')}
                    >
                        <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                        <Text style={styles.differentAccountText}>Use a different phone number</Text>
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
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: SIZES.base,
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 10,
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
    loginButton: {
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
    loginButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
    forgotButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    forgotText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    differentAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: 8,
    },
    differentAccountText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
});
