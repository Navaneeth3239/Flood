# Smart Flood Monitoring and Early Warning System

A responsive, high-contrast, accessible web frontend for flood monitoring, hydrological risk visualization, automated threshold alerts, AI predictions, and emergency response operations.

---

## 🌊 Overview & Key Capabilities

- **Real-Time Hydrometric Telemetry**: Live streams of water level, precipitation intensity, soil moisture, temperature, humidity, and flow rate with WebSocket connectivity and automatic reconnect with exponential backoff.
- **Strict Data-Honesty Protocols**: Persistent **DEMO DATA** badges, simulated flood boundary markers, non-fabricated emergency numbers and official directives, and "No data" placeholders (never deceptive 0s).
- **Interactive Geospatial Inundation Map**: Leaflet + OpenStreetMap engine rendering colored risk station markers, GeoJSON risk zones, and community incident reports.
- **AI Hydrological Prediction**: Multi-variable machine learning forecast tool evaluating contributing factors (SHAP attribution) and model confidence (shown only when calibrated and supplied by backend).
- **3D Basin Topography (Three.js WebGL)**: Interactive digital elevation mesh with orbit controls, elevation color ramp, station pins, and water simulation level slider.
- **Multispectral Satellite Imagery**: Before/after flood extent comparison with interactive slider, zoom/pan controls, and observation limitation disclaimers (cloud cover, SAR resolution).
- **Multilingual Localization**: Full support for English, Tamil (தமிழ்), and Hindi (हिन्दी) with persistent preference and typography support (Noto Sans Tamil and Noto Sans Devanagari).
- **Community Field Incidents & Emergency Center**: Validated incident reporting form, triage queue, official disaster contacts, and government safety directives.
- **Telemetry System Health & Local Buffering**: Hardware sensor fault tracking, data gap analysis, communication loss detection, and local buffer synchronization.

---

## 📁 Modular Project Structure

```text
flood2/
├── public/
│   └── favicon.svg             # Application favicon
├── src/
│   ├── api/                    # Centralized API client & WebSocket service
│   │   ├── client.ts           # Typed API client supporting both live endpoints & mock dataset
│   │   ├── websocket.ts        # Native WebSocket client with reconnect & backoff
│   │   └── index.ts
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Badges, spinners, empty/error states, warnings
│   │   │   ├── ConnectionStatusIndicator.tsx
│   │   │   ├── DemoBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── StaleDataWarning.tsx
│   │   ├── dashboard/          # Dashboard-specific KPI cards
│   │   │   └── KpiCard.tsx
│   │   └── layout/             # Sidebar, TopBar, and AppLayout shell
│   │       ├── AppLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── TopBar.tsx
│   ├── hooks/                  # Custom React hooks (theme context & storage)
│   │   └── useTheme.tsx
│   ├── i18n/                   # Internationalization engine
│   │   ├── locales/
│   │   │   ├── en.json         # English translations
│   │   │   ├── ta.json         # Tamil translations (தமிழ்)
│   │   │   └── hi.json         # Hindi translations (हिन्दी)
│   │   └── index.ts
│   ├── mocks/                  # Centralized, single-source demo dataset
│   │   ├── alerts.ts           # Realistic threshold alerts
│   │   ├── assistant.ts        # Grounded RAG QA responses with citations
│   │   ├── emergencyData.ts    # Official contacts & safety directives
│   │   ├── health.ts           # Subsystem health diagnostics & buffer stats
│   │   ├── incidents.ts        # Community incident reports
│   │   ├── predictions.ts      # Multi-horizon ML prediction models
│   │   ├── readings.ts         # 24-hour time-series sensor telemetry
│   │   ├── riskZones.ts        # GeoJSON inundation polygons (simulated)
│   │   ├── satellite.ts        # Satellite imagery metadata & comparison pairs
│   │   ├── stations.ts         # Hydrometric hardware station registry
│   │   ├── terrain.ts          # 3D elevation heightmap grid data
│   │   └── index.ts
│   ├── pages/                  # Route views (code-split & lazy-loaded)
│   │   ├── AlertsPage.tsx      # /alerts
│   │   ├── AssistantPage.tsx   # /assistant
│   │   ├── DashboardPage.tsx   # /
│   │   ├── EmergencyPage.tsx   # /emergency
│   │   ├── LiveMonitoringPage.tsx # /live
│   │   ├── MapPage.tsx         # /map (lazy)
│   │   ├── NotFoundPage.tsx    # 404 handler
│   │   ├── PredictionPage.tsx  # /prediction
│   │   ├── ReportsPage.tsx     # /reports
│   │   ├── SatellitePage.tsx   # /satellite (lazy)
│   │   ├── StationsPage.tsx    # /stations
│   │   ├── SystemHealthPage.tsx # /health
│   │   └── TerrainPage.tsx     # /terrain (lazy)
│   ├── types/                  # Shared TypeScript data contracts
│   │   └── index.ts
│   ├── utils/                  # Formatting, CSV export, date & leaflet helpers
│   │   ├── cn.ts
│   │   ├── date.ts
│   │   ├── exportCsv.ts
│   │   ├── formatters.ts
│   │   └── leafletIcons.ts
│   ├── App.tsx                 # React Router v6 routing tree with Suspense
│   ├── index.css               # Tailwind CSS & typography styling
│   ├── main.tsx                # React DOM root mounting
│   └── vite-env.d.ts           # Environment variable TypeScript typing
├── .env.example                # Sample environment configuration
├── index.html                  # HTML entry with preloaded Noto Sans fonts & Leaflet CSS
├── package.json                # Project dependencies and build scripts
├── postcss.config.js           # PostCSS Tailwind plugin config
├── tailwind.config.js          # Tailwind theme & severity color palette
├── tsconfig.json               # TypeScript compiler configuration
└── tsconfig.node.json          # Vite node compiler options
```

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology |
|---|---|
| **Core Framework** | React 18.3.1 + TypeScript 5.6 |
| **Bundler & Dev Server** | Vite 5.4.11 |
| **Styling & UI** | Tailwind CSS 3.4 (WCAG AA High-Contrast Dark/Light theme) |
| **Navigation** | React Router v6.28 |
| **Charts & Hydrographs** | Recharts 2.13 (Memoized, optimized data points) |
| **Maps & GIS** | Leaflet 1.9.4 + react-leaflet 4.2.1 + OpenStreetMap tiles |
| **3D Topography Canvas** | Three.js 0.170 + @react-three/fiber 8.17 + @react-three/drei 9.117 |
| **Icons** | Lucide React |
| **Internationalization** | i18next 23.16 + react-i18next 15.1 + LanguageDetector (EN, தமிழ், हिन्दी) |
| **Realtime Telemetry** | Native WebSocket client with exponential backoff & mock stream simulator |

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (v18.x, v20.x, or v22.x/v24.x)
- npm (v9.x+)

### Installation
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🔄 Toggling Mock vs Live Data

The application switches cleanly between live backend services and the bundled demonstration dataset through the `.env` configuration file:

```env
# Set to 'true' to use the comprehensive mock dataset in src/mocks/
VITE_USE_MOCK_DATA=true

# Centralized API Base URL (used when VITE_USE_MOCK_DATA=false)
VITE_API_BASE_URL=http://localhost:8000/api

# Native WebSocket URL for live readings, alerts, and station statuses
VITE_WS_URL=ws://localhost:8000/ws

# Stale data threshold in minutes
VITE_STALE_DATA_THRESHOLD_MINUTES=15
```

When `VITE_USE_MOCK_DATA=true`:
- All cards, charts, maps, and pages display a prominent, persistent **DEMO DATA** badge.
- Telemetry simulation emits periodic realistic sensor variations.
- Simulated polygons and 3D terrain meshes are explicitly badged **"Illustrative / simulated"**.

When `VITE_USE_MOCK_DATA=false`:
- The application connects to `VITE_API_BASE_URL` and `VITE_WS_URL`.
- The top bar displays a **LIVE SENSORS** verification badge.

---

## 📊 Feature Status Matrix

| Page / Capability | Route | Status | Notes |
|---|---|---|---|
| **Dashboard** | `/` | **Implemented** | 6 KPI cards, hydrograph with alert thresholds, rainfall chart, mini Leaflet map, recent alerts feed, telemetry battery status. |
| **Live Monitoring** | `/live` | **Implemented** | Card view & table view toggles, basin filters, live trend arrows, sensor health indicators, real vs demo badges, WebSocket stream. |
| **Flood Risk Map** | `/map` | **Implemented** | Leaflet + OpenStreetMap, risk colored markers, GeoJSON simulated inundation zones, layer toggles, popup inspections. |
| **AI Flood Prediction** | `/prediction` | **Implemented** | Horizon selector (3h to 48h), SHAP contributing factors bar chart, conditional confidence display, disclaimer, model down fallback. |
| **3D Basin Topography** | `/terrain` | **Implemented** | Three.js WebGL elevation mesh, elevation color ramp, dynamic flood simulation water level slider, OrbitControls. |
| **Satellite Imagery** | `/satellite` | **Implemented** | Sentinel-2 / RISAT-1A SAR metadata, interactive Before/After comparison slider, zoom controls, optical observation notice. |
| **Alerts & Warnings** | `/alerts` | **Implemented** | Severity & status filters, acknowledge and resolve state updates, dispatch preferences panel (SMS, Email, WebPush). |
| **Monitoring Stations** | `/stations` | **Implemented** | Station registry list, 24-hour reading history chart, telemetry hardware diagnostics, validated add/edit station form. |
| **Historical Reports** | `/reports` | **Implemented** | 7d/30d/90d filter, station selector, cumulative rainfall, peak water levels, and one-click CSV export. |
| **Emergency Response** | `/emergency` | **Implemented** | Field incident triage queue, verified/under-review badges, official emergency contacts, government safety directives, incident report form. |
| **AI Flood Assistant** | `/assistant` | **Implemented** | Streaming responses, language-aware (EN/TA/HI), source citations from disaster manuals, strict anti-hallucination disclaimer. |
| **System Health & Offline** | `/health` | **Implemented** | Diagnostic tree, sensor fault counts, offline local buffer queue status, manual buffer sync action. |
| **404 Route** | `*` | **Implemented** | Accessible not-found screen with dashboard return navigation. |
| **Multilingual i18n** | All | **Implemented** | English, Tamil (தமிழ்), Hindi (हिन्दी) with persistent state and Noto Sans typography. |
| **Dark / Light Theme** | All | **Implemented** | WCAG AA accessible contrast, localStorage persistence, header toggle button. |

---

## 🧪 Testing Steps to Verify Each Page

### 1. Dashboard (`/`)
- Verify the 6 KPI cards display accurate totals (Total Stations, Online %, Active Warnings, High-Risk Locations, Average Rainfall, Peak Water Level).
- Select different stations from the dropdown above the hydrograph; verify the water elevation area chart and warning threshold reference lines update dynamically.
- Check the mini risk map: click on station markers to verify popup inspection details.
- Verify the persistent "DEMO DATA" badge is visible in the header and cards.

### 2. Live Monitoring (`/live`)
- Toggle between **Card View** and **Table View**.
- Use the search bar to filter by station name (e.g., "Yamuna" or "Adyar").
- Select a specific basin from the dropdown (e.g., "Kaveri Basin").
- Watch the live telemetry: every 5 seconds, an incoming WebSocket reading updates the station values and displays a pulsing indicator.
- Verify missing sensor values render as "No data" (not 0).

### 3. Flood Risk Map (`/map`)
- In the top-right floating layer control, toggle **Monitoring Stations**, **Risk Zones & Floodplains**, and **Community Incidents**.
- Click on any GeoJSON polygon zone: verify the popup states `⚠️ Illustrative / simulated boundary`.
- Click on any station marker: check the bottom sliding inspection card.

### 4. AI Prediction (`/prediction`)
- Select "Yamuna - Old Railway Bridge" and switch between **3h**, **6h**, **12h**, **24h**, and **48h** forecast horizons.
- Notice that for the 12h horizon, model confidence is intentionally omitted from the API—verify that the UI strictly hides the metric and displays an explanatory data-honesty note.
- Verify the SHAP contributing factors bar chart renders percentages correctly.

### 5. 3D Terrain (`/terrain`)
- Left-click and drag inside the canvas to rotate the terrain in 3D.
- Right-click and drag to pan; mouse wheel to zoom in and out.
- Drag the **Water Simulation Level** slider to watch the translucent water plane rise and submerge low-lying valleys and station markers.
- Verify the notice badge displays "Illustrative terrain: Simulated digital elevation model (DEM)".

### 6. Satellite Imagery (`/satellite`)
- Select different satellite overpass scenes from the left panel.
- Drag the central slider horizontally to compare the pre-flood reference baseline against the peak inundation extent.
- Click the `+` and `-` zoom buttons to inspect urban runoff detail.
- Verify the sensor limitations notice detailing cloud cover constraints is prominently displayed.

### 7. Alerts (`/alerts`)
- Filter alerts by severity ("Danger", "Warning", "Watch") and status ("Active", "Acknowledged", "Resolved").
- Click **Acknowledge** on an active alert; verify its status badge turns amber and records an acknowledgement timestamp.
- Click **Resolve** to close out the alert.
- Update notification channel preferences and submit to verify state persistence.

### 8. Monitoring Stations (`/stations`)
- Click **Register New Station** to open the creation form.
- Test validation: enter invalid coordinates (e.g., Latitude 120) or non-ascending thresholds; verify clear inline validation messages appear.
- Save a valid station and verify it immediately appears in the station registry.
- Inspect the 24-hour reading history chart for any selected station.

### 9. Historical Reports (`/reports`)
- Select date range ("7 Days", "30 Days", "90 Days") and specific station filter.
- Click **Export Filtered CSV**; verify a `.csv` file downloads immediately with ISO timestamps and hydrometric column headers.

### 10. Emergency Response (`/emergency`)
- Click **Submit Field Incident Report**; fill in location, title, and priority, then submit. Verify it appears at the top of the Community Reports Queue with status "Unverified".
- Verify that emergency contacts show official badges, and if contacts are unavailable, "Not configured" is shown.
- Browse the official disaster response guidelines (Pre-flood, During flood, Post-flood recovery).

### 11. AI Flood Assistant (`/assistant`)
- Click one of the quick starter prompt buttons (e.g., "What are the official evacuation protocols if river levels reach Warning stage?").
- Observe the streaming word-by-word response.
- Inspect the verified source citations (NDMA Manual, CWC Operational Protocols) beneath the reply.
- Type an unrelated prompt; observe that the assistant explicitly adheres to the data honesty rule: it admits when no verified sources match rather than inventing facts.

### 12. System Health & Offline Simulation (`/health`)
- Inspect the sensor fault breakdown and edge buffering queue stats.
- Click **Force Buffer Sync**; watch the pending queue flush into the synced counter.
- **WebSocket Disconnect / Offline Test**:
  1. Click the connection pill in the top bar ("Live WS").
  2. Select **"Simulate Network Offline (Test Mode)"**.
  3. Notice the status immediately changes to "WS Offline" in red with a disconnected icon.
  4. Open the menu again and select **"Force Connect / Resume Stream"**; observe the status transitions to "Reconnecting..." and then back to "Live WS".

### 13. Multilingual Verification
- Click the language switcher in the top bar and toggle between **EN**, **தமிழ்**, and **हिन्दी**.
- Verify all navigation links, headers, statuses, and metric cards update to the chosen language.
- Inspect font rendering to ensure Tamil and Hindi typography renders clearly with proper line heights.
