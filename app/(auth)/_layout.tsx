import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="role-selection" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="phone-login" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="password-login" />
            <Stack.Screen name="complete-profile" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="mechanic-categories" />
        </Stack>
    );
}
