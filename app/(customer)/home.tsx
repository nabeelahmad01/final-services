import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";
import { useNotifications } from "@/stores/useNotifications";
import {
  subscribeToActiveBooking,
  getNearbyMechanics,
  getCustomerRecentBookings,
} from "@/services/firebase/firestore";
import { useModal, showInfoModal } from "@/utils/modalService";
import { COLORS, SIZES, CATEGORIES } from "@/constants/theme";
import { ServiceCategory, Mechanic, Booking } from "@/types";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/shared/Avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MapView, Marker, PROVIDER_GOOGLE } from "@/utils/mapHelpers";
import { useTranslation } from "react-i18next";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width, height } = Dimensions.get("window");

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
  const categoryData =
    CATEGORIES.find((cat) => cat.id === category) || CATEGORIES[0];

  return (
    <View style={styles.mechanicMarkerContainer}>
      <View
        style={[
          styles.mechanicMarkerShadow,
          { shadowColor: categoryData.color },
        ]}
      />
      <View
        style={[styles.mechanicMarker, { backgroundColor: categoryData.color }]}
      >
        <Ionicons
          name={categoryData.icon as any}
          size={22}
          color={COLORS.white}
        />
      </View>
      <View
        style={[
          styles.mechanicMarkerPin,
          { borderTopColor: categoryData.color },
        ]}
      />
    </View>
  );
};

export default function CustomerHome() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const COLORS = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { activeBooking, setActiveBooking } = useBookingStore();
  const { showModal } = useModal();

  // Default location (Islamabad) to show map immediately
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 33.6844,
    longitude: 73.0479,
  });
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [nearbyMechanics, setNearbyMechanics] = useState<Mechanic[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToActiveBooking(
      user.id,
      "customer",
      (booking) => {
        setActiveBooking(booking);
        if (booking) {
          router.push("/(customer)/tracking");
        }
      }
    );

    initializeLocation();

    // Fetch recent bookings
    const fetchRecentBookings = async () => {
      const bookings = await getCustomerRecentBookings(user.id, 3);
      setRecentBookings(bookings);
    };
    fetchRecentBookings();

    return () => unsubscribe();
  }, [user]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
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

  const fetchNearbyMechanics = async (
    location: { latitude: number; longitude: number },
    category?: ServiceCategory
  ) => {
    setLoadingMechanics(true);
    try {
      const mechanics = await getNearbyMechanics(location, category, 10);
      setNearbyMechanics(mechanics);
    } catch (error) {
      console.error("Error fetching nearby mechanics:", error);
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
    // Include pre-selected location if available
    const params: any = { category };
    
    if (selectedLocationName && userLocation) {
      params.presetLat = userLocation.latitude.toString();
      params.presetLng = userLocation.longitude.toString();
      params.presetAddress = selectedLocationName;
    }
    
    router.push({
      pathname: "/(customer)/service-request",
      params,
    });
  };

  const handleEmergency = () => {
    // Navigate to service request with emergency flag and pre-selected location
    const params: any = { emergency: 'true' };
    
    if (selectedLocationName && userLocation) {
      params.presetLat = userLocation.latitude.toString();
      params.presetLng = userLocation.longitude.toString();
      params.presetAddress = selectedLocationName;
    }
    
    router.push({
      pathname: "/(customer)/service-request",
      params,
    });
  };

  const getCategoryForMechanic = (
    mechanic: Mechanic
  ): ServiceCategory | undefined => {
    return mechanic.categories && mechanic.categories.length > 0
      ? mechanic.categories[0]
      : undefined;
  };

  // Get greeting based on time and language
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (isUrdu) {
      if (hour < 12) return 'السلام علیکم';
      if (hour < 17) return 'السلام علیکم';
      return 'السلام علیکم';
    } else {
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    }
  };

  const getUserFirstName = () => {
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  };

  const renderMap = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color={COLORS.primary} />
          <Text style={styles.mapPlaceholderText}>
            Map view available on mobile app
          </Text>
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
        showsUserLocation={false}
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

        {Marker &&
          nearbyMechanics.map((mechanic) => (
            <Marker
              key={mechanic.id}
              coordinate={{
                latitude: mechanic.location!.latitude,
                longitude: mechanic.location!.longitude,
              }}
              title={mechanic.name}
              description={`⭐ ${mechanic.rating.toFixed(1)} • ${(
                mechanic as any
              ).distance?.toFixed(1)}km away`}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={100}
            >
              <CustomMechanicMarker
                category={getCategoryForMechanic(mechanic)}
              />
            </Marker>
          ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>{renderMap()}</View>

      {/* Modern Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Top Row - Greeting + Avatar */}
        <View style={styles.headerTopRow}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingSmall}>
              {getGreeting()} 👋
            </Text>
            <Text style={[styles.userName, isUrdu && styles.urduText]}>
              {user?.name || 'User'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push("/(shared)/profile")}
          >
            <Avatar name={user?.name || ''} uri={user?.profilePic} size={48} />
            {useNotifications.getState().unreadCount > 0 && (
              <View style={styles.avatarBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Location Row - Search bar style */}
        <TouchableOpacity 
          style={styles.locationBar} 
          activeOpacity={0.8}
          onPress={() => setShowLocationPicker(true)}
        >
          <View style={styles.locationIconBox}>
            <Ionicons name="location" size={18} color={COLORS.white} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>
              {isUrdu ? 'آپ کا مقام' : 'Your location'}
            </Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {selectedLocationName || (isUrdu ? 'موجودہ مقام' : 'Current Location')}
            </Text>
          </View>
          <View style={styles.dropdownIcon}>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationPicker(false)}
        >
          <View style={styles.locationPickerModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {isUrdu ? 'مقام منتخب کریں' : 'Select Location'}
            </Text>

            {/* Use Current Location Option */}
            <TouchableOpacity 
              style={styles.locationOption}
              onPress={() => {
                initializeLocation();
                setSelectedLocationName(isUrdu ? 'موجودہ GPS مقام' : 'Current GPS Location');
                setShowLocationPicker(false);
              }}
            >
              <View style={[styles.locationOptionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.locationOptionText}>
                <Text style={styles.locationOptionTitle}>
                  {isUrdu ? 'موجودہ GPS مقام' : 'Use Current GPS'}
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  {isUrdu ? 'آپ کا موجودہ مقام' : 'Your current location'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Recent Locations */}
            {recentBookings.length > 0 && (
              <>
                <Text style={[styles.locationSectionTitle, isUrdu && styles.urduText]}>
                  {isUrdu ? 'حالیہ مقامات' : 'Recent Locations'}
                </Text>
                {recentBookings.slice(0, 4).map((booking, index) => {
                  const categoryData = CATEGORIES.find(c => c.id === booking.category);
                  const locationName = isUrdu 
                    ? (categoryData as any)?.urdu + ' - ' + booking.completedAt?.toLocaleDateString()
                    : categoryData?.name + ' - ' + booking.completedAt?.toLocaleDateString();
                  
                  return (
                    <TouchableOpacity 
                      key={booking.id}
                      style={styles.locationOption}
                      onPress={() => {
                        if (booking.customerLocation) {
                          setUserLocation({
                            latitude: booking.customerLocation.latitude,
                            longitude: booking.customerLocation.longitude,
                          });
                          // Use actual address from booking, not category name
                          setSelectedLocationName(booking.customerLocation.address || (isUrdu ? (categoryData as any)?.urdu : categoryData?.name));
                        }
                        setShowLocationPicker(false);
                      }}
                    >
                      <View style={[styles.locationOptionIcon, { backgroundColor: (categoryData?.color || COLORS.primary) + '15' }]}>
                        <Ionicons name="time" size={20} color={categoryData?.color || COLORS.primary} />
                      </View>
                      <View style={styles.locationOptionText}>
                        <Text style={styles.locationOptionTitle} numberOfLines={1}>
                          {booking.customerLocation?.address || (isUrdu ? (categoryData as any)?.urdu : categoryData?.name)}
                        </Text>
                        <Text style={styles.locationOptionSubtitle}>
                          {(isUrdu ? (categoryData as any)?.urdu : categoryData?.name)} • {booking.completedAt?.toLocaleDateString()}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowLocationPicker(false)}
            >
              <Text style={styles.closeModalText}>
                {isUrdu ? 'بند کریں' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quick Actions - Floating Pills */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergency}
        >
          <Ionicons name="flash" size={18} color={COLORS.white} />
          <Text style={styles.emergencyText}>
            {isUrdu ? 'فوری' : 'Urgent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push("/(customer)/bookings")}
        >
          <Ionicons name="time" size={18} color={COLORS.text} />
          <Text style={styles.quickActionText}>
            {isUrdu ? 'بکنگز' : 'My Bookings'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Refresh Button */}
      <TouchableOpacity
        onPress={initializeLocation}
        style={[styles.refreshButton, { bottom: 260 }]}
      >
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bottom Sheet Container */}
      <View style={styles.bottomSheet}>
        {/* Active Booking Banner (if any) */}
        {activeBooking && (
          <TouchableOpacity
            style={styles.activeBookingBanner}
            onPress={() => router.push("/(customer)/tracking")}
          >
            <View style={styles.activeBookingContent}>
              <View style={styles.pulsatingDot} />
              <Text style={styles.activeBookingText}>
                {isUrdu ? 'آپ کا مستری آ رہا ہے' : t("home.mechanicOnWay")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Services List */}
        <View style={styles.servicesContainer}>
          <Text style={[styles.servicesTitle, isUrdu && styles.urduText]}>
            {isUrdu ? 'سروس منتخب کریں' : t("home.selectService")}
          </Text>
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
                  selectedCategory === category.id && styles.serviceCardActive,
                ]}
                onPress={() =>
                  handleServiceRequest(category.id as ServiceCategory)
                }
              >
                <View
                  style={[
                    styles.serviceIconContainer,
                    { backgroundColor: category.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={32}
                    color={category.color}
                  />
                </View>
                <Text style={[styles.serviceName, isUrdu && styles.urduText]} numberOfLines={2}>
                  {isUrdu ? (category as any).urdu : category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Locations */}
        {recentBookings.length > 0 && (
          <View style={styles.recentLocationsContainer}>
            <Text style={[styles.servicesTitle, isUrdu && styles.urduText]}>
              {isUrdu ? 'حالیہ مقامات' : 'Recent Locations'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentLocationsScroll}
            >
              {recentBookings.map((booking) => {
                const categoryData = CATEGORIES.find(c => c.id === booking.category);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={styles.recentLocationCard}
                    onPress={() => handleServiceRequest(booking.category as ServiceCategory)}
                  >
                    <View style={[styles.recentLocationIcon, { backgroundColor: (categoryData?.color || COLORS.primary) + '20' }]}>
                      <Ionicons
                        name="location"
                        size={20}
                        color={categoryData?.color || COLORS.primary}
                      />
                    </View>
                    <View style={styles.recentLocationInfo}>
                      <Text style={styles.recentLocationCategory} numberOfLines={1}>
                        {isUrdu ? (categoryData as any)?.urdu : categoryData?.name}
                      </Text>
                      <Text style={styles.recentLocationDate}>
                        {booking.completedAt?.toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  mapPlaceholderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  greetingSection: {
    flex: 1,
  },
  greetingSmall: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  locationText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  urduText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 180,
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 10,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  emergencyText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  refreshButton: {
    position: "absolute",
    right: 20,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeBookingContent: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    fontSize: SIZES.sm,
  },
  servicesContainer: {
    marginBottom: 10,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 12,
  },
  servicesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  serviceCard: {
    width: 110,
    alignItems: "center",
    gap: 8,
  },
  serviceCardActive: {
    opacity: 0.7,
  },
  serviceIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 18,
  },
  // Markers
  userMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  userMarkerPulse: {
    position: "absolute",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  mechanicMarkerContainer: {
    alignItems: "center",
    height: 65,
  },
  mechanicMarkerShadow: {
    position: "absolute",
    top: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 15,
  },
  mechanicMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  mechanicMarkerPin: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // Recent Locations
  recentLocationsContainer: {
    marginTop: 16,
    paddingBottom: 10,
  },
  recentLocationsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  recentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    minWidth: 180,
  },
  recentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentLocationInfo: {
    flex: 1,
  },
  recentLocationCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentLocationDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Location Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  locationPickerModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  locationOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationOptionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  closeModalButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});

