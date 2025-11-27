import { useThemeStore } from '@/stores/themeStore';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

export const useThemeColor = () => {
    const { mode } = useThemeStore();
    return mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};
