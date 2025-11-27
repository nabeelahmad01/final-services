import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Admin password - In production, this should be from environment variables
const ADMIN_PASSWORD = 'FixKar2024Admin';

export default function AdminLogin() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter password');
            return;
        }

        setLoading(true);

        // Simple password check
        if (password === ADMIN_PASSWORD) {
            Alert.alert('Success', 'Welcome Admin!', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/(admin)/kyc-verification'),
                },
            ]);
        } else {
            Alert.alert('Error', 'Incorrect password');
        }

        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Admin Panel</Text>
                    <Text style={styles.subtitle}>FixKar Administration</Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.label}>Admin Password</Text>
                    <Input
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter admin password"
                        secureTextEntry
                    />

                    <Button
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        style={{ marginTop: 16 }}
                    />

                    <TouchableOpacity
                        onPress={() => router.push('/(admin)/index')}
                        style={styles.backButton}
                    >
                        <Text style={styles.backText}>Back to App</Text>
                    </TouchableOpacity>
                </Card>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                        Default password: <Text style={styles.password}>FixKar2024Admin</Text>
                    </Text>
                </View>
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
        justifyContent: 'center',
        paddingHorizontal: SIZES.padding * 2,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    card: {
        padding: 24,
    },
    label: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    backButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    backText: {
        fontSize: SIZES.base,
        color: COLORS.primary,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.primary + '10',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
    },
    password: {
        fontWeight: 'bold',
        color: COLORS.primary,
        fontFamily: 'monospace',
    },
});
