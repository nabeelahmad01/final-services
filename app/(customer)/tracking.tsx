import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { subscribeToLocation } from '@/services/firebase/realtimeDb';
import { getMechanic, updateBooking } from '@/services/firebase/firestore';
import { getDirections, decodePolyline } from '@/services/location/locationService';
import { createOrGetChat } from '@/services/firebase/firestore';
import { COLORS, SIZES } from '@/constants/theme';
import { Mechanic } from '@/types';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { activeBooking } = useBookingStore();
    const mapRef = useRef<MapView>(null);

    const [mechanic, setMechanic] = useState<Mechanic | null>(null);
    const [mechanicLocation, setMechanicLocation] = useState<any>(null);
    const [route, setRoute] = useState<any[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    useEffect(() => {
        if (!activeBooking) return;

        // Fetch mechanic details
        getMechanic(activeBooking.mechanicId).then(setMechanic);

        // Subscribe to mechanic location
        const unsubscribe = subscribeToLocation(activeBooking.mechanicId, (location) => {
            if (location) {
                setMechanicLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                });

                // Get route
                if (activeBooking.customerLocation) {
                    getDirections(
                        { latitude: location.latitude, longitude: location.longitude },
                        activeBooking.customerLocation
                    ).then(result => {
                        setDistance(result.distance);
                        setDuration(result.duration);
                        setRoute(decodePolyline(result.polyline));

                        // Fit map to route
                        if (mapRef.current) {
                            mapRef.current.fitToCoordinates([
                                { latitude: location.latitude, longitude: location.longitude },
                                activeBooking.customerLocation,
                            ], {
                                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                                animated: true,
                            });
                        }
                    }).catch(err => console.error('Route error:', err));
                }
            }
        });

        return () => unsubscribe();
    }, [activeBooking]);

    const handleCall = () => {
        if (mechanic) {
            router.push({
                pathname: '/(shared)/call',
                params: {
                    userId: mechanic.id,
                    userName: mechanic.name,
                    callType: 'voice'
                },
            });
        }
    };

    const handleChat = async () => {
        if (!user || !mechanic) return;

        const chatId = await createOrGetChat(user.id, mechanic.id);
        router.push({
            pathname: '/(shared)/chat',
            params: { chatId },
        });
    };

    const handleCancelRide = () => {
        Alert.alert(
            'Cancel Service',
            'Are you sure you want to cancel this service?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        if (activeBooking) {
                            await updateBooking(activeBooking.id, { status: 'cancelled' });
                            router.replace('/(customer)/home');
                        }
                    },
                },
            ]
        );
    };

    if (!activeBooking || !mechanic) return null;

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: activeBooking.customerLocation.latitude,
                    longitude: activeBooking.customerLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* Customer Location */}
                <Marker
                    coordinate={activeBooking.customerLocation}
                    title="You"
                    pinColor={COLORS.primary}
                />

                {/* Mechanic Location */}
                {mechanicLocation && (
                    <Marker
                        coordinate={mechanicLocation}
                        title={mechanic.name}
                    >
                        <View style={styles.mechanicMarker}>
                            <Ionicons name="construct" size={24} color={COLORS.white} />
                        </View>
                    </Marker>
                )}

                {/* Route */}
                {route.length > 0 && (
                    <Polyline
                        coordinates={route}
                        strokeColor={COLORS.primary}
                        strokeWidth={4}
                    />
                )}
            </MapView>

            {/* Top Info Card */}
            <View style={styles.topCard}>
                <View style={styles.etaContainer}>
                    <Ionicons name="car-outline" size={20} color={COLORS.text} />
                    <Text style={styles.etaText}>
                        Driver is arriving in
                    </Text>
                </View>
                <Text style={styles.etaTime}>~{Math.round(duration)} min</Text>
                <Text style={styles.vehicleInfo}>
                    {mechanic.vehicleInfo?.color} {mechanic.vehicleInfo?.type}
                </Text>
            </View>

            {/* Bottom Sheet */}
            <View style={styles.bottomSheet}>
                <View style={styles.handle} />

                {/* Mechanic Info */}
                <View style={styles.mechanicInfo}>
                    <View style={styles.mechanicHeader}>
                        <Avatar name={mechanic.name} uri={mechanic.profilePic} size={56} />
                        <View style={styles.mechanicDetails}>
                            <View style={styles.mechanicNameRow}>
                                <Text style={styles.mechanicName}>{mechanic.name}</Text>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={16} color={COLORS.warning} />
                                    <Text style={styles.ratingText}>{mechanic.rating.toFixed(1)}</Text>
                                </View>
                            </View>
                            <Text style={styles.mechanicPhone}>{mechanic.phone}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleChat}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary }]}>
                                <Ionicons name="chatbubble" size={24} color={COLORS.white} />
                            </View>
                            <Text style={styles.actionLabel}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleCall}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.success }]}>
                                <Ionicons name="call" size={24} color={COLORS.white} />
                            </View>
                            <Text style={styles.actionLabel}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.danger }]}>
                                <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
                            </View>
                            <Text style={styles.actionLabel}>Safety</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Trip Info */}
                <View style={styles.tripInfo}>
                    <View style={styles.tripInfoRow}>
                        <Ionicons name="location" size={20} color={COLORS.success} />
                        <Text style={styles.tripInfoLabel}>Pickup</Text>
                    </View>
                    <Text style={styles.tripInfoValue} numberOfLines={1}>
                        {activeBooking.customerLocation.address}
                    </Text>
                </View>

                <View style={styles.divider} />

                {/* Payment */}
                <View style={styles.paymentInfo}>
                    <Ionicons name="cash-outline" size={20} color={COLORS.text} />
                    <Text style={styles.paymentText}>PKR {activeBooking.price} Cash</Text>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelRide}
                >
                    <Text style={styles.cancelButtonText}>Cancel the service</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mechanicMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    topCard: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: COLORS.white,
        ...SIZES,
        borderRadius: 12,
        padding: 16,
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    etaText: {
        fontSize: SIZES.sm,
        color: COLORS.text,
    },
    etaTime: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    vehicleInfo: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    mechanicInfo: {
        marginBottom: 20,
    },
    mechanicHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    mechanicDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    mechanicNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    mechanicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.warning + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.text,
    },
    mechanicPhone: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: SIZES.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    tripInfo: {
        marginBottom: 16,
    },
    tripInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    tripInfoLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    tripInfoValue: {
        fontSize: SIZES.base,
        color: COLORS.text,
        marginLeft: 28,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    paymentText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: SIZES.base,
        color: COLORS.danger,
        fontWeight: '600',
    },
});
