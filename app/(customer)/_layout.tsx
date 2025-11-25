import { Stack } from 'expo-router';

export default function CustomerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="home" />
            <Stack.Screen name="service-request" />
            <Stack.Screen name="proposals" />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="history" />
        </Stack>
    );
}
