import * as Location from 'expo-location';
import { updateLocation } from '../firebase/realtimeDb';

export const requestLocationPermission = async (): Promise<boolean> => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
        return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

    return backgroundStatus === 'granted';
};

export const getCurrentLocation = async () => {
    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
    });

    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
    };
};

export const startLocationTracking = async (
    userId: string,
    onLocationUpdate?: (location: any) => void
) => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
        throw new Error('Location permission not granted');
    }

    return await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
        },
        async (location) => {
            const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                heading: location.coords.heading || undefined,
                speed: location.coords.speed || undefined,
                timestamp: location.timestamp,
            };

            // Update in Realtime Database
            await updateLocation(userId, locationData);

            if (onLocationUpdate) {
                onLocationUpdate(locationData);
            }
        }
    );
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
};

const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
};

export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<string> => {
    try {
        const result = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (result.length > 0) {
            const address = result[0];
            return `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        }

        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
};

export const getDirections = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];

            return {
                distance: leg.distance.value / 1000, // Convert to km
                duration: leg.duration.value / 60, // Convert to minutes
                polyline: route.overview_polyline.points,
                steps: leg.steps,
            };
        }

        throw new Error('No route found');
    } catch (error) {
        console.error('Error fetching directions:', error);
        throw error;
    }
};

export const decodePolyline = (encoded: string) => {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
};
