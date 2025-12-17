import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = typeof LIGHT_COLORS;

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    // Computed colors based on mode
    getColors: () => ColorScheme;
    isDark: () => boolean;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'light',
            
            setMode: (mode) => set({ mode }),
            
            toggleTheme: () => {
                const currentMode = get().mode;
                const newMode = currentMode === 'light' ? 'dark' : 'light';
                set({ mode: newMode });
            },
            
            getColors: () => {
                const mode = get().mode;
                if (mode === 'system') {
                    const systemTheme = Appearance.getColorScheme();
                    return systemTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
                }
                return mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
            },
            
            isDark: () => {
                const mode = get().mode;
                if (mode === 'system') {
                    return Appearance.getColorScheme() === 'dark';
                }
                return mode === 'dark';
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Hook to get live colors
export const useColors = () => {
    const { mode, getColors } = useThemeStore();
    // Re-render when mode changes
    return getColors();
};

// Export for backward compatibility
export default useThemeStore;
