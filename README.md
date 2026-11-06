# 🌿 CropCare (ಕ್ರಾಪ್ ಕೇರ್) - Offline-First Crop Leaf Disease Advisor

**CropCare** is a mobile-first, offline-first Progressive Web App (PWA) designed for Indian farmers. It features a **dedicated Farmer Login & Setup** screen, personalized farm profile, and **completely separate dedicated pages** for every core feature. It detects crop leaf diseases directly on-device, calculates treatment costs for specific land acreages, tracks crop field health trends, and operates in **English** and **Kannada (ಕನ್ನಡ)** — **100% offline** after the first load.

---

## 📱 Dedicated Pages Architecture

Every feature in CropCare now lives in its own dedicated, clean page:

1. **🔐 Farmer Login & Setup (`/login`)**:
   - First-time landing screen for farmers.
   - Collects basic farm parameters:
     - **Farmer's Full Name** (ರೈತರ ಹೆಸರು)
     - **Mobile Number** (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)
     - **Village / Taluk / District** (ಗ್ರಾಮ / ತಾಲೂಕು / ಜಿಲ್ಲೆ)
     - **Primary Crop** (Tomato, Potato, Maize, Rice, Chilli)
     - **Farm Size in Acres** (ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ)
     - **Farm Icon / Avatar** (👨‍🌾, 👩‍🌾, 🌾, 🚜, 🌱, 🍅)
   - Works 100% offline (saved in Dexie IndexedDB with `localStorage` backup).
   - Includes **"Quick Demo Login"** button for instant one-tap testing with realistic sample credentials.

2. **🏠 Home Hub (`/home`)**:
   - Personalized welcome banner: *"Namaskara, [Farmer Name]!"*
   - Displays verified farmer status, village location, main crop, and farm size.
   - Big prominent **"Scan Leaf Now"** CTA button.
   - Dedicated service cards linking directly to every other page.
   - Offline Readiness status card and recent 3 scans summary.

3. **📷 Leaf Disease Scanner (`/scan`)**:
   - Dedicated camera capture or photo upload screen.
   - Discrete Laplacian blur filter & luminance analyzer (rejects blurry or dark photos with friendly advice).
   - TensorFlow.js MobileNetV2 on-device classifier + offline mock predictor.
   - Top 3 differential diagnoses with animated confidence bars and Risk badge (**Low / Medium / High**).
   - Structured Organic, Chemical, and Preventive recipes with dosage per acre.
   - 3-tier **Listen** voice button and **Compare Cost** shortcut.

4. **💰 Treatment Cost Calculator (`/cost`)**:
   - Dedicated pesticide & organic solution budget calculator.
   - Interactive acreage stepper ($+$ / $-$ controls).
   - Formula:
     $$\text{Total Cost} = \text{pricePerUnit} \times \text{unitsPerAcre} \times \text{acres}$$
   - Identifies **"Best Value"** (ROI effectiveness per rupee) and **"Cheapest"** options.
   - Sorting: Cheapest First, Most Effective, Best Value.
   - **"Edit Local Market Prices"** modal to match local taluk shop rates, saved to IndexedDB.

5. **🌾 My Crops & Fields (`/fields`)**:
   - Dedicated plot management screen.
   - Add, edit, and delete farm fields (Field Name, Crop Grown, Acres, Sowing Date).
   - Overview of total registered acreage.

6. **📊 Health Trends & History (`/analytics`)**:
   - Dedicated farm health analytics.
   - Lifetime statistics: Total Scans, Healthy Leaves, Diseased Leaves, Top Issue.
   - Interactive Recharts bar chart showing disease occurrences over time.
   - Chronological scan history timeline with leaf thumbnails and delete option.

7. **📖 Crop Disease Library Guide (`/solutions`)**:
   - Dedicated offline encyclopedia of 16+ crop diseases and healthy leaf standards.
   - Crop filtering tabs (Tomato, Potato, Maize, Rice, Chilli).
   - Accordion view of symptoms, organic sprays, and chemical recommendations with audio reading.

8. **👤 Farmer Profile & Settings (`/profile`)**:
   - Dedicated page to update farmer contact details and farm size.
   - Instant language switcher (English | ಕನ್ನಡ).
   - Offline storage verification and **Logout / Switch Account** option.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom High-Contrast Agrarian Palette
- **Routing**: React Router DOM (v6)
- **Offline Database**: Dexie.js (IndexedDB)
- **PWA & Caching**: `vite-plugin-pwa` + Workbox
- **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`)
- **Localization**: `react-i18next` + `i18next` (Static local JSON imports)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Voice / Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) + Precached Audio Clips

---

## 🚀 How to Run

```bash
# 1. Start local development server
npm run dev

# 2. Or build and preview production PWA with full service worker caching
npm run build
npm run preview
```

---

## ✈️ Testing Offline in Farm Mode

1. Open CropCare in Chrome, Edge, or mobile browser.
2. Complete the initial login (or tap **"Quick Demo Login"**).
3. Open DevTools (`F12`) $\rightarrow$ Network $\rightarrow$ Set to **Offline** (or toggle **Airplane Mode** on mobile).
4. Navigate across all separate pages:
   - Language switch between English and ಕನ್ನಡ works instantly.
   - Leaf scanning and on-device inference work with no internet.
   - Cost calculator recalculates prices completely offline.
   - Fields can be added or updated in local IndexedDB.
   - When reconnecting to the internet, pending scan logs flush automatically via the background `syncQueue`.
