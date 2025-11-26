import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/firebase/authService';
import { COLORS, SIZES, FONTS } from '@/constants/theme';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    logout();
                    router.replace('/(auth)/role-selection');
                },
            },
        ]);
    };

    if (!user) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <Avatar name={user.name} uri={user.profilePic} size={100} />
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(shared)/edit-profile' as any)}
                    >
                        <Card style={styles.menuItemCard}>
                            <Ionicons name="person-outline" size={24} color={COLORS.text} />
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(shared)/settings' as any)}
                    >
                        <Card style={styles.menuItemCard}>
                            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                            <Text style={styles.menuText}>Settings</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(shared)/help-support')}
                    >
                        <Card style={styles.menuItemCard}>
                            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
                            <Text style={styles.menuText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/(shared)/about')}
                    >
                        <Card style={styles.menuItemCard}>
                            <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
                            <Text style={styles.menuText}>About F ixKar</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </Card>
                    </TouchableOpacity>
                </View>

                <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="danger"
                    icon={<Ionicons name="log-out-outline" size={20} color={COLORS.white} />}
                />
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
        padding: SIZES.padding,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
        marginTop: 16,
    },
    userPhone: {
        fontSize: SIZES.base,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
    },
    roleText: {
        color: COLORS.white,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        fontSize: SIZES.sm,
    },
    section: {
        marginBottom: 24,
    },
    menuItem: {
        marginBottom: 12,
    },
    menuItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    menuText: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
        fontWeight: '500',
        fontFamily: FONTS.medium,
    },
});
