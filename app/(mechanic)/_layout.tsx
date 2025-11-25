import { Stack } from 'expo-router';

export default function MechanicLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="active-job" />
            <Stack.Screen name="history" />
        </Stack>
    );
}
