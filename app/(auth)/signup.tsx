import { Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { signUp } from '@/services/firebase/authService';
import { COLORS, SIZES } from '@/constants/theme';
import { UserRole } from '@/types';

export default function SignUp() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = (params.role as UserRole) || 'customer';
    const { setUser } = useAuthStore();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !phone || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const user = await signUp({ name, phone, email, password, role });
            setUser(user);

            // Navigate based on role
            if (role === 'mechanic') {
                router.replace('/(auth)/mechanic-categories');
            } else if (role === 'customer') {
                router.replace('/(customer)/home');
            }
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Sign up as a {role === 'customer' ? 'Customer' : 'Mechanic'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={setName}
                            icon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
                        />

                        <Input
                            label="Phone Number"
                            placeholder="+92 3XX XXXXXXX"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            icon={<Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />}
                        />

                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
                        />

                        <Input
                            label="Password"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
                        />

                        <Input
                            label="Confirm Password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
                        />

                        <Button
                            title={role === 'mechanic' ? 'Continue' : 'Sign Up'}
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.signupButton}
                        />

                        <Button
                            title="Back"
                            onPress={() => router.back()}
                            variant="outline"
                        />
                    </View>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SIZES.padding * 1.5,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    form: {
        gap: 16,
    },
    signupButton: {
        marginTop: 8,
    },
});
