# FixKar Production Setup Guide

## 🔐 1. SHA-256 Fingerprint Setup for Firebase

### Generate SHA-256 Fingerprint

**Option A: Debug Keystore (for testing)**

```powershell
cd c:\fixkar\android
.\gradlew signingReport
```

Look for `SHA-256` under `Variant: debug`

**Option B: Release Keystore (for production)**

```powershell
keytool -list -v -keystore your-release.keystore -alias your-alias
```

### Add to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Project Settings** (gear icon)
3. Scroll to **Your apps** → Select Android app
4. Click **Add fingerprint**
5. Paste your **SHA-256** fingerprint
6. Also add **SHA-1** fingerprint
7. Click **Save**
8. **Download** updated `google-services.json`
9. Replace `android/app/google-services.json` with downloaded file

---

## 🛡️ 2. Play Integrity API Setup

### Enable Play Integrity API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Go to **APIs & Services** → **Library**
4. Search **"Play Integrity API"**
5. Click **Enable**

### Register App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app or select existing
3. Go to **Setup** → **App integrity**
4. Link to your Firebase project
5. Upload your app to **Internal testing** track

### Configure Firebase App Check

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **App Check** → **Apps**
3. Select your Android app
4. Choose **Play Integrity** provider
5. Register the app

---

## ☁️ 3. Deploy Cloud Functions

### Install Dependencies

```powershell
cd c:\fixkar\functions
npm install
```

### Deploy Functions

```powershell
cd c:\fixkar
firebase deploy --only functions
```

### Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **Functions**
3. Verify all functions are deployed:
   - `onNewProposal`
   - `onProposalUpdated`
   - `onBookingUpdated`
   - `onNewMessage`
   - `onKYCUpdated`
   - `onNewServiceRequest`

---

## 🔑 4. EAS Secrets Configuration

### Set Up EAS Secrets

```powershell
# Login to EAS
eas login

# Set secrets for production
eas secret:create --name GOOGLE_MAPS_API_KEY --value "YOUR_GOOGLE_MAPS_API_KEY"
eas secret:create --name FIREBASE_API_KEY --value "YOUR_FIREBASE_API_KEY"
eas secret:create --name AGORA_APP_ID --value "YOUR_AGORA_APP_ID"
```

### Use in app.json (eas.json)

Update `eas.json` to use secrets:

```json
{
  "build": {
    "production": {
      "env": {
        "GOOGLE_MAPS_API_KEY": "@GOOGLE_MAPS_API_KEY",
        "FIREBASE_API_KEY": "@FIREBASE_API_KEY",
        "AGORA_APP_ID": "@AGORA_APP_ID"
      }
    }
  }
}
```

---

## ✅ 5. Verification Checklist

### Phone Auth

- [ ] SHA-256 added to Firebase
- [ ] Play Integrity API enabled
- [ ] App registered in Play Console
- [ ] Test with physical device (not emulator)
- [ ] OTP arrives via SMS (not Chrome)

### Push Notifications

- [ ] Cloud Functions deployed
- [ ] FCM token saved in Firestore
- [ ] Test notification from Firebase Console
- [ ] Notifications work in foreground
- [ ] Notifications work in background

### Production Build

- [ ] EAS Secrets configured
- [ ] Production build created: `eas build --platform android --profile production`
- [ ] App uploaded to Play Console
- [ ] Test on multiple devices

---

## 🚀 Build Commands

### Development

```powershell
npx expo start -c
```

### Preview Build (for testing)

```powershell
eas build --platform android --profile preview
```

### Production Build

```powershell
eas build --platform android --profile production
```

### Submit to Play Store

```powershell
eas submit --platform android
```
