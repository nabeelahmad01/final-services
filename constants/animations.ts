import { WithTimingConfig, WithSpringConfig } from 'react-native-reanimated';

// Timing configurations for smooth animations
export const TIMING_CONFIG: WithTimingConfig = {
    duration: 300,
};

export const TIMING_SLOW: WithTimingConfig = {
    duration: 500,
};

export const TIMING_FAST: WithTimingConfig = {
    duration: 200,
};

// Spring configurations for natural feeling animations
export const SPRING_CONFIG: WithSpringConfig = {
    damping: 15,
    stiffness: 150,
    mass: 1,
};

export const SPRING_BOUNCY: WithSpringConfig = {
    damping: 10,
    stiffness: 100,
    mass: 0.8,
};

export const SPRING_SMOOTH: WithSpringConfig = {
    damping: 20,
    stiffness: 200,
    mass: 1,
};

// Animation presets
export const ANIMATIONS = {
    // Fade animations
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    fadeOut: {
        from: { opacity: 1 },
        to: { opacity: 0 },
    },

    // Slide animations
    slideInFromRight: {
        from: { transform: [{ translateX: 300 }], opacity: 0 },
        to: { transform: [{ translateX: 0 }], opacity: 1 },
    },
    slideInFromLeft: {
        from: { transform: [{ translateX: -300 }], opacity: 0 },
        to: { transform: [{ translateX: 0 }], opacity: 1 },
    },
    slideInFromTop: {
        from: { transform: [{ translateY: -300 }], opacity: 0 },
        to: { transform: [{ translateY: 0 }], opacity: 1 },
    },
    slideInFromBottom: {
        from: { transform: [{ translateY: 300 }], opacity: 0 },
        to: { transform: [{ translateY: 0 }], opacity: 1 },
    },

    // Scale animations
    scaleIn: {
        from: { transform: [{ scale: 0 }], opacity: 0 },
        to: { transform: [{ scale: 1 }], opacity: 1 },
    },
    scaleOut: {
        from: { transform: [{ scale: 1 }], opacity: 1 },
        to: { transform: [{ scale: 0 }], opacity: 0 },
    },
    buttonPress: {
        from: { transform: [{ scale: 1 }] },
        to: { transform: [{ scale: 0.95 }] },
    },

    // Bounce animation
    bounce: {
        from: { transform: [{ scale: 1 }] },
        to: { transform: [{ scale: 1.1 }] },
    },

    // Shake animation values
    shake: {
        0: { transform: [{ translateX: 0 }] },
        0.25: { transform: [{ translateX: -10 }] },
        0.5: { transform: [{ translateX: 10 }] },
        0.75: { transform: [{ translateX: -10 }] },
        1: { transform: [{ translateX: 0 }] },
    },
};

// Animation delays for staggered animations
export const STAGGER_DELAY = 100; // ms between each item

// Animation utility function
export const getStaggerDelay = (index: number, baseDelay: number = STAGGER_DELAY): number => {
    return index * baseDelay;
};
