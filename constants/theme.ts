export const LIGHT_COLORS = {
    primary: '#00ACC1',
    primaryDark: '#00838F',
    primaryLight: '#26C6DA',
    secondary: '#FF6F00',
    secondaryDark: '#E65100',
    secondaryLight: '#FF8F00',
    success: '#43A047',
    danger: '#E53935',
    warning: '#FFA726',
    info: '#2196F3',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    white: '#FFFFFF',
    black: '#000000',
};

export const DARK_COLORS = {
    ...LIGHT_COLORS,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#E0E0E0',
    textSecondary: '#B0B0B0',
    border: '#333333',
    white: '#FFFFFF', // Keep white as white for text on primary buttons etc
    black: '#000000',
};

export const COLORS = LIGHT_COLORS; // Backward compatibility

export const FONTS = {
    light: 'PlusJakartaSans_300Light',
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
};

export const SIZES = {
    // Font sizes
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,

    // Spacing
    padding: 16,
    margin: 16,
    borderRadius: 8,

    // Icon sizes
    icon: 24,
    iconSmall: 20,
    iconLarge: 32,
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
};

export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 350,
};

export const CATEGORIES = [
    {
        id: 'bike_mechanic',
        name: 'Bike Mechanic',
        urdu: 'موٹر سائیکل مستری',
        icon: 'bicycle',
        color: '#FF6F00'
    },
    {
        id: 'car_mechanic',
        name: 'Car Mechanic',
        urdu: 'گاڑی کا مستری',
        icon: 'car',
        color: '#1976D2'
    },
    {
        id: 'plumber',
        name: 'Plumber',
        urdu: 'پلمبر',
        icon: 'water',
        color: '#0097A7'
    },
    {
        id: 'electrician',
        name: 'Electrician',
        urdu: 'الیکٹریشن',
        icon: 'flash',
        color: '#FFA000'
    },
    {
        id: 'ac_fridge',
        name: 'AC/Fridge Repair',
        urdu: 'اے سی / فریج مرمت',
        icon: 'snow',
        color: '#00ACC1'
    },
    {
        id: 'mobile_repair',
        name: 'Mobile Repair',
        urdu: 'موبائل مرمت',
        icon: 'phone-portrait',
        color: '#5E35B1'
    },
    {
        id: 'carpenter',
        name: 'Carpenter',
        urdu: 'بڑھئی',
        icon: 'hammer',
        color: '#6D4C41'
    },
    {
        id: 'general_mart',
        name: 'General Mart',
        urdu: 'جنرل مارٹ',
        icon: 'storefront',
        color: '#8E24AA'
    },
];

export const DIAMOND_PACKAGES = [
    {
        id: '10_diamonds',
        diamonds: 10,
        price: 500,
        popular: false,
    },
    {
        id: '25_diamonds',
        diamonds: 25,
        price: 1000,
        popular: false,
    },
    {
        id: '50_diamonds',
        diamonds: 50,
        price: 1800,
        popular: true,
        discount: '10%'
    },
    {
        id: '100_diamonds',
        diamonds: 100,
        price: 3200,
        popular: false,
        discount: '20%'
    },
];

export const DIAMOND_COST_PER_PROPOSAL = 1;

export default {
    COLORS,
    FONTS,
    SIZES,
    SHADOWS,
    ANIMATION,
    CATEGORIES,
    DIAMOND_PACKAGES,
    DIAMOND_COST_PER_PROPOSAL,
};
