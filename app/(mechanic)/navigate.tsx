import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/constants/theme';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '@/utils/mapHelpers';
import { useBookingStore } from '@/stores/bookingStore';
import { getCurrentLocation, calculateDistance, calculateETA } from '@/services/location/locationTrackingService';
import { getDirections, decodePolyline } from '@/services/location/locationService';

const { width, height } = Dimensions.get('window');

export default function NavigateScreen() {
    const router = useRouter();
    const { activeBooking } = useBookingStore();
    const mapRef = useRef<any>(null);

    const [mechanicLocation, setMechanicLocation] = useState<any>(null);
    const [route, setRoute] = useState<any[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [eta, setEta] = useState<number>(0);

    useEffect(() => {
        if (!activeBooking || !activeBooking.customerLocation) {
            router.back();
            return;
        }

        // Get initial location
        updateLocation();

        // Update location every 5 seconds
        const interval = setInterval(updateLocation, 5000);

        return () => clearInterval(interval);
    }, [activeBooking]);

    const updateLocation = async () => {
        if (!activeBooking?.customerLocation) return;

        try {
            const location = await getCurrentLocation();
            if (!location) return;

            setMechanicLocation({
                latitude: location.latitude,
                longitude: location.longitude,
            });

            // Calculate distance and ETA
            const dist = calculateDistance(
                location.latitude,
                location.longitude,
                activeBooking.customerLocation.latitude,
                activeBooking.customerLocation.longitude
            );
            setDistance(dist);
            setEta(calculateETA(dist));

            // Get route
            const routeData = await getDirections(
                { latitude: location.latitude, longitude: location.longitude },
                activeBooking.customerLocation
            );

            if (routeData) {
                setRoute(decodePolyline(routeData.polyline));

                // Fit map to show both markers
                if (mapRef.current && mechanicLocation) {
                    mapRef.current.fitToCoordinates([
                        mechanicLocation,
                        activeBooking.customerLocation,
                    ], {
                        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                        animated: true,
                    });
                }
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    const handleArrived = () => {
        router.replace('/(mechanic)/active-job');
    };

    if (!activeBooking) return null;

    return (
        <View style={styles.container}>
            {/* Map */}
            {MapView && mechanicLocation ? (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                        latitude: mechanicLocation.latitude,
                        longitude: mechanicLocation.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    {/* Mechanic Marker (You) */}
                    {Marker && (
                        <Marker
                            coordinate={mechanicLocation}
                            title="You"
                        >
                            <View style={styles.mechanicMarker}>
                                <Ionicons name="car" size={24} color={COLORS.white} />
                            </View>
                        </Marker>
                    )}

                    {/* Customer Marker */}
                    {Marker && (
                        <Marker
                            coordinate={activeBooking.customerLocation}
                            title="Customer"
                            pinColor={COLORS.danger}
                        />
                    )}

                    {/* Route */}
                    {route.length > 0 && Polyline && (
                        <Polyline
                            coordinates={route}
                            strokeColor={COLORS.primary}
                            strokeWidth={5}
                        />
                    )}
                </MapView>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading map...</Text>
                </View>
            )}

            {/* Top Card - Distance & ETA */}
            <SafeAreaView style={styles.topContainer} edges={['top']}>
                <View style={styles.topCard}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <Text style={styles.distanceText}>
                                {distance.toFixed(1)} km away
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="time" size={20} color={COLORS.primary} />
                            <Text style={styles.etaText}>
                                {eta} min
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* Bottom Card - Customer Info */}
            <View style={styles.bottomCard}>
                <View style={styles.customerInfo}>
                    <Ionicons name="person-circle" size={48} color={COLORS.primary} />
                    <View style={styles.customerDetails}>
                        <Text style={styles.customerName}>
                            {activeBooking.customerName || 'Customer'}
                        </Text>
                        <Text style={styles.customerAddress} numberOfLines={2}>
                            {activeBooking.customerLocation.address}
                        </Text>
                    </View>
                </View>

                {distance < 0.1 && (
                    <TouchableOpacity
                        style={styles.arrivedButton}
                        onPress={handleArrived}
                    >
                        <Text style={styles.arrivedButtonText}>I've Arrived</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    mechanicMarker: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    topContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    topCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    backButton: {
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    distanceText: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.text,
    },
    etaText: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.primary,
    },
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    customerAddress: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    arrivedButton: {
        backgroundColor: COLORS.success,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    arrivedButtonText: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.white,
    },
});
