# 📱 Expo Go سے Testing Guide / Testing with Expo Go

اس guide میں آپ کو step-by-step بتایا گیا ہے کہ کیسے اپنے Service Marketplace App کو Expo Go کے ذریعے test کریں۔

This guide provides step-by-step instructions on how to test your Service Marketplace App using Expo Go.

---

## ✅ ضروری چیزیں / Prerequisites

### 1. **Computer پر / On Computer:**
- ✓ Node.js (version 18 یا اوپر / or above)
- ✓ npm یا yarn
- ✓ Git (optional)

### 2. **Mobile Phone پر / On Mobile:**
- ✓ **Expo Go App** installed ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))
- ✓ Computer اور phone **same WiFi network** پر ہوں / on the same WiFi network

### 3. **API Keys Required:**
- Firebase Project (Authentication, Firestore, Realtime Database, Storage)
- Google Maps API Key (with Places API enabled)
- Agora App ID (for voice/video calls)
- Payment Gateway credentials (optional for testing)

---

## 🚀 Quick Start Steps

### **Step 1: Project Setup کریں / Setup Project**

```bash
# 1. Project folder میں جائیں / Navigate to project folder
cd c:\Users\jscob\Desktop\home\service-marketplace-app

# 2. Dependencies install کریں / Install dependencies
npm install

# 3. Environment file بنائیں / Create environment file
copy .env.example .env
```

### **Step 2: Environment Variables Configure کریں**

`.env` file کھولیں اور اپنی API keys ڈالیں:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Agora (Voice/Video Calls)
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Admin Password
EXPO_PUBLIC_ADMIN_PASSWORD=admin123456
```

> **نوٹ:** Payment gateway keys optional ہیں testing کے لیے

### **Step 3: Development Server Start کریں**

```bash
npm start
```

یا

```bash
npx expo start
```

**Server start ہونے کے بعد:**
- Terminal میں QR code دکھے گا
- URLs دکھیں گے (exp://192.168.x.x:8081)
- Metro bundler چل رہا ہوگا

### **Step 4: Mobile پر App Open کریں**

#### **Android Users:**
1. **Expo Go** app کھولیں
2. **"Scan QR Code"** button پر tap کریں
3. Computer screen پر دکھائے گئے **QR code** کو scan کریں
4. App automatically load ہونا شروع ہوگا

#### **iOS Users:**
1. **iPhone Camera** app کھولیں
2. QR code کی طرف point کریں
3. **"Open in Expo Go"** notification پر tap کریں
4. Expo Go میں app open ہوگا

---

## 🔧 Common Issues اور Solutions

### Issue 1: **QR Code Scan نہیں ہو رہا**
**Solution:**
```bash
# Tunnel mode use کریں
npx expo start --tunnel
```

### Issue 2: **"Network request failed" error**
**Solution:**
- یقینی بنائیں کہ phone اور computer **same WiFi** پر ہیں
- `.env` file میں Firebase config check کریں
- Firewall settings check کریں

### Issue 3: **Google Maps نہیں دکھ رہے**
**Solution:**
- Google Maps API key correct ہے؟
- Maps SDK for Android/iOS enabled ہے؟
- Places API enabled ہے؟

### Issue 4: **Firebase Authentication error**
**Solution:**
```bash
# Firebase console میں:
1. Authentication > Sign-in methods > Email/Password enable کریں
2. Firestore Database بنائیں (test mode میں start کر سکتے ہیں)
3. Realtime Database بنائیں
4. Storage setup کریں
```

---

## 📋 Testing Checklist

App test کرتے وقت یہ features check کریں:

### **Authentication:**
- [ ] Role Selection (Customer/Mechanic)
- [ ] Sign Up with Email
- [ ] Sign In
- [ ] Password Reset
- [ ] Profile Setup

### **Customer Features:**
- [ ] Location permissions
- [ ] Find nearby mechanics on map
- [ ] Book a service
- [ ] Track mechanic in real-time
- [ ] Chat with mechanic
- [ ] Voice call
- [ ] Complete booking
- [ ] Rate mechanic

### **Mechanic Features:**
- [ ] Go Online/Offline
- [ ] Receive booking requests
- [ ] Accept/Reject requests
- [ ] Navigate to customer
- [ ] Update booking status
- [ ] Chat with customer
- [ ] Complete service
- [ ] View earnings

---

## 🎯 Testing Tips

1. **دو phone یا emulator استعمال کریں:**
   - ایک customer role کے لیے
   - دوسرا mechanic role کے لیے

2. **Location testing:**
   - Expo Go میں mock location set کر سکتے ہیں
   - یا actual location use کریں

3. **Real-time features:**
   - Chat اور tracking کو test کرنے کے لیے دونوں users online ہونے چاہیں

4. **Firebase Console:**
   - Data check کرنے کے لیے Firebase console open رکھیں
   - Real-time updates دیکھیں

---

## 🔄 App Reload کرنے کے طریقے

### **Phone پر:**
- Shake your device اور **"Reload"** select کریں

### **Terminal میں:**
- Press `r` - Reload app
- Press `m` - Toggle menu
- Press `j` - Open debugger

---

## 📞 Support

اگر کوئی مسئلہ ہو تو:
1. Terminal میں error messages check کریں
2. Expo Go app میں error screen دیکھیں
3. Firebase Console میں logs دیکھیں

---

## 🚀 Next Steps

Testing successful ہونے کے بعد:
1. Build APK/IPA for testing on more devices
2. Submit to App Store / Play Store
3. Setup production Firebase
4. Configure production payment gateways

---

**Happy Testing! 🎉**
