import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '@/constants/theme';

// Google Places API key - should be in env vars
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface LocationSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

interface LocationSearchProps {
    value: string;
    onChangeText: (text: string) => void;
    onSelectLocation: (location: { latitude: number; longitude: number; address: string }) => void;
    placeholder?: string;
}

export function LocationSearch({
    value,
    onChangeText,
    onSelectLocation,
    placeholder = 'Enter service location',
}: LocationSearchProps) {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<any>(null);

    const searchPlaces = async (query: string) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // For web or if GOOGLE_PLACES_API_KEY is set
            if (Platform.OS === 'web' || GOOGLE_PLACES_API_KEY !== '42ce295d465c1abd16bf7c4a887f09b6c2ebe48a') {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                        query
                    )}&components=country:pk&key=${GOOGLE_PLACES_API_KEY}`
                );
                const data = await response.json();

                if (data.predictions) {
                    const formatted: LocationSuggestion[] = data.predictions.map((p: any) => ({
                        placeId: p.place_id,
                        description: p.description,
                        mainText: p.structured_formatting.main_text,
                        secondaryText: p.structured_formatting.secondary_text || '',
                    }));
                    setSuggestions(formatted);
                }
            } else {
                // Fallback: Use Expo Location geocoding
                const results = await Location.geocodeAsync(query + ', Pakistan');
                if (results.length > 0) {
                    const formatted: LocationSuggestion[] = results.map((r, idx) => ({
                        placeId: `${r.latitude}-${r.longitude}`,
                        description: query,
                        mainText: query,
                        secondaryText: `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`,
                    }));
                    setSuggestions(formatted.slice(0, 5));
                }
            }
        } catch (error) {
            console.error('Place search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTextChange = (text: string) => {
        onChangeText(text);
        setShowSuggestions(true);

        // Debounce search
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchPlaces(text);
        }, 500);
    };

    const selectPlace = async (suggestion: LocationSuggestion) => {
        onChangeText(suggestion.mainText);
        setShowSuggestions(false);
        setSuggestions([]);

        try {
            // Get coordinates from place ID or description
            if (GOOGLE_PLACES_API_KEY !== '42ce295d465c1abd16bf7c4a887f09b6c2ebe48a' && Platform.OS !== 'web') {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`
                );
                const data = await response.json();

                if (data.result?.geometry?.location) {
                    onSelectLocation({
                        latitude: data.result.geometry.location.lat,
                        longitude: data.result.geometry.location.lng,
                        address: suggestion.description,
                    });
                }
            } else {
                // Fallback: geocode the description
                const results = await Location.geocodeAsync(suggestion.description);
                if (results.length > 0) {
                    onSelectLocation({
                        latitude: results[0].latitude,
                        longitude: results[0].longitude,
                        address: suggestion.description,
                    });
                }
            }
        } catch (error) {
            console.error('Place details error:', error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            const isEnabled = await Location.hasServicesEnabledAsync();
            if (!isEnabled) {
                alert('Please enable location services to use this feature');
                return;
            }

            setLoading(true);

            // Try to get last known position first for speed
            let location = await Location.getLastKnownPositionAsync({});

            // If no last known location, or if we want fresh data, try current position
            if (!location) {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            }

            if (location) {
                const addressData = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (addressData[0]) {
                    const addr = addressData[0];
                    const formatted = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''
                        }, Pakistan`.trim();
                    onChangeText(formatted);
                    onSelectLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        address: formatted,
                    });
                }
            }
        } catch (error: any) {
            console.error('Current location error:', error);
            alert('Could not fetch location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    onFocus={() => setShowSuggestions(true)}
                />
                {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
                <TouchableOpacity
                    onPress={getCurrentLocation}
                    style={styles.locationButton}
                    disabled={loading}
                >
                    <Ionicons name="locate" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.placeId}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => selectPlace(item)}
                            >
                                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                                <View style={styles.suggestionText}>
                                    <Text style={styles.mainText}>{item.mainText}</Text>
                                    {item.secondaryText && (
                                        <Text style={styles.secondaryText}>{item.secondaryText}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.suggestionsList}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    locationButton: {
        padding: 4,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        maxHeight: 250,
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    suggestionText: {
        flex: 1,
    },
    mainText: {
        fontSize: SIZES.base,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 2,
    },
    secondaryText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
});
