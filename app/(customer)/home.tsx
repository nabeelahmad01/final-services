import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useNotifications } from '@/stores/useNotifications';
import { subscribeToActiveBooking, getNearbyMechanics } from '@/services/firebase/firestore';
import { useModal, showInfoModal } from '@/utils/modalService';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceCategory, Mechanic } from '@/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/shared/Avatar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/utils/mapHelpers';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width, height } = Dimensions.get('window');

// Custom User Location Marker
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

// Custom Mechanic Marker
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
    const { t } = useTranslation();
    const COLORS = useThemeColor();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { activeBooking, setActiveBooking } = useBookingStore();
    const { showModal } = useModal();

    // Default location (Islamabad) to show map immediately
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
        latitude: 33.6844,
        longitude: 73.0479,
    });
    const [locationLoaded, setLocationLoaded] = useState(false);
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

        return () => unsubscribe();
    }, [user]);

    const initializeLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                return;
            }

            // Try to get last known position first for immediate feedback
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
                setUserLocation({
                    latitude: lastKnown.coords.latitude,
                    longitude: lastKnown.coords.longitude,
                });
                setLocationLoaded(true);
                // Fetch mechanics for last known location immediately
                fetchNearbyMechanics({
                    latitude: lastKnown.coords.latitude,
                    longitude: lastKnown.coords.longitude,
                });
            }

            // Then get fresh high-accuracy location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(coords);
            setLocationLoaded(true);
            await fetchNearbyMechanics(coords);
        } catch (error) {
            // Silently handle location errors
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

    const handleCategoryPress = (category: ServiceCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            if (userLocation) fetchNearbyMechanics(userLocation);
        } else {
            setSelectedCategory(category);
            if (userLocation) fetchNearbyMechanics(userLocation, category);
        }
    };

    const handleServiceRequest = (category: ServiceCategory) => {
        router.push({
            pathname: '/(customer)/service-request',
            params: { category },
        });
    }

    const getCategoryForMechanic = (mechanic: Mechanic): ServiceCategory | undefined => {
        return mechanic.categories && mechanic.categories.length > 0 ? mechanic.categories[0] : undefined;
    };

    const renderMap = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.mapPlaceholder}>
                    <Ionicons name="map" size={48} color={COLORS.primary} />
                    <Text style={styles.mapPlaceholderText}>Map view available on mobile app</Text>
                </View>
            );
        }

        if (!MapView) {
            return (
                <View style={styles.mapLoadingContainer}>
                    <LoadingSpinner />
                </View>
            );
        }

        return (
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
                showsUserLocation={false} // Hide system blue dot
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
            >
                {Marker && locationLoaded && (
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Full Screen Map */}
            <View style={styles.mapContainer}>
                {renderMap()}
            </View>

            {/* Standard Header (Reverted) */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => router.push('/(shared)/profile')}
                    >
                        <Ionicons name="menu" size={28} color={COLORS.text} />
                        {useNotifications.getState().unreadCount > 0 && (
                            <View style={styles.badge} />
                        )}
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>FixKar</Text>
                        {userLocation && (
                            <View style={styles.locationBadge}>
                                <Ionicons name="location" size={12} color={COLORS.primary} />
                                <Text style={styles.locationText}>Current Location</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Location Refresh Button */}
            <TouchableOpacity
                onPress={initializeLocation}
                style={[styles.refreshButton, { bottom: 220 }]}
            >
                <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Bottom Sheet Container */}
            <View style={styles.bottomSheet}>
                {/* Active Booking Banner (if any) */}
                {activeBooking && (
                    <TouchableOpacity
                        style={styles.activeBookingBanner}
                        onPress={() => router.push('/(customer)/tracking')}
                    >
                        <View style={styles.activeBookingContent}>
                            <View style={styles.pulsatingDot} />
                            <Text style={styles.activeBookingText}>{t('home.mechanicOnWay')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                )}

                {/* Services List */}
                <View style={styles.servicesContainer}>
                    <Text style={styles.servicesTitle}>{t('home.selectService')}</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.servicesScroll}
                    >
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.serviceCard,
                                    selectedCategory === category.id && styles.serviceCardActive
                                ]}
                                onPress={() => handleServiceRequest(category.id as ServiceCategory)}
                            >
                                <View style={[
                                    styles.serviceIconContainer,
                                    { backgroundColor: category.color + '15' }
                                ]}>
                                    <Ionicons
                                        name={category.icon as any}
                                        size={28}
                                        color={category.color}
                                    />
                                </View>
                                <Text style={styles.serviceName} numberOfLines={1}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mapContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    mapPlaceholderText: {
        marginTop: 10,
        color: COLORS.textSecondary,
    },
    mapLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    header: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    locationText: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '600',
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.danger,
    },
    refreshButton: {
        position: 'absolute',
        right: 20,
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 30, // Extra padding for safe area
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 20,
    },
    activeBookingBanner: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activeBookingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pulsatingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.white,
    },
    activeBookingText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: SIZES.sm,
    },
    servicesContainer: {
        marginBottom: 10,
    },
    servicesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 20,
        marginBottom: 12,
    },
    servicesScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    serviceCard: {
        width: 100,
        alignItems: 'center',
        gap: 8,
    },
    serviceCardActive: {
        opacity: 0.7,
    },
    serviceIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceName: {
        fontSize: SIZES.xs,
        fontWeight: '500',
        color: COLORS.text,
        textAlign: 'center',
    },
    // Markers
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
});
