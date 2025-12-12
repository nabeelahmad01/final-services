import { Platform } from 'react-native';

// This file should NOT be imported on web
// Use mapHelpers.web.ts for web platform

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Circle: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.MapView || Maps.default; // Try MapView first, fallback to default
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    Circle = Maps.Circle;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export { MapView, Marker, Polyline, Circle, PROVIDER_GOOGLE };
