# FloodWatch Community Web Application
**Smart Flood Monitoring and Early Warning System**

A resilient, mobile-first React web application designed for community flood hazard reporting and real-time early warnings, connected directly to the **Smart Flood Monitoring System** central Emergency Response dashboard.

---

## 🌐 Features & Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with dark mode support & mobile-first responsive layout (includes desktop mobile mockup toggle)
- **Map & Geolocation**: Leaflet + OpenStreetMap (100% free, zero paid API keys needed, draggable map pin and interactive hazard callouts)
- **Image Handling**: HTML5 Canvas client-side compression (max 1280px, 70% JPEG quality, automatic EXIF cleanup)
- **Offline-First Synchronization**:
  - `localStorage` offline queue with client-generated UUID idempotency keys
  - Auto-sync on network reconnect via `window.addEventListener('online')`
  - Resumable photo upload (never re-uploads images that already succeeded)
- **Multilingual (i18n)**: English, Tamil (தமிழ்), Hindi (हिन्दी), and Malayalam (മലയാളം) with 100% key parity
- **Data Honesty & Safety**:
  - Unverified status by default until confirmed by responders in the web dashboard
  - Prominent emergency disclaimer notice on Home & Report Form
  - Isolated mock data in `src/mocks/` with visible `DEMO DATA` badge when `VITE_USE_MOCK_DATA=true`
  - Emergency numbers loaded only from API/cache, fallback to "Not configured" if unavailable

---

## 📁 Project Structure

```
mobil app/
├── index.html                 # Mobile-optimized HTML5 entry with Leaflet styles
├── package.json               # Dependencies, scripts (dev, build, preview, i18n:check)
├── vite.config.ts             # Vite configuration with path aliases (@/* -> src/*)
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind styling config
├── postcss.config.js          # PostCSS autoprefixer
├── .env.example               # Environment variables template
├── .env                       # Local environment configuration
├── scripts/
│   └── check-i18n.js          # CI script to verify 100% key parity across languages
└── src/
    ├── api/                   # Centralized Axios client, retries & endpoints
    │   ├── client.ts          # submitIncident, uploadPhoto, getAlerts, getSafetyInfo
    │   └── index.ts
    ├── components/
    │   ├── common/            # CustomButton, DemoBadge, DisclaimerBanner, StatusBadge,
    │   │                      # SeverityBadge, ConnectivityIndicator, EmptyState, etc.
    │   └── map/
    │       └── LeafletMap.tsx # Interactive OpenStreetMap Leaflet component
    ├── features/
    │   ├── notifications/     # Browser Web Notification service
    │   └── sync/
    │       └── syncManager.ts # Offline-first sync manager & background upload engine
    ├── i18n/
    │   ├── index.ts           # i18next configuration & language switcher
    │   └── locales/           # en.json, ta.json, hi.json, ml.json (100% synchronized)
    ├── mocks/                 # Simulated incidents, alerts & emergency contacts
    ├── screens/
    │   ├── HomeScreen.tsx         # Emergency CTA, active alerts, recent reports, disclaimer
    │   ├── OnboardingScreen.tsx   # Language picker & permission explanation
    │   ├── ReportFormScreen.tsx   # 6-step one-handed wizard with map pin & photo compression
    │   ├── MyReportsScreen.tsx    # Filterable list (all/pending/unverified/review/verified)
    │   ├── ReportDetailScreen.tsx # Photo gallery, Leaflet map, timeline & edit/withdraw
    │   ├── NearbyMapScreen.tsx    # Fullscreen hazard map with severity color + icons
    │   ├── SafetyInfoScreen.tsx   # Official guidance & tap-to-call emergency helplines
    │   └── SettingsScreen.tsx     # Language, alert radius, data wipe & mode indicator
    ├── storage/               # LocalStorage persistence (reports queue, cache, settings, UUID)
    ├── theme/                 # Accessible color palettes & severity definitions
    ├── types/                 # Shared TypeScript models
    └── utils/                 # UUID generator, canvas image compressor & text sanitizers
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd "d:\Web desisning\SCMS\mobil app"
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
- `VITE_API_BASE_URL`: Base URL of the central emergency API (default `http://localhost:3000`).
- `VITE_USE_MOCK_DATA`: Set to `true` for standalone testing with demo data, or `false` for live backend.

### 3. Start Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:5174/` (or port assigned by Vite).

### 4. Build for Production
```bash
npm run build
```
Generates optimized static web assets in `dist/`.

### 5. Verify Language Parity
```bash
npm run i18n:check
```
Confirms 100% translation key parity across English, Tamil, Hindi, and Malayalam.

---

## 🧪 Testing Steps

1. **Submit a Report Online**:
   - Click **"Report Flood Problem"** on the home screen.
   - Choose problem type (*Flooded Road*), severity (*High*), and pin location on the Leaflet map.
   - Attach photos (compressed to max 1280px via HTML5 Canvas).
   - Click **"Submit Report"**. Status shows **"Unverified"** with sync status **"Delivered to server"**.
2. **Submit Offline & Auto-Sync**:
   - Disconnect network or switch browser DevTools Network tab to **Offline**.
   - Notice the top indicator displays **"OFFLINE"**.
   - Submit a report: saved locally in `localStorage` under **"Pending Upload"**.
   - Switch back to **Online**: `SyncManager` auto-syncs the report to the server in the background.
3. **Edit / Withdraw Report**:
   - Open **"My Reports"** -> click into your report.
   - While status is **Unverified**, you can edit the description or withdraw the report.
   - Once responders change status to **Under Review** or **Verified**, editing is automatically disabled.
4. **Desktop Phone Mockup Toggle**:
   - On desktop screens, use the **"Phone Mockup / Full Width"** toggle in the top bar to preview the app inside a sleek mobile device frame or as a full responsive web app.
