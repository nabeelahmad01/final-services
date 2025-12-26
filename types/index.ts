export type UserRole = 'customer' | 'mechanic' | 'admin';

export type ServiceCategory =
    | 'bike_mechanic'
    | 'car_mechanic'
    | 'plumber'
    | 'electrician'
    | 'ac_fridge'
    | 'mobile_repair'
    | 'carpenter'
    | 'general_mart';

export interface User {
    id: string;
    role: UserRole;
    name: string;
    email: string;
    phone: string;
    profilePic?: string;
    emailVerified?: boolean;
    createdAt: Date;
}

export interface Customer extends User {
    savedAddresses?: {
        id: string;
        label: string;
        address: string;
        latitude: number;
        longitude: number;
    }[];
    favoriteMechanics?: string[];
}

export interface Mechanic extends User {
    categories: ServiceCategory[];
    rating: number;
    totalRatings: number;
    ratingCount?: number; // Number of ratings received
    totalRating?: number; // Sum of all ratings (for calculating average)
    completedJobs: number;
    diamondBalance: number;
    totalEarnings: number;
    isVerified: boolean;
    emailVerified?: boolean; // Email verification status
    kycStatus: 'pending' | 'approved' | 'rejected';
    kycDocuments?: {
        cnic: string;
        certificate?: string;
    };
    location?: {
        latitude: number;
        longitude: number;
    };
    vehicleInfo?: {
        type: string;
        number: string;
        color: string;
    };
}

export interface ServiceRequest {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerPhoto?: string | null;
    category: ServiceCategory;
    description: string;
    images?: string[];
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    budget?: {
        min: number;
        max: number;
    };
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    createdAt: Date;
    urgency: 'low' | 'medium' | 'high';
    offeredPrice?: number;
    // Scheduling fields
    isScheduled?: boolean; // true = scheduled for later, false/undefined = immediate
    scheduledDate?: Date;
    scheduledTime?: string; // e.g., "10:00 AM"
}

export interface Proposal {
    id: string;
    requestId: string;
    customerId: string;
    mechanicId: string;
    mechanicName: string;
    mechanicPhoto?: string;
    mechanicRating: number;
    mechanicTotalRatings: number;
    mechanicPhone?: string; // Added for contact info
    price: number;
    estimatedTime: string;
    message: string;
    distance: number; // in km
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

export interface Booking {
    id: string;
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    customerPhoto?: string;
    mechanicId: string;
    mechanicName?: string;
    mechanicPhone?: string | null;
    mechanicPhoto?: string | null;
    mechanicRating?: number;
    requestId: string;
    proposalId: string;
    category: ServiceCategory;
    customerLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    mechanicLocation?: {
        latitude: number;
        longitude: number;
    };
    price: number;
    estimatedTime: string;
    status: 'scheduled' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
    // Scheduling fields
    isScheduled?: boolean;
    scheduledDate?: Date;
    scheduledTime?: string;
    startedAt: Date;
    completedAt?: Date;
    rating?: number;
    review?: string;
    isReviewed?: boolean;
    reviewComment?: string;
    beforePhotos?: string[];
    afterPhotos?: string[];
}

export interface Transaction {
    id: string;
    userId: string;
    type: 'purchase' | 'deduction' | 'refund';
    amount: number; // diamonds
    paymentMethod?: 'jazzcash' | 'easypaisa';
    paymentDetails?: {
        transactionId: string;
        amount: number; // PKR
    };
    relatedBookingId?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    text?: string;
    imageUrl?: string;
    type: 'text' | 'image' | 'location';
    location?: {
        latitude: number;
        longitude: number;
    };
    createdAt: Date;
    read: boolean;
}

export interface Chat {
    id: string;
    participants: string[]; // user IDs
    participantDetails: {
        [userId: string]: {
            name: string;
            photo?: string;
        };
    };
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount: {
        [userId: string]: number;
    };
}

export interface Notification {
    id: string;
    userId: string;
    type: 
        | 'new_request' 
        | 'new_proposal' 
        | 'proposal_accepted' 
        | 'proposal_rejected'
        | 'booking_started' 
        | 'booking_completed' 
        | 'mechanic_arriving'
        | 'mechanic_arrived'
        | 'payment' 
        | 'payment_received'
        | 'kyc_update' 
        | 'kyc_approved'
        | 'kyc_rejected'
        | 'chat' 
        | 'chat_message'
        | 'call'
        | 'new_service_request'
        | 'diamond_purchased'
        | 'scheduled_reminder';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
}

export interface Location {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}

export interface Review {
    id: string;
    bookingId: string;
    mechanicId: string;
    customerId: string;
    customerName: string;
    customerPhoto?: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

export interface FavoriteMechanic {
    id: string;
    customerId: string;
    mechanicId: string;
    mechanicName: string;
    mechanicPhone: string;
    mechanicPhoto?: string;
    mechanicRating: number;
    mechanicTotalRatings: number;
    categories: ServiceCategory[];
    completedJobs: number;
    addedAt: Date;
}
