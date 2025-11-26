import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SIZES } from '@/constants/theme';

export default function RoleSelection() {
    const router = useRouter();

    const handleRoleSelect = (role: 'customer' | 'mechanic') => {
        router.push({
            pathname: '/(auth)/signup',
            params: { role },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.header}
                >
                    <Text style={styles.title}>Welcome to</Text>
                    <Text style={styles.brandName}>Service Marketplace</Text>
                    <Text style={styles.subtitle}>
                        Your trusted platform for connecting with skilled mechanics
                    </Text>
                </Animated.View>

                <View style={styles.rolesContainer}>
                    <Animated.View
                        entering={FadeInDown.delay(400)}
                        style={styles.roleCardWrapper}
                    >
                        <TouchableOpacity
                            style={[styles.roleCard, styles.customerCard]}
                            onPress={() => handleRoleSelect('customer')}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.iconContainer, styles.customerIconBg]}>
                                <Ionicons name="person" size={48} color={COLORS.white} />
                            </View>
                            <Text style={styles.roleTitle}>I Need a Service</Text>
                            <Text style={styles.roleDescription}>
                                Find and hire skilled mechanics for your needs
                            </Text>
                            <View style={styles.arrow}>
                                <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(600)}
                        style={styles.roleCardWrapper}
                    >
                        <TouchableOpacity
                            style={[styles.roleCard, styles.mechanicCard]}
                            onPress={() => handleRoleSelect('mechanic')}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.iconContainer, styles.mechanicIconBg]}>
                                <Ionicons name="construct" size={48} color={COLORS.white} />
                            </View>
                            <Text style={styles.roleTitle}>I Provide Services</Text>
                            <Text style={styles.roleDescription}>
                                Start earning by offering your skills to customers
                            </Text>
                            <View style={styles.arrow}>
                                <Ionicons name="arrow-forward" size={24} color={COLORS.secondary} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(800)}>
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        style={styles.loginLink}
                    >
                        <Text style={styles.loginText}>
                            Already have an account? <Text style={styles.loginTextBold}>Login</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Admin Access Button */}
                    <TouchableOpacity
                        onPress={() => router.push('/(admin)')}
                        style={styles.adminLink}
                    >
                        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.adminText}>Admin Access</Text>
                    </TouchableOpacity>
                </Animated.View>
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
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    brandName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginVertical: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    rolesContainer: {
        gap: 20,
    },
    roleCardWrapper: {
        width: '100%',
    },
    roleCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    customerCard: {
        borderColor: COLORS.primary + '30',
    },
    mechanicCard: {
        borderColor: COLORS.secondary + '30',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    customerIconBg: {
        backgroundColor: COLORS.primary,
    },
    mechanicIconBg: {
        backgroundColor: COLORS.secondary,
    },
    roleTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    roleDescription: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    arrow: {
        position: 'absolute',
        right: 24,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    loginLink: {
        alignItems: 'center',
        padding: 16,
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
        gap: 6,
        padding: 12,
        marginTop: 8,
    },
    adminText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
});
