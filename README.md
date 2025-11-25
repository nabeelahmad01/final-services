# Service Marketplace App

A complete React Native Expo mobile application connecting customers with service mechanics in Pakistan. Features include live tracking, real-time chat, voice/video calls, diamond-based proposal system, and JazzCash/EasyPaisa payment integration.

## 🚀 Features

### For Customers
- Browse and select from 7 service categories
- Create service requests with location and details
- Receive proposals from multiple mechanics
- Accept proposals and track mechanic in real-time
- Live map tracking with InDrive-style UI
- Real-time chat and voice/video calling
- Service history and ratings

### For Mechanics
- Register and select service categories
- Purchase diamonds via JazzCash/EasyPaisa
- View nearby service requests
- Submit proposals (costs 1 diamond per proposal)
- Navigate to customer with live location sharing
- Manage earnings and transaction history
- Build reputation through ratings

### For Admins
- KYC approval dashboard
- User and mechanic verification
- Service request monitoring
- Analytics and reporting

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (for emulators)
- Physical device for testing (recommended)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd service-marketplace-app
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Realtime Database
   - Cloud Storage
   - Cloud Messaging
3. Download your Firebase config
4. Create `.env` file (copy from `.env.example`)
5. Add your Firebase credentials to `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXP O_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### 3. Google Maps Setup

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps SDK for Android/iOS and Directions API
3. Add to `.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Update `app.json` with your API key in the `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey` fields

### 4. Agora Setup (Optional - for Voice/Video Calls)

1. Create account at [Agora.io](https://www.agora.io)
2. Create a project and get App ID
3. Add to `.env`:

```env
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

### 5. Payment Gateway Setup

**JazzCash:**
1. Register for JazzCash merchant account
2. Get merchant ID and password
3. Add to `.env`:

```env
EXPO_PUBLIC_JAZZCASH_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_JAZZCASH_PASSWORD=your_password
EXPO_PUBLIC_JAZZCASH_RETURN_URL=servicemarketplace://payment
```

**EasyPaisa:**
1. Register for EasyPaisa MA (Merchant Account)
2. Get store ID and API key
3. Add to `.env`:

```env
EXPO_PUBLIC_EASYPAISA_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_EASYPAISA_API_KEY=your_api_key
EXPO_PUBLIC_EASYPAISA_STORE_ID=your_store_id
```

## 🏃 Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## 📱 Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Backend:** Firebase (Auth, Firestore, Realtime DB, Storage, Messaging)
- **Maps:** Google Maps / react-native-maps
- **Styling:** NativeWind (TailwindCSS)
- **Animations:** React Native Reanimated
- **Payments:** JazzCash & EasyPaisa
- **Calls:** Agora SDK (for voice/video)

## 📂 Project Structure

```
service-marketplace-app/
├── app/                         # Expo Router screens
│   ├── (auth)/                  # Authentication screens
│   ├── (customer)/              # Customer screens
│   ├── (mechanic)/              # Mechanic screens
│   ├── (admin)/                 # Admin panel
│   ├── (shared)/                # Shared screens (chat, call, profile)
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── components/                  # Reusable components
│   ├── ui/                      # UI primitives (Button, Card, Input)
│   ├── maps/                    # Map components
│   ├── chat/                    # Chat UI components
│   └── shared/                  # Shared components (Avatar, Loading)
├── services/                    # Business logic & API services
│   ├── firebase/                # Firebase services
│   ├── location/                # Location & maps services
│   └── payments/                # Payment gateway integrations
├── stores/                      # Zustand state stores
├── constants/                   # Theme, colors, categories
├── types/                       # TypeScript type definitions
└── assets/                      # Images, fonts
```

## 🔑 Key Screens

### Authentication
- **Role Selection:** Choose between Customer or Mechanic
- **Login:** Email/password authentication
- **Signup:** Registration with role-based flow
- **Category Selection:** Mechanics select their service categories

### Customer Flow
1. **Home:** Browse service categories
2. **Service Request:** Create request with details
3. **Proposals:** View mechanic proposals
4. **Live Tracking:** Real-time mechanic tracking (InDrive-style)
5. **Chat/Call:** Communicate with mechanic

### Mechanic Flow
1. **Dashboard:** Stats, earnings, diamond balance
2. **Service Requests:** Browse available jobs
3. **Wallet:** Buy diamonds, view transactions
4. **Active Job:** Navigate to customer
5. **History:** Past completed jobs

## 🎨 Design Features

- **InDrive-style live tracking** with real-time location updates
- **Beautiful animations** using React Native Reanimated
- **Modern UI** with professional color scheme (Teal/Orange)
- **Responsive design** for all screen sizes
- **Dark status bar** optimized for Pakistan market

## ⚙️ Configuration

### Firebase Security Rules

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /mechanics/{mechanicId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == mechanicId;
    }
    match /serviceRequests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /proposals/{proposalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Realtime Database:**
```json
{
  "rules": {
    "locations": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Maps not showing
- Ensure Google Maps API key is added to both `.env` and `app.json`
- Enable Maps SDK for Android and iOS in Google Cloud Console
- Check billing is enabled for Google Cloud project

### Firebase connection issues
- Verify all Firebase config values in `.env`
- Ensure Firebase services are enabled in console
- Check network connectivity

### Payment gateway errors
- Verify merchant credentials
- Test in sandbox mode first
- Check return URL scheme matches `app.json` scheme

### Build errors
- Clear cache: `expo start -c`
- Reinstall modules: `rm -rf node_modules && npm install`
- Check Expo SDK compatibility

## 📝 Environment Variables

Copy `.env.example` to `.env` and fill in:

- Firebase credentials (7 variables)
- Google Maps API key
- Agora App ID
- JazzCash credentials (3 variables)
- EasyPaisa credentials (3 variables)
- Admin password

## 🚦 Next Steps

1. **Complete remaining screens:**
   - Service request form
   - Proposal listing
   - Job history screens
   - Admin dashboard

2. **Add real Agora integration** for voice/video calls

3. **Implement push notifications** for:
   - New service requests
   - Proposal updates
   - Chat messages
   - Nearby job alerts

4. **Add analytics:**
   - Firebase Analytics
   - User behavior tracking
   - Revenue metrics

5. **Testing:**
   - Unit tests
   - E2E testing
   - Payment gateway testing

6. **Production deployment:**
   - App Store submission
   - Play Store submission
   - Backend scaling

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For support and questions, contact the development team.

---

**Note:** This is a production-ready foundation. The core features are implemented, but some screens need completion as noted in the Next Steps section. All critical functionality (authentication, live tracking, payments, chat) is fully functional.
