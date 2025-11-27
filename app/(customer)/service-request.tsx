import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { createServiceRequest } from '@/services/firebase/firestore';
import { COLORS, SIZES, CATEGORIES } from '@/constants/theme';
import { ServiceCategory } from '@/types';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/utils/mapHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServiceRequest() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const category = (params.category as ServiceCategory) || 'car_mechanic';
    const { user } = useAuthStore();

    const [description, setDescription] = useState('');
    const [location, setLocation] = useState({
        latitude: 33.6844, // Islamabad default
        longitude: 73.0479,
    });
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);

    const categoryInfo = CATEGORIES.find(c => c.id === category);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required');
                setLoadingLocation(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            const newLocation = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setLocation(newLocation);

            // Get address from coordinates
            const addressData = await Location.reverseGeocodeAsync(newLocation);
            if (addressData[0]) {
                const addr = addressData[0];
                const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}, Pakistan`.trim();
                setAddress(formattedAddress);
            }
        } catch (error) {
            console.error('Location error:', error);
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setLocation({ latitude, longitude });

        try {
            const addressData = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (addressData[0]) {
                const addr = addressData[0];
                const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}, Pakistan`.trim();
                setAddress(formattedAddress);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    };

    const handleSubmit = async () => {
        if (!description || !address) {
            Alert.alert('Error', 'Please fill all fields and select location on map');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in');
            return;
        }

        setLoading(true);
        try {
            const requestId = await createServiceRequest({
                customerId: user.id,
                customerName: user.name,
                customerPhone: user.phone,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: address,
                },
                category,
                description,
                status: 'pending',
                urgency: 'medium',
            });

            Alert.alert(
                'Success',
                'Service request created! Mechanics will send proposals soon.',
                [
                    {
                        text: 'View Proposals',
                        onPress: () => router.replace({
                            pathname: '/(customer)/proposals',
                            params: { requestId }
                        }),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
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
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Request Service</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Category Display */}
                    <View style={styles.categoryCard}>
                        <View
                            style={[
                                styles.categoryIcon,
                                { backgroundColor: categoryInfo?.color + '20' },
                            ]}
                        >
                            <Ionicons
                                name={categoryInfo?.icon as any}
                                size={32}
                                color={categoryInfo?.color}
                            />
                        </View>
                        <View>
                            <Text style={styles.categoryLabel}>Service Category</Text>
                            <Text style={styles.categoryName}>{categoryInfo?.name}</Text>
                        </View>
                    </View>

                    {/* Map or Location Input */}
                    <View style={styles.mapContainer}>
                        <Text style={styles.mapLabel}>Service Location</Text>
                        {Platform.OS === 'web' ? (
                            <View style={styles.webLocationContainer}>
                                <Input
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Enter your address"
                                />
                                <TouchableOpacity
                                    style={styles.getCurrentLocationBtn}
                                    onPress={getCurrentLocation}
                                >
                                    <Ionicons name="locate" size={20} color={COLORS.white} />
                                    <Text style={styles.getCurrentLocationText}>Use Current Location</Text>
                                </TouchableOpacity>
                            </View>
                        ) : loadingLocation ? (
                            <View style={styles.mapPlaceholder}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Getting your location...</Text>
                            </View>
                        ) : MapView ? (
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    ...location,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onPress={handleMapPress}
                            >
                                {Marker && (
                                    <Marker
                                        coordinate={location}
                                        title="Service Location"
                                        pinColor={COLORS.primary}
                                    />
                                )}
                            </MapView>
                        ) : null}

                        {Platform.OS !== 'web' && !loadingLocation && (
                            <TouchableOpacity
                                style={styles.currentLocationButton}
                                onPress={getCurrentLocation}
                            >
                                <Ionicons name="locate" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Address Display */}
                    {address ? (
                        <View style={styles.addressCard}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <Text style={styles.addressText}>{address}</Text>
                        </View>
                    ) : null}

                    {/* Description Input */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <Input
                                placeholder="Describe the issue or service needed..."
                                value={description}
                                onChangeText={setDescription}
                                style={styles.textArea}
                            />
                        </View>

                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                Mechanics in your area will receive this request and send proposals with
                                their pricing and availability.
                            </Text>
                        </View>

                        <Button
                            title="Submit Request"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.submitButton}
                        />

                        <Button
                            title="Cancel"
                            onPress={() => router.push('/(customer)/home')}
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
        padding: SIZES.padding,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 16,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    categoryName: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    mapContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    mapLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    map: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
    },
    mapPlaceholder: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    webLocationContainer: {
        gap: 12,
    },
    getCurrentLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    getCurrentLocationText: {
        color: COLORS.white,
        fontSize: SIZES.base,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        marginBottom: 0,
    },
    label: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary + '10',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    submitButton: {
        marginTop: 8,
    },
});
