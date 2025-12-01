import React, { useState, useEffect, useRef } from 'react';
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
    TextInput,
    Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
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
    const mapRef = useRef<any>(null);
    const googlePlacesRef = useRef<any>(null);

    const [description, setDescription] = useState('');
    const [location, setLocation] = useState({
        latitude: 33.6844, // Islamabad default
        longitude: 73.0479,
    });
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [listViewDisplayed, setListViewDisplayed] = useState<'auto' | boolean>('auto');

    const categoryInfo = CATEGORIES.find(c => c.id === category);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            // Check if location services are available
            const hasLocationServices = await Location.hasServicesEnabledAsync();
            if (!hasLocationServices) {
                setLoadingLocation(false);
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLoadingLocation(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const newLocation = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setLocation(newLocation);
            animateToLocation(newLocation);

            // Get address from coordinates
            const addressData = await Location.reverseGeocodeAsync(newLocation);
            if (addressData[0]) {
                const addr = addressData[0];
                const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}, Pakistan`.trim();
                setAddress(formattedAddress);
            }
        } catch (error: any) {
            // Silently handle - use default location (Islamabad)
        } finally {
            setLoadingLocation(false);
        }
    };

    const animateToLocation = (coords: { latitude: number; longitude: number }) => {
        if (mapRef.current && Platform.OS !== 'web') {
            mapRef.current.animateToRegion({
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    const handlePlaceSelect = async (data: any, details: any) => {
        if (details?.geometry?.location) {
            const newLocation = {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
            };

            setLocation(newLocation);
            setAddress(details.formatted_address || data.description);
            animateToLocation(newLocation);

            // Fix: Dismiss keyboard and update text to close dropdown
            Keyboard.dismiss();
            setListViewDisplayed(false);
            googlePlacesRef.current?.setAddressText(data.description);
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

    const renderMap = () => {
        if (Platform.OS === 'web') {
            return (
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
            );
        }

        if (loadingLocation) {
            return (
                <View style={styles.mapPlaceholder}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Getting your location...</Text>
                </View>
            );
        }

        if (!MapView) {
            return (
                <View style={styles.mapPlaceholder}>
                    <Text style={styles.loadingText}>Map not available</Text>
                </View>
            );
        }

        return (
            <>
                <MapView
                    ref={mapRef}
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

                {/* Search overlay on map */}
                <View style={styles.searchOverlay}>
                    <GooglePlacesAutocomplete
                        ref={googlePlacesRef}
                        placeholder="Search location..."
                        fetchDetails={true}
                        listViewDisplayed={listViewDisplayed}
                        textInputProps={{
                            onChangeText: () => setListViewDisplayed('auto'),
                        }}
                        onPress={handlePlaceSelect}
                        query={{
                            key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '',
                            language: 'en',
                            components: 'country:pk', // Pakistan only
                            types: 'geocode', // Get all address types
                        }}
                        requestUrl={{
                            useOnPlatform: 'all',
                            url: 'https://maps.googleapis.com/maps/api',
                        }}
                        styles={{
                            container: {
                                flex: 0,
                            },
                            textInputContainer: {
                                backgroundColor: COLORS.surface,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 5,
                            },
                            textInput: {
                                backgroundColor: COLORS.surface,
                                color: COLORS.text,
                                fontSize: 16,
                                height: 44,
                            },
                            listView: {
                                backgroundColor: COLORS.surface,
                                borderRadius: 12,
                                marginTop: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 5,
                            },
                            row: {
                                backgroundColor: COLORS.surface,
                                padding: 13,
                                height: 'auto',
                                minHeight: 50,
                            },
                            separator: {
                                height: 1,
                                backgroundColor: COLORS.border,
                            },
                            description: {
                                color: COLORS.text,
                            },
                            poweredContainer: {
                                display: 'none',
                            },
                        }}
                        enablePoweredByContainer={false}
                        nearbyPlacesAPI="GooglePlacesSearch"
                        debounce={400}
                    />
                </View>

                <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={getCurrentLocation}
                >
                    <Ionicons name="locate" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </>
        );
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
                    keyboardShouldPersistTaps="handled"
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

                    {/* Map with Search */}
                    <View style={styles.mapSection}>
                        <Text style={styles.sectionLabel}>Service Location</Text>
                        <View style={styles.mapContainer}>
                            {renderMap()}
                        </View>
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
                                multiline
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
        marginBottom: 20,
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
        borderRadius: 16,
        marginBottom: 24,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
    mapSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    mapContainer: {
        position: 'relative',
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    searchOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        zIndex: 10,
    },
    webLocationContainer: {
        gap: 12,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
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
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addressText: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 22,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        marginBottom: 0,
    },
    label: {
        fontSize: SIZES.base,
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
