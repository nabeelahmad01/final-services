import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/theme';

export default function CustomerLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: FONTS.medium,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile-tab"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

            {/* Hidden screens (not in tab bar) */}
            <Tabs.Screen
                name="service-request"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="proposals"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="tracking"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="booking-details"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="payment"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="leave-review"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
