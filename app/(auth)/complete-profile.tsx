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
import { completeProfile } from '@/services/firebase/phoneAuth';
import { useModal, showErrorModal, showSuccessModal } from '@/utils/modalService';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showModal } = useModal();
    const { setUser } = useAuthStore();

    const phone = params.phone as string;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleComplete = async () => {
        if (!name.trim()) {
            showErrorModal(showModal, 'Required', 'Please enter your name');
            return;
        }
        if (!password || password.length < 6) {
            showErrorModal(showModal, 'Required', 'Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            showErrorModal(showModal, 'Error', 'Passwords do not match');
            return;
        }
        if (!role) {
            showErrorModal(showModal, 'Required', 'Please select your role');
            return;
        }

        setLoading(true);
        try {
            const result = await completeProfile({
                phone,
                name: name.trim(),
                email: email.trim() || undefined,
                password,
                role,
            });

            if (result.success && result.user) {
                setUser(result.user);

                showSuccessModal(
                    showModal,
                    'Welcome to FixKar!',
                    role === 'mechanic'
                        ? 'Now select the services you specialize in'
                        : 'You can now request services from nearby professionals',
                    () => {
                        if (role === 'mechanic') {
                            router.replace('/(auth)/mechanic-categories');
                        } else {
                            router.replace('/(customer)/home');
                        }
                    }
                );
            } else {
                showErrorModal(showModal, 'Error', result.error || 'Failed to complete profile');
            }
        } catch (error: any) {
            showErrorModal(showModal, 'Error', error.message);
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
                role === roleType && styles.roleCardSelected
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
            <View style={styles.roleContent}>
                <Text style={[
                    styles.roleTitle,
                    role === roleType && styles.roleTitleSelected
                ]}>
                    {title}
                </Text>
                <Text style={styles.roleDescription}>{description}</Text>
            </View>
            <View style={[
                styles.radioOuter,
                role === roleType && styles.radioOuterSelected
            ]}>
                {role === roleType && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>
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
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="person-add" size={36} color={COLORS.white} />
                        </LinearGradient>
                        <Text style={styles.title}>Complete Profile</Text>
                        <Text style={styles.subtitle}>
                            Create your account for {phone}
                        </Text>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={COLORS.textSecondary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address (Optional)</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Create Password *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min 6 characters"
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

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password *</Text>
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

                    {/* Role Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>I am a *</Text>

                        <RoleCard
                            roleType="customer"
                            icon="person"
                            title="Customer"
                            description="I need to hire service professionals"
                        />

                        <RoleCard
                            roleType="mechanic"
                            icon="construct"
                            title="Service Provider"
                            description="I offer professional services"
                        />
                    </View>

                    {role === 'mechanic' && (
                        <View style={styles.noteContainer}>
                            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                            <Text style={styles.noteText}>
                                Next, you'll select your service categories. After KYC verification, you'll start receiving job requests for those services.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            (!name.trim() || !password || !role) && styles.completeButtonDisabled
                        ]}
                        onPress={handleComplete}
                        disabled={loading || !name.trim() || !password || !role}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.completeButtonText}>Create Account</Text>
                                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                            </>
                        )}
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
        marginBottom: 20,
        gap: 10,
    },
    noteText: {
        flex: 1,
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
    completeButton: {
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
    completeButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    completeButtonText: {
        fontSize: SIZES.lg,
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
});
