import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '@/constants/theme';

const { width } = Dimensions.get('window');

const onboardingData = [
    {
        id: '1',
        icon: 'home-outline' as const,
        title: 'Welcome to FixKar',
        description: 'Your trusted platform for connecting with skilled service professionals across Pakistan',
        color: COLORS.primary,
    },
    {
        id: '2',
        icon: 'search-outline' as const,
        title: 'Find Services Easily',
        description: 'Browse through various categories and find the perfect mechanic for your needs in minutes',
        color: COLORS.secondary,
    },
    {
        id: '3',
        icon: 'shield-checkmark-outline' as const,
        title: 'Verified Professionals',
        description: 'All service providers are KYC verified to ensure quality and reliability for your peace of mind',
        color: COLORS.success,
    },
];

export default function Onboarding() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(auth)/role-selection');
    };

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleSkip();
        }
    };

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index || 0);
            }
        }
    ).current;

    const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
        <View style={styles.slide}>
            <Animated.View
                entering={FadeIn.delay(200)}
                style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}
            >
                <Ionicons name={item.icon} size={80} color={item.color} />
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(400)} style={styles.title}>
                {item.title}
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(600)} style={styles.description}>
                {item.description}
            </Animated.Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Skip Button */}
            {currentIndex < onboardingData.length - 1 && (
                <Animated.View entering={FadeIn} style={styles.skipContainer}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                scrollEventThrottle={16}
            />

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
                {onboardingData.map((_, index) => (
                    <Animated.View
                        key={index}
                        entering={SlideInRight.delay(index * 100)}
                        style={[
                            styles.dot,
                            index === currentIndex && styles.dotActive,
                            index === currentIndex && {
                                backgroundColor: onboardingData[currentIndex].color,
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Next/Get Started Button */}
            <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: onboardingData[currentIndex].color },
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === onboardingData.length - 1
                            ? 'Get Started'
                            : 'Next'}
                    </Text>
                    <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    skipContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding * 2,
        paddingBottom: 200,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    description: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    dotActive: {
        width: 24,
        height: 8,
        borderRadius: 4,
    },
    buttonContainer: {
        paddingHorizontal: SIZES.padding * 2,
        paddingBottom: SIZES.padding * 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
