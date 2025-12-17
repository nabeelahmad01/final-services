import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useModal, showSuccessModal, showErrorModal, showInfoModal } from '@/utils/modalService';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase/config';

export default function VerifyEmail() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { showModal } = useModal();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendVerification = async () => {
        if (cooldown > 0) return;

        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            if (!currentUser.email) {
                showErrorModal(showModal, 'Error', 'No email associated with this account. Please update your profile first.');
                return;
            }

            if (currentUser.emailVerified) {
                showInfoModal(showModal, 'Already Verified', 'Your email is already verified!');
                return;
            }

            await sendEmailVerification(currentUser);
            setEmailSent(true);
            setCooldown(60); // 60 second cooldown
            
            showSuccessModal(
                showModal,
                'Email Sent',
                `Verification email sent to ${currentUser.email}. Please check your inbox and spam folder.`
            );
        } catch (error: any) {
            console.error('Error sending verification:', error);
            
            if (error.code === 'auth/too-many-requests') {
                showErrorModal(showModal, 'Error', 'Too many requests. Please try again later.');
            } else {
                showErrorModal(showModal, 'Error', error.message || 'Failed to send verification email');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setChecking(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Reload user to get latest emailVerified status
            await currentUser.reload();

            if (currentUser.emailVerified) {
                // Update Firestore
                const collectionName = user?.role === 'mechanic' ? 'mechanics' : 'customers';
                await updateDoc(doc(firestore, collectionName, user!.id), {
                    emailVerified: true,
                });

                // Update local user state
                setUser({ ...user!, emailVerified: true });

                showSuccessModal(
                    showModal,
                    'Success',
                    'Your email has been verified!',
                    () => router.back()
                );
            } else {
                showInfoModal(
                    showModal,
                    'Not Verified Yet',
                    'Your email is not verified yet. Please check your inbox and click the verification link.'
                );
            }
        } catch (error: any) {
            console.error('Error checking verification:', error);
            showErrorModal(showModal, 'Error', error.message || 'Failed to check verification status');
        } finally {
            setChecking(false);
        }
    };

    const currentUser = auth.currentUser;
    const isVerified = currentUser?.emailVerified || user?.emailVerified;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verify Email</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.iconContainer, isVerified && styles.iconContainerVerified]}>
                    <Ionicons
                        name={isVerified ? 'checkmark-circle' : 'mail'}
                        size={64}
                        color={isVerified ? COLORS.success : COLORS.primary}
                    />
                </View>

                {isVerified ? (
                    <>
                        <Text style={styles.title}>Email Verified!</Text>
                        <Text style={styles.description}>
                            Your email address has been verified successfully.
                        </Text>
                        <View style={styles.emailBox}>
                            <Ionicons name="mail" size={20} color={COLORS.success} />
                            <Text style={styles.emailText}>{currentUser?.email || user?.email}</Text>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.description}>
                            Verify your email address to enhance account security and receive important notifications.
                        </Text>

                        {currentUser?.email ? (
                            <>
                                <View style={styles.emailBox}>
                                    <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                                    <Text style={styles.emailText}>{currentUser.email}</Text>
                                </View>

                                {emailSent && (
                                    <View style={styles.infoBox}>
                                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                                        <Text style={styles.infoText}>
                                            Verification email sent! Check your inbox and click the link to verify.
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.button, (loading || cooldown > 0) && styles.buttonDisabled]}
                                    onPress={handleSendVerification}
                                    disabled={loading || cooldown > 0}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            {cooldown > 0
                                                ? `Resend in ${cooldown}s`
                                                : emailSent
                                                    ? 'Resend Verification'
                                                    : 'Send Verification Email'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {emailSent && (
                                    <TouchableOpacity
                                        style={[styles.secondaryButton, checking && styles.buttonDisabled]}
                                        onPress={handleCheckVerification}
                                        disabled={checking}
                                    >
                                        {checking ? (
                                            <ActivityIndicator color={COLORS.primary} />
                                        ) : (
                                            <Text style={styles.secondaryButtonText}>
                                                I've Verified - Check Status
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.noEmailBox}>
                                <Ionicons name="warning" size={24} color={COLORS.warning} />
                                <Text style={styles.noEmailText}>
                                    No email address found. Please update your profile with an email address first.
                                </Text>
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => router.push('/(shared)/edit-profile')}
                                >
                                    <Text style={styles.buttonText}>Update Profile</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </View>
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
        padding: SIZES.padding,
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    iconContainerVerified: {
        backgroundColor: COLORS.success + '15',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginBottom: 12,
    },
    description: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    emailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        width: '100%',
    },
    emailText: {
        flex: 1,
        fontSize: SIZES.base,
        fontFamily: FONTS.medium,
        color: COLORS.text,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: COLORS.primary + '10',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        width: '100%',
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
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
    secondaryButton: {
        marginTop: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    secondaryButtonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.primary,
    },
    noEmailBox: {
        alignItems: 'center',
        gap: 16,
        backgroundColor: COLORS.warning + '10',
        padding: 20,
        borderRadius: 12,
        width: '100%',
    },
    noEmailText: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 22,
    },
});
