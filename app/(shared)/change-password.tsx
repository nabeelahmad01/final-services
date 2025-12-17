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
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showSuccessModal, showErrorModal } from '@/utils/modalService';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/services/firebase/config';

export default function ChangePassword() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showModal } = useModal();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validatePassword = (password: string): boolean => {
        return password.length >= 6;
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword) {
            showErrorModal(showModal, 'Error', 'Please enter your current password');
            return;
        }
        if (!newPassword) {
            showErrorModal(showModal, 'Error', 'Please enter a new password');
            return;
        }
        if (!validatePassword(newPassword)) {
            showErrorModal(showModal, 'Error', 'New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            showErrorModal(showModal, 'Error', 'Passwords do not match');
            return;
        }
        if (currentPassword === newPassword) {
            showErrorModal(showModal, 'Error', 'New password must be different from current password');
            return;
        }

        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error('User not authenticated');
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, newPassword);

            showSuccessModal(
                showModal,
                'Success',
                'Your password has been changed successfully',
                () => router.back()
            );
        } catch (error: any) {
            console.error('Error changing password:', error);
            
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showErrorModal(showModal, 'Error', 'Current password is incorrect');
            } else if (error.code === 'auth/weak-password') {
                showErrorModal(showModal, 'Error', 'Password is too weak. Please use a stronger password.');
            } else if (error.code === 'auth/requires-recent-login') {
                showErrorModal(showModal, 'Error', 'Please log out and log in again before changing your password');
            } else {
                showErrorModal(showModal, 'Error', error.message || 'Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
                    </View>

                    <Text style={styles.description}>
                        Enter your current password and choose a new password for your account.
                    </Text>

                    {/* Current Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter current password"
                                placeholderTextColor={COLORS.textSecondary}
                                secureTextEntry={!showCurrentPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Ionicons
                                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter new password"
                                placeholderTextColor={COLORS.textSecondary}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons
                                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm new password"
                                placeholderTextColor={COLORS.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.requirements}>
                        <Text style={styles.requirementsTitle}>Password must:</Text>
                        <View style={styles.requirementItem}>
                            <Ionicons
                                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={newPassword.length >= 6 ? COLORS.success : COLORS.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                newPassword.length >= 6 && styles.requirementMet
                            ]}>
                                Be at least 6 characters
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons
                                name={newPassword === confirmPassword && newPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={newPassword === confirmPassword && newPassword.length > 0 ? COLORS.success : COLORS.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                newPassword === confirmPassword && newPassword.length > 0 && styles.requirementMet
                            ]}>
                                Match confirmation password
                            </Text>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>Change Password</Text>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: SIZES.padding,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
    },
    description: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
    },
    requirements: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    requirementText: {
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
    },
    requirementMet: {
        color: COLORS.success,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
    },
});
