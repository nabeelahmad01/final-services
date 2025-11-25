# Service Marketplace App - Setup Guide

## Quick Start (Urdu/Roman Urdu)

### 1. Pehle ye Install karein:
```bash
cd service-marketplace-app
npm install
```

### 2. Firebase Setup (Zaroori!):
1. [https://console.firebase.google.com](https://console.firebase.google.com) pe jaye
2. Naya project banaye
3. Ye services enable karein:
   - Authentication
   - Firestore Database  
   - Realtime Database
   - Cloud Storage
4. `.env.example` ko copy kar ke `.env` naam se save karein
5. Firebase ki details `.env` file mein add karein

### 3. Google Maps API Key:
1. [https://console.cloud.google.com](https://console.cloud.google.com) pe jaye
2. Maps SDK enable karein
3. API key copy kar ke `.env` mein paste karein
4. `app.json` file mein bhi paste karein (ios aur android sections mein)

### 4. Payment Setup (Baad mein kar sakte hain):
- JazzCash merchant account chahiye
- EasyPaisa merchant account chahiye
- Pehle testing ke liye skip kar sakte hain

### 5. App Chalana:
```bash
# Expo server start karein
npm start

# Android phone pe chalane ke liye
npm run android

# iPhone pe chalane ke liye (Mac chahiye)
npm run ios
```

## Testing ke liye:
- Phone pe Expo Go app download karein
- QR code scan karein jo terminal mein dikhega
- App test karein!

## Zaroori Notes:
1. `.env` file banana na bhoolein (`.env.example` se copy karein)
2. Firebase credentials zaroori hain - bina iske app nahi chalegi
3. Google Maps key bhi zaroori hai tracking ke liye
4. Payment gateways baad mein setup kar sakte hain
5. Physical phone pe test karna behtar hai (emulator se)

## Admin Login:
Default admin password joki `.env` file mein set kiya ja sakta hai:
```
EXPO_PUBLIC_ADMIN_PASSWORD=admin123456
```

## Categories (Service Types):
1. Bike Mechanic
2. Car Mechanic
3. Plumber
4. Electrician
5. AC/Fridge Mechanic
6. Mobile Repair
7. Carpenter

## Diamond System:
- Har proposal bhejne ke liye 1 diamond lagta hai
- Mechanics diamonds khareed sakte hain JazzCash/EasyPaisa se
- Sample prices (change kar sakte hain):
  - 10 Diamonds = PKR 500
  - 25 Diamonds = PKR 1,000
  - 50 Diamonds = PKR 1,800
  - 100 Diamonds = PKR 3,200

## Help:
Agar koi issue aye to README.md file check karein detail instructions ke liye.
