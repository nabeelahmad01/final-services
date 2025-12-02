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
    createdAt: Date;
}

export interface Mechanic extends User {
    categories: ServiceCategory[];
    rating: number;
    totalRatings: number;
    completedJobs: number;
    diamondBalance: number;
    isVerified: boolean;
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
    customerPhoto?: string;
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
    status: 'ongoing' | 'completed' | 'cancelled';
    startedAt: Date;
    completedAt?: Date;
    rating?: number;
    review?: string;
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
    type: 'new_request' | 'new_proposal' | 'proposal_accepted' | 'booking_started' | 'booking_completed' | 'payment' | 'kyc_update' | 'chat' | 'call';
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
    rating: number;
    comment: string;
    createdAt: any; // Firestore Timestamp
}
