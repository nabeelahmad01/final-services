import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useNotifications } from '@/stores/useNotifications';
import { subscribeToActiveBooking, getNearbyMechanics } from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { CUSTOM_MAP_STYLE_LIGHT } from '@/constants/mapStyles';
import { ServiceCategory, Mechanic } from '@/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/shared/Avatar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/utils/mapHelpers';

const { width } = Dimensions.get('window');

// Custom User Location Marker - LARGE & VISIBLE
const CustomUserMarker = () => (
    <View style={styles.userMarkerContainer}>
        <View style={styles.userMarkerPulse} />
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.userMarker}
        >
            <Ionicons name="person" size={26} color={COLORS.white} />
        </LinearGradient>
    </View>
);

// Custom Mechanic Marker - LARGE & COLOR-CODED
const CustomMechanicMarker = ({ category }: { category?: ServiceCategory }) => {
    const categoryData = CATEGORIES.find(cat => cat.id === category) || CATEGORIES[0];

    return (
        <View style={styles.mechanicMarkerContainer}>
            <View style={[styles.mechanicMarkerShadow, { shadowColor: categoryData.color }]} />
            <View style={[styles.mechanicMarker, { backgroundColor: categoryData.color }]}>
                <Ionicons name={categoryData.icon as any} size={22} color={COLORS.white} />
            </View>
            <View style={[styles.mechanicMarkerPin, { borderTopColor: categoryData.color }]} />
        </View>
    );
};

export default function CustomerHome() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { activeBooking, setActiveBooking } = useBookingStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [nearbyMechanics, setNearbyMechanics] = useState<Mechanic[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [loadingMechanics, setLoadingMechanics] = useState(false);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToActiveBooking(user.id, 'customer', (booking) => {
            setActiveBooking(booking);
            if (booking) {
                router.push('/(customer)/tracking');
            }
        });

        initializeLocation();
        setLoading(false);

        return () => unsubscribe();
    }, [user]);

    const initializeLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission',
                    'Please enable location permissions to see nearby mechanics',
                    [{ text: 'OK' }]
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(coords);
            await fetchNearbyMechanics(coords);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const fetchNearbyMechanics = async (location: { latitude: number; longitude: number }, category?: ServiceCategory) => {
        setLoadingMechanics(true);
        try {
            const mechanics = await getNearbyMechanics(location, category, 10);
            setNearbyMechanics(mechanics);
        } catch (error) {
            console.error('Error fetching nearby mechanics:', error);
        } finally {
            setLoadingMechanics(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (userLocation) {
            await fetchNearbyMechanics(userLocation, selectedCategory || undefined);
        }
        setRefreshing(false);
    };

    const handleCategoryPress = (category: ServiceCategory) => {
        router.push({
            pathname: '/(customer)/service-request',
            params: { category },
        });
    };

    const handleCategoryFilter = async (category: ServiceCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            if (userLocation) {
                await fetchNearbyMechanics(userLocation);
            }
        } else {
            setSelectedCategory(category);
            if (userLocation) {
                await fetchNearbyMechanics(userLocation, category);
            }
        }
    };

    const getCategoryForMechanic = (mechanic: Mechanic): ServiceCategory | undefined => {
        return mechanic.categories && mechanic.categories.length > 0 ? mechanic.categories[0] : undefined;
    };

    const renderMap = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.mapPlaceholder}>
                    <Ionicons name="map" size={48} color={COLORS.primary} />
                    <Text style={styles.mapPlaceholderText}>Map view available on mobile app</Text>
                    <Text style={styles.mapPlaceholderSubtext}>
                        {nearbyMechanics.length} mechanics nearby
                    </Text>
                </View>
            );
        }

        if (!userLocation || !MapView) {
            return (
                <View style={styles.mapPlaceholder}>
                    <LoadingSpinner />
                    <Text style={styles.mapPlaceholderText}>Loading map...</Text>
                </View>
            );
        }

        return (
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={CUSTOM_MAP_STYLE_LIGHT}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                toolbarEnabled={false}
            >
                {Marker && (
                    <Marker
                        coordinate={userLocation}
                        title="Your Location"
                        anchor={{ x: 0.5, y: 0.5 }}
                        zIndex={1000}
                    >
                        <CustomUserMarker />
                    </Marker>
                )}

                {Marker && nearbyMechanics.map((mechanic) => (
                    <Marker
                        key={mechanic.id}
                        coordinate={{
                            latitude: mechanic.location!.latitude,
                            longitude: mechanic.location!.longitude,
                        }}
                        title={mechanic.name}
                        description={`⭐ ${mechanic.rating.toFixed(1)} • ${(mechanic as any).distance?.toFixed(1)}km away`}
                        anchor={{ x: 0.5, y: 1 }}
                        zIndex={100}
                    >
                        <CustomMechanicMarker category={getCategoryForMechanic(mechanic)} />
                    </Marker>
                ))}
            </MapView>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LoadingSpinner fullScreen />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user?.name}</Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity
                            onPress={() => router.push('/(shared)/notifications')}
                            style={styles.iconButton}
                        >
                            {useNotifications.getState().unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {useNotifications.getState().unreadCount}
                                    </Text>
                                </View>
                            )}
                            <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(shared)/profile')}>
                            <Avatar name={user?.name || ''} uri={user?.profilePic} size={48} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Active Booking Banner */}
                {activeBooking && (
                    <Card style={styles.activeBookingCard}>
                        <View style={styles.activeBookingContent}>
                            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                            <View style={styles.activeBookingText}>
                                <Text style={styles.activeBookingTitle}>Active Service</Text>
                                <Text style={styles.activeBookingSubtitle}>
                                    Your mechanic is on the way
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.trackButton}
                                onPress={() => router.push('/(customer)/tracking')}
                            >
                                <Text style={styles.trackButtonText}>Track</Text>
                                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

                {/* Map Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Nearby Mechanics</Text>
                            <Text style={styles.sectionSubtitle}>
                                {nearbyMechanics.length} verified mechanics nearby
                            </Text>
                        </View>
                        {userLocation && (
                            <TouchableOpacity onPress={initializeLocation} style={styles.refreshButton}>
                                <Ionicons name="refresh-outline" size={22} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Card style={styles.mapCard}>
                        {renderMap()}
                    </Card>

                    {/* Category Filter */}
                    {nearbyMechanics.length > 0 && (
                        <View style={styles.categoryFilter}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {CATEGORIES.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.filterChip,
                                            selectedCategory === category.id && styles.filterChipActive,
                                        ]}
                                        onPress={() => handleCategoryFilter(category.id as ServiceCategory)}
                                    >
                                        <Ionicons
                                            name={category.icon as any}
                                            size={16}
                                            color={selectedCategory === category.id ? COLORS.white : category.color}
                                        />
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                selectedCategory === category.id && styles.filterChipTextActive,
                                            ]}
                                        >
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Mechanics List */}
                    {loadingMechanics ? (
                        <LoadingSpinner />
                    ) : nearbyMechanics.length > 0 ? (
                        <View style={styles.mechanicsList}>
                            {nearbyMechanics.slice(0, 3).map((mechanic) => (
                                <Card key={mechanic.id} style={styles.mechanicCard}>
                                    <Avatar name={mechanic.name} uri={mechanic.profilePic} size={48} />
                                    <View style={styles.mechanicInfo}>
                                        <Text style={styles.mechanicName}>{mechanic.name}</Text>
                                        <View style={styles.mechanicDetails}>
                                            <View style={styles.ratingContainer}>
                                                <Ionicons name="star" size={14} color={COLORS.warning} />
                                                <Text style={styles.mechanicRating}>
                                                    {mechanic.rating.toFixed(1)}
                                                </Text>
                                            </View>
                                            <Text style={styles.mechanicDistance}>
                                                • {(mechanic as any).distance?.toFixed(1)}km
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.callButton}>
                                        <Ionicons name="call" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </Card>
                            ))}
                        </View>
                    ) : userLocation ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={styles.emptyStateText}>No mechanics found nearby</Text>
                            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
                        </View>
                    ) : null}
                </View>

                {/* Services Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What do you need?</Text>
                    <Text style={styles.sectionSubtitle}>
                        Select a service category to get started
                    </Text>

                    <View style={styles.categoriesGrid}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryCard}
                                onPress={() => handleCategoryPress(category.id as ServiceCategory)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.categoryIcon,
                                        { backgroundColor: category.color + '20' },
                                    ]}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={32}
                                        color={category.color}
                                    />
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(customer)/history')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Service History</Text>
                            <Text style={styles.actionSubtitle}>View past services</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: SIZES.base,
        color: COLORS.textSecond,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeBookingCard: {
        backgroundColor: COLORS.primary + '10',
        marginBottom: 24,
    },
    activeBookingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activeBookingText: {
        flex: 1,
    },
    activeBookingTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    activeBookingSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    trackButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: SIZES.sm,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    refreshButton: {
        padding: 8,
        backgroundColor: COLORS.primary + '15',
        borderRadius: 20,
    },
    mapCard: {
        overflow: 'hidden',
        padding: 0,
        height: 300,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        gap: 8,
    },
    mapPlaceholderText: {
        fontSize: SIZES.base,
        color: COLORS.text,
        fontWeight: '500',
        marginTop: 12,
    },
    mapPlaceholderSubtext: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    // LARGE User Marker Styles
    userMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
    },
    userMarkerPulse: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        opacity: 0.3,
    },
    userMarker: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 12,
    },
    // LARGE Mechanic Marker Styles
    mechanicMarkerContainer: {
        alignItems: 'center',
        height: 65,
    },
    mechanicMarkerShadow: {
        position: 'absolute',
        top: 0,
        width: 50,
        height: 50,
        borderRadius: 25,
        opacity: 0.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 15,
    },
    mechanicMarker: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 10,
    },
    mechanicMarkerPin: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    categoryFilter: {
        marginBottom: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: COLORS.white,
    },
    mechanicsList: {
        gap: 12,
    },
    mechanicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mechanicInfo: {
        flex: 1,
    },
    mechanicName: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    mechanicDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mechanicRating: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    mechanicDistance: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyStateText: {
        fontSize: SIZES.base,
        fontWeight: '500',
        color: COLORS.text,
    },
    emptyStateSubtext: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    categoryCard: {
        width: '31%',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    actionSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
});
