import { Stack } from 'expo-router';

export default function SharedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="chat" />
            <Stack.Screen name="call" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
