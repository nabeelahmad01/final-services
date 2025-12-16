# FixKar - Google Play Store Submission Guide

## 📱 App Information (Copy-Paste Ready)

### Basic Info

| Field                | Value                   |
| -------------------- | ----------------------- |
| **App Name**         | FixKar - فکس کر         |
| **Package Name**     | com.fixkar.app          |
| **Version**          | 1.0.0                   |
| **Version Code**     | 1                       |
| **Default Language** | English (United States) |
| **Category**         | House & Home / Tools    |

---

## 📝 Store Listing Content

### Short Description (80 characters max)

```
Book trusted mechanics & home service providers. Fast, reliable doorstep service!
```

### Full Description (4000 characters max)

```
🔧 FixKar - Pakistan's #1 On-Demand Service Marketplace

Book verified mechanics and service providers for all your home and vehicle needs. From bike repairs to AC servicing, plumbing to electrical work - get instant help at your doorstep!

✨ KEY FEATURES:

🏍️ BIKE & CAR MECHANICS
• Instant roadside assistance
• Engine repairs & servicing
• Battery, tyre & oil changes
• Real-time mechanic tracking

🏠 HOME SERVICES
• Plumber - Leaks, pipes, bathroom fittings
• Electrician - Wiring, switches, appliances
• AC & Fridge - Installation, repair, gas refill
• Carpenter - Furniture repair & installation
• Mobile Repair - Screen, battery, software

💡 WHY CHOOSE FIXKAR?

✅ VERIFIED PROFESSIONALS
All service providers are KYC verified with background checks

✅ TRANSPARENT PRICING
Get multiple quotes, compare prices, and choose the best offer

✅ REAL-TIME TRACKING
Track your mechanic's location as they come to you

✅ SECURE PAYMENTS
Pay via JazzCash, Easypaisa, or cash on service

✅ 24/7 AVAILABILITY
Emergency services available round the clock

✅ RATINGS & REVIEWS
Read genuine reviews from real customers

📞 IN-APP CALLING & CHAT
Communicate directly with service providers without sharing phone numbers

🎯 HOW IT WORKS:

1️⃣ Select your service category
2️⃣ Describe your issue & upload photos
3️⃣ Receive quotes from nearby professionals
4️⃣ Choose the best offer & confirm booking
5️⃣ Track arrival & get service at your doorstep
6️⃣ Pay securely & rate your experience

🌟 BECOME A SERVICE PROVIDER
Are you a skilled mechanic or technician? Join FixKar and:
• Get instant job requests in your area
• Set your own prices
• Earn more with our diamond system
• Build your reputation with reviews

📍 Available across Pakistan - Karachi, Lahore, Islamabad, Rawalpindi, Multan, Faisalabad, and more!

Download FixKar now and never worry about home or vehicle repairs again!

فکس کر - پاکستان کی نمبر 1 سروس ایپ
گھر بیٹھے مستری بلائیں!
```

---

## 🖼️ Required Graphics (YOU NEED TO CREATE)

### App Icon

- **Size:** 512 x 512 px
- **Format:** PNG (32-bit, no transparency)
- **Location:** Already exists at `assets/icon.png`

### Feature Graphic

- **Size:** 1024 x 500 px
- **Format:** JPEG or PNG
- **Content:** FixKar logo + tagline + mechanic/service imagery

### Screenshots (Minimum 2, Maximum 8)

- **Phone:** 16:9 or 9:16 aspect ratio
- **Min dimensions:** 320px, Max: 3840px
- **Required screenshots:**
  1. Home screen with service categories
  2. Service request flow
  3. Proposals/quotes from mechanics
  4. Real-time tracking
  5. Chat interface
  6. Profile/ratings

---

## 🏷️ Categories & Tags

### Primary Category

**House & Home** or **Tools**

### Tags (up to 5)

1. mechanic
2. home services
3. plumber
4. electrician
5. repair

---

## 📋 Content Rating Questionnaire Answers

| Question          | Answer               |
| ----------------- | -------------------- |
| Violence          | No                   |
| Sexual Content    | No                   |
| Profanity         | No                   |
| Drugs             | No                   |
| Gambling          | No                   |
| User Interaction  | Yes (chat feature)   |
| Shares Location   | Yes                  |
| Digital Purchases | Yes (diamond system) |

**Expected Rating:** Everyone (E)

---

## 📧 Contact Details

| Field                  | Value                      |
| ---------------------- | -------------------------- |
| **Developer Name**     | Your Company Name          |
| **Email**              | support@fixkar.app         |
| **Website**            | https://fixkar.app         |
| **Privacy Policy URL** | https://fixkar.app/privacy |

---

## 🔐 Privacy Policy (Required)

You MUST have a privacy policy URL. Create one at:

- [FreePrivacyPolicy.com](https://www.freeprivacypolicy.com)
- Or host on your website
---

## 📤 Upload Steps

### Step 1: Create App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - App name: `FixKar - فکس کر`
   - Default language: `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`
4. Accept declarations → **Create app**

### Step 2: Set Up App

Complete these sections in the dashboard:

1. **Privacy policy** - Add your URL
2. **App access** - Select "All functionality available without restrictions"
3. **Ads** - Select "No, app doesn't contain ads"
4. **Content rating** - Complete questionnaire
5. **Target audience** - Select "18 and over"
6. **News apps** - Select "No"
7. **COVID-19 apps** - Select "No"
8. **Data safety** - Fill in data collection form

### Step 3: Store Listing

1. Go to **Main store listing**
2. Fill Short description & Full description
3. Upload App icon, Feature graphic, Screenshots
4. Select Category & Contact details
5. **Save**

### Step 4: Internal Testing (for OTP to work)

1. Go to **Testing** → **Internal testing**
2. Click **"Create new release"**
3. Upload your `.aab` file
4. Add release notes: `Initial release v1.0.0`
5. **Review and start rollout**

### Step 5: Add Testers

1. In Internal testing → **Testers** tab
2. Create email list with your email
3. Copy the **Opt-in URL**
4. Open URL in browser → Accept invitation
5. Download app from Play Store link

---

## ⏱️ Timeline

| Action                    | Time      |
| ------------------------- | --------- |
| Upload AAB                | 5 mins    |
| Store listing             | 30 mins   |
| Content rating            | 10 mins   |
| Data safety               | 15 mins   |
| Internal testing approval | 1-2 hours |
| **Total**                 | ~2 hours  |

---

## 🚀 After Successful Upload

Once app is in Internal Testing:

1. Install from Play Store link
2. OTP will work **without Chrome redirect**! 🎉
3. Play Integrity will verify the app automatically

---

## Build Command (Run This First!)

```powershell
npx eas build --platform android --profile production
```

This creates the `.aab` file needed for Play Store upload.
