import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/firebase/authService';
import { Card } from '@/components/ui/Card';

export default function Settings() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        setUser(null);
                        router.replace('/(auth)/role-selection');
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement account deletion
                        Alert.alert('Coming Soon', 'Account deletion feature will be available soon');
                    },
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        showArrow = true,
        rightElement,
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        showArrow?: boolean;
        rightElement?: React.ReactNode;
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
                    <Text style={styles.settingTitle}>{title}</Text>
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                        icon="lock-closed-outline"
                        title="Change Password"
                        subtitle="Update your password"
                        onPress={() => Alert.alert('Coming Soon', 'Password change feature will be available soon')}
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
                                onValueChange={setPushNotifications}
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
                                onValueChange={setEmailNotifications}
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
                                onValueChange={setSmsNotifications}
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
                        onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        onPress={() => Alert.alert('Terms of Service', 'Terms of service content will be displayed here')}
                    />
                </Card>

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="globe-outline"
                        title="Language"
                        subtitle="English"
                        onPress={() => Alert.alert('Language', 'Language selection will be available soon')}
                    />
                </Card>

                {/* About */}
                <Text style={styles.sectionTitle}>About</Text>
                <Card style={styles.card}>
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        subtitle="1.0.0"
                        showArrow={false}
                    />
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help & Support"
                        onPress={() => Alert.alert('Help & Support', 'Support information will be available soon')}
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
                    >
                        <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                        <Text style={[styles.settingTitle, { color: COLORS.danger }]}>
                            Delete Account
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
    settingTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
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
