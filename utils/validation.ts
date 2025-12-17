/**
 * Input Validation Utility for FixKar
 * Provides validation for phone numbers, emails, passwords, and form fields
 */

// Pakistani phone number pattern: +92XXXXXXXXXX or 03XXXXXXXXX
const PAKISTAN_PHONE_REGEX = /^(\+92|0)?[3][0-9]{9}$/;

// Email pattern (simple but effective)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CNIC pattern: XXXXX-XXXXXXX-X
const CNIC_REGEX = /^[0-9]{5}-[0-9]{7}-[0-9]$/;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validate Pakistani phone number
 */
export const validatePhone = (phone: string): ValidationResult => {
    if (!phone || phone.trim().length === 0) {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    if (!PAKISTAN_PHONE_REGEX.test(cleaned)) {
        return { isValid: false, error: 'Please enter a valid Pakistani phone number' };
    }

    return { isValid: true };
};

/**
 * Validate email address
 */
export const validateEmail = (email: string, required: boolean = false): ValidationResult => {
    if (!email || email.trim().length === 0) {
        if (required) {
            return { isValid: false, error: 'Email is required' };
        }
        return { isValid: true }; // Optional and empty is valid
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string, minLength: number = 6): ValidationResult => {
    if (!password || password.length === 0) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < minLength) {
        return { isValid: false, error: `Password must be at least ${minLength} characters` };
    }

    // Check for at least one letter and one number (optional, can be enabled)
    // const hasLetter = /[a-zA-Z]/.test(password);
    // const hasNumber = /[0-9]/.test(password);
    // if (!hasLetter || !hasNumber) {
    //     return { isValid: false, error: 'Password must contain letters and numbers' };
    // }

    return { isValid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (
    password: string,
    confirmPassword: string
): ValidationResult => {
    if (!confirmPassword || confirmPassword.length === 0) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
};

/**
 * Validate name
 */
export const validateName = (name: string, minLength: number = 2): ValidationResult => {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Name is required' };
    }

    if (name.trim().length < minLength) {
        return { isValid: false, error: `Name must be at least ${minLength} characters` };
    }

    // Check for valid characters (letters, spaces, some special chars)
    const validNameRegex = /^[a-zA-Z\s\u0600-\u06FF'-]+$/;
    if (!validNameRegex.test(name.trim())) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true };
};

/**
 * Validate CNIC (Pakistani National ID)
 */
export const validateCNIC = (cnic: string): ValidationResult => {
    if (!cnic || cnic.trim().length === 0) {
        return { isValid: false, error: 'CNIC is required' };
    }

    // Remove spaces
    const cleaned = cnic.trim();

    if (!CNIC_REGEX.test(cleaned)) {
        return { isValid: false, error: 'Please enter CNIC in format XXXXX-XXXXXXX-X' };
    }

    return { isValid: true };
};

/**
 * Validate price input
 */
export const validatePrice = (price: string, min: number = 0): ValidationResult => {
    if (!price || price.trim().length === 0) {
        return { isValid: false, error: 'Price is required' };
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
        return { isValid: false, error: 'Please enter a valid price' };
    }

    if (numPrice < min) {
        return { isValid: false, error: `Price must be at least ${min}` };
    }

    return { isValid: true };
};

/**
 * Validate OTP code
 */
export const validateOTP = (otp: string, length: number = 6): ValidationResult => {
    if (!otp || otp.trim().length === 0) {
        return { isValid: false, error: 'OTP is required' };
    }

    if (!/^\d+$/.test(otp)) {
        return { isValid: false, error: 'OTP must contain only numbers' };
    }

    if (otp.length !== length) {
        return { isValid: false, error: `OTP must be ${length} digits` };
    }

    return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string = 'This field'): ValidationResult => {
    if (!value || value.trim().length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
};

/**
 * Validate text length
 */
export const validateLength = (
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string = 'Field'
): ValidationResult => {
    if (!value) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (value.length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (value.length > maxLength) {
        return { isValid: false, error: `${fieldName} must be at most ${maxLength} characters` };
    }

    return { isValid: true };
};

/**
 * Sanitize input to prevent XSS and injection
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('92')) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    }
    
    if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    
    return phone;
};

/**
 * Normalize phone number for storage (always +92 format)
 */
export const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('92')) {
        return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('0')) {
        return `+92${cleaned.slice(1)}`;
    }
    
    return `+92${cleaned}`;
};

export default {
    validatePhone,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validateName,
    validateCNIC,
    validatePrice,
    validateOTP,
    validateRequired,
    validateLength,
    sanitizeInput,
    formatPhoneNumber,
    normalizePhoneNumber,
};
