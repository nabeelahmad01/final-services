import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/shared/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/firebase/authService';
import { useModal, showConfirmModal } from '@/utils/modalService';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { showModal } = useModal();
    const { t, i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const handleLogout = () => {
        showConfirmModal(
            showModal,
            isUrdu ? 'لاگ آؤٹ' : 'Logout',
            isUrdu ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to logout?',
            async () => {
                await signOut();
                logout();
                router.replace('/(auth)/role-selection');
            }
        );
    };

    if (!user) return null;

    const getHomeRoute = () => {
        switch (user.role) {
            case 'customer': return '/(customer)/home';
            case 'mechanic': return '/(mechanic)/dashboard';
            case 'admin': return '/(admin)/index';
            default: return '/(customer)/home';
        }
    };

    const getRoleName = () => {
        if (isUrdu) {
            return user.role === 'customer' ? 'کسٹمر' : user.role === 'mechanic' ? 'مستری' : 'ایڈمن';
        }
        return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    };

    const menuItems = [
        {
            icon: 'person-outline',
            title: isUrdu ? 'پروفائل ترمیم کریں' : 'Edit Profile',
            subtitle: isUrdu ? 'نام، تصویر تبدیل کریں' : 'Change name, photo',
            route: '/(shared)/edit-profile',
            color: COLORS.primary,
        },
        {
            icon: 'calendar-outline',
            title: isUrdu ? 'میری بکنگز' : 'My Bookings',
            subtitle: isUrdu ? 'سروس ہسٹری دیکھیں' : 'View service history',
            route: '/(customer)/bookings',
            color: '#5E35B1',
        },
        {
            icon: 'heart-outline',
            title: isUrdu ? 'پسندیدہ مستری' : 'Favorite Mechanics',
            subtitle: isUrdu ? 'محفوظ شدہ مستری' : 'Saved mechanics',
            route: '/(customer)/favorites',
            color: COLORS.danger,
        },
        {
            icon: 'notifications-outline',
            title: isUrdu ? 'اطلاعات' : 'Notifications',
            subtitle: isUrdu ? 'اپ ڈیٹس اور الرٹس' : 'Updates and alerts',
            route: '/(shared)/notifications',
            color: '#FF6F00',
        },
        {
            icon: 'settings-outline',
            title: isUrdu ? 'سیٹنگز' : 'Settings',
            subtitle: isUrdu ? 'زبان، تھیم، پرائیویسی' : 'Language, theme, privacy',
            route: '/(shared)/settings',
            color: '#0097A7',
        },
        {
            icon: 'help-circle-outline',
            title: isUrdu ? 'مدد اور سپورٹ' : 'Help & Support',
            subtitle: isUrdu ? 'سوالات اور رابطہ' : 'FAQs and contact',
            route: '/(shared)/help-support',
            color: '#43A047',
        },
        {
            icon: 'information-circle-outline',
            title: isUrdu ? 'فکس کار کے بارے میں' : 'About FixKar',
            subtitle: isUrdu ? 'ورژن اور معلومات' : 'Version and info',
            route: '/(shared)/about',
            color: '#1976D2',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isUrdu ? 'پروفائل' : 'Profile'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark || '#1a6b5c']}
                        style={styles.profileGradient}
                    >
                        <View style={styles.avatarContainer}>
                            <Avatar name={user.name} uri={user.profilePic} size={90} />
                            <TouchableOpacity 
                                style={styles.editAvatarButton}
                                onPress={() => router.push('/(shared)/edit-profile' as any)}
                            >
                                <Ionicons name="camera" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userPhone}>{user.phone}</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons 
                                name={user.role === 'customer' ? 'person' : 'construct'} 
                                size={14} 
                                color={COLORS.primary} 
                            />
                            <Text style={styles.roleText}>{getRoleName()}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Stats for Customers */}
                {user.role === 'customer' && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>
                                {isUrdu ? 'مکمل سروسز' : 'Services'}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>
                                {isUrdu ? 'پسندیدہ' : 'Favorites'}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>
                                {isUrdu ? 'ریویوز' : 'Reviews'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon as any} size={22} color={item.color} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons 
                                name={isUrdu ? "chevron-back" : "chevron-forward"} 
                                size={20} 
                                color={COLORS.textSecondary} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                    <Text style={styles.logoutText}>
                        {isUrdu ? 'لاگ آؤٹ' : 'Logout'}
                    </Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>FixKar v1.0.0</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    profileCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    profileGradient: {
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.white,
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 15,
        fontFamily: FONTS.regular,
        color: COLORS.white,
        opacity: 0.9,
        marginBottom: 12,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    roleText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        fontSize: 13,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '70%',
        backgroundColor: COLORS.border,
        alignSelf: 'center',
    },
    menuSection: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 14,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.text,
    },
    menuSubtitle: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.danger + '10',
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: FONTS.semiBold,
        color: COLORS.danger,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 20,
    },
});
