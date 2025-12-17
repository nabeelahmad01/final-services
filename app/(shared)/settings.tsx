import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/firebase/authService';
import { Card } from '@/components/ui/Card';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { firestore, auth } from '@/services/firebase/config';
import { deleteUser } from 'firebase/auth';
import Constants from 'expo-constants';

import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/stores/themeStore';
import { useModal, showConfirmModal, showSuccessModal, showErrorModal } from '@/utils/modalService';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { mode, setMode } = useThemeStore();
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { showModal } = useModal();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Load notification settings from Firestore
    useEffect(() => {
        const loadSettings = async () => {
            if (!user?.id) return;
            try {
                const collectionName = user.role === 'mechanic' ? 'mechanics' : 'customers';
                const docRef = doc(firestore, collectionName, user.id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPushNotifications(data.pushNotifications ?? true);
                    setEmailNotifications(data.emailNotifications ?? false);
                    setSmsNotifications(data.smsNotifications ?? false);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, [user?.id]);

    // Save notification setting to Firestore
    const saveNotificationSetting = async (key: string, value: boolean) => {
        if (!user?.id) return;
        try {
            const collectionName = user.role === 'mechanic' ? 'mechanics' : 'customers';
            await updateDoc(doc(firestore, collectionName, user.id), {
                [key]: value,
            });
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    const handlePushNotificationChange = (value: boolean) => {
        setPushNotifications(value);
        saveNotificationSetting('pushNotifications', value);
    };

    const handleEmailNotificationChange = (value: boolean) => {
        setEmailNotifications(value);
        saveNotificationSetting('emailNotifications', value);
    };

    const handleSmsNotificationChange = (value: boolean) => {
        setSmsNotifications(value);
        saveNotificationSetting('smsNotifications', value);
    };

    const handleLogout = () => {
        showConfirmModal(
            showModal,
            'Logout',
            'Are you sure you want to logout?',
            async () => {
                await signOut();
                setUser(null);
                router.replace('/(auth)/role-selection');
            },
            undefined,
            'Logout',
            'Cancel'
        );
    };

    const handleDeleteAccount = () => {
        showConfirmModal(
            showModal,
            'Delete Account',
            'Are you sure? This action cannot be undone. All your data including bookings, reviews, and transactions will be permanently deleted.',
            async () => {
                setDeleting(true);
                try {
                    if (!user?.id) throw new Error('User not found');

                    const batch = writeBatch(firestore);
                    const collectionName = user.role === 'mechanic' ? 'mechanics' : 'customers';

                    // Delete user's notifications
                    const notificationsQuery = query(
                        collection(firestore, 'notifications'),
                        where('userId', '==', user.id)
                    );
                    const notificationsSnap = await getDocs(notificationsQuery);
                    notificationsSnap.docs.forEach(doc => batch.delete(doc.ref));

                    // Delete user's proposals (for mechanics)
                    if (user.role === 'mechanic') {
                        const proposalsQuery = query(
                            collection(firestore, 'proposals'),
                            where('mechanicId', '==', user.id)
                        );
                        const proposalsSnap = await getDocs(proposalsQuery);
                        proposalsSnap.docs.forEach(doc => batch.delete(doc.ref));
                    }

                    // Delete user's service requests (for customers)
                    if (user.role === 'customer') {
                        const requestsQuery = query(
                            collection(firestore, 'serviceRequests'),
                            where('customerId', '==', user.id)
                        );
                        const requestsSnap = await getDocs(requestsQuery);
                        requestsSnap.docs.forEach(doc => batch.delete(doc.ref));
                    }

                    // Delete main user document
                    batch.delete(doc(firestore, collectionName, user.id));

                    // Commit batch delete
                    await batch.commit();

                    // Delete Firebase Auth user
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await deleteUser(currentUser);
                    }

                    setUser(null);
                    showSuccessModal(
                        showModal,
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        () => router.replace('/(auth)/role-selection')
                    );
                } catch (error: any) {
                    console.error('Error deleting account:', error);
                    if (error.code === 'auth/requires-recent-login') {
                        showErrorModal(
                            showModal,
                            'Re-authentication Required',
                            'Please log out and log in again before deleting your account.'
                        );
                    } else {
                        showErrorModal(
                            showModal,
                            'Error',
                            error.message || 'Failed to delete account. Please try again.'
                        );
                    }
                } finally {
                    setDeleting(false);
                }
            },
            undefined,
            'Delete',
            'Cancel'
        );
    };

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        showArrow = true,
        rightElement,
        badge,
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        showArrow?: boolean;
        rightElement?: React.ReactNode;
        badge?: string;
    }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.settingText}>
                    <View style={styles.titleRow}>
                        <Text style={styles.settingTitle}>{title}</Text>
                        {badge && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>

            {rightElement || (showArrow && (
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            ))}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(shared)/profile')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Account Settings */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={() => router.push('/(shared)/edit-profile')}
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Verify Email"
                        subtitle={user?.emailVerified ? 'Email verified' : 'Verify your email address'}
                        badge={user?.emailVerified ? '✓' : undefined}
                        onPress={() => router.push('/(shared)/verify-email')}
                    />
                </Card>


                {/* Notification Preferences */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Receive push notifications"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={pushNotifications}
                                onValueChange={handlePushNotificationChange}
                                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                                thumbColor={pushNotifications ? COLORS.primary : COLORS.textSecondary}
                            />
                        }
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Email Notifications"
                        subtitle="Receive email updates"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={emailNotifications}
                                onValueChange={handleEmailNotificationChange}
                                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                                thumbColor={emailNotifications ? COLORS.primary : COLORS.textSecondary}
                            />
                        }
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        title="SMS Notifications"
                        subtitle="Receive SMS alerts"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={smsNotifications}
                                onValueChange={handleSmsNotificationChange}
                                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                                thumbColor={smsNotifications ? COLORS.primary : COLORS.textSecondary}
                            />
                        }
                    />
                </Card>

                {/* Privacy */}
                <Text style={styles.sectionTitle}>Privacy</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="shield-outline"
                        title="Privacy Policy"
                        onPress={() => router.push('/(shared)/privacy-policy')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        onPress={() => router.push('/(shared)/terms-service')}
                    />
                </Card>

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="globe-outline"
                        title={t('settings.language')}
                        subtitle={i18n.language === 'ur' ? 'Urdu' : 'English'}
                        onPress={() => {
                            showConfirmModal(
                                showModal,
                                t('settings.language'),
                                'Select your preferred language',
                                () => i18n.changeLanguage('en'),
                                () => i18n.changeLanguage('ur'),
                                'English',
                                'Urdu'
                            );
                        }}
                    />
                </Card>

                {/* About */}
                <Text style={styles.sectionTitle}>About</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        subtitle={appVersion}
                        showArrow={false}
                    />
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help & Support"
                        onPress={() => router.push('/(shared)/help-support')}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title="About FixKar"
                        onPress={() => router.push('/(shared)/about')}
                    />
                </Card>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <Card style={[styles.card, { borderColor: COLORS.danger + '30' }]}>
                    <TouchableOpacity
                        style={styles.dangerItem}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                        <Text style={[styles.settingTitle, { color: COLORS.danger }]}>
                            Logout
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dangerItem}
                        onPress={handleDeleteAccount}
                        activeOpacity={0.7}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color={COLORS.danger} />
                        ) : (
                            <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                        )}
                        <Text style={[styles.settingTitle, { color: COLORS.danger }]}>
                            {deleting ? 'Deleting...' : 'Delete Account'}
                        </Text>
                    </TouchableOpacity>
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingHorizontal: SIZES.padding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        padding: SIZES.padding,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginTop: 24,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        padding: 0,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingText: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    settingSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    dangerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
});
