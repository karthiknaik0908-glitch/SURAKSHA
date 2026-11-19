# SURAKSHA (ಸುರಕ್ಷಾ)
### AI-Powered Multi-Disaster Prediction & Offline Emergency Rescue Coordination Network

SURAKSHA is a comprehensive, production-grade emergency management web application designed for national-level disaster response coordination, early warnings, and localized emergency rescue triage with offline capability.

---

## 🌟 Core System Capabilities

### 1. Multi-Disaster Monitoring & Incident Feed
Supports tracking across all 6 disaster categories:
- **🌊 Flood** (Hydrological monitoring, river crests, dam discharge alerts)
- **⛰️ Landslide** (Geotechnical monitoring, slope slip thresholds, rainfall saturation)
- **🏚️ Earthquake** (Seismic incident reporting, structural triage)
- **🌀 Cyclone** (Coastal storm surge warnings, gale wind alerts)
- **🔥 Forest Fire** (Wildland and canopy fire tracking)
- **⛈️ Cloudburst** (Hyper-localized extreme precipitation alerts)
- **Provenance Distinction:** Clearly marks whether an alert is derived from an **AI Risk Assessment Model**, a **Citizen Field Report**, or a **Verified Official Authority** (NDRF / SDRF / IMD).

### 2. Explainable AI Disaster Risk Assessment
- **AI Flood Engine:** Quantitative rule-based model calculating risk score based on rainfall amount (mm), water level (m), historical inundation frequency, and soil saturation percentage.
- **AI Landslide Engine:** Quantitative model taking rainfall intensity (mm/hr), soil moisture (%), slope angle (degrees), vegetation root density, and historical slip markers.
- **Transparency & Explainability:** Provides full contributing factor breakdown with weighted impact points, transparent plain-language explanations, and recommended immediate precautions.
- *Limitation Note: Rule-based explainable baseline for rapid triage without black-box hallucination.*

### 3. Emergency SOS & Offline Synchronization (IndexedDB + PWA)
- **Single-Tap Red SOS Dispatch:** Rapid victim call registration with name, contact, affected count, and emergency description.
- **Accurate Geolocation:** Acquires device coordinates via browser HTML5 Geolocation API with manual latitude/longitude fallback.
- **Offline Storage:** When disconnected from internet, SOS tickets are secured locally inside **IndexedDB** (`suraksha-offline`).
- **Automatic Sync:** Detects when network connection resumes and synchronizes pending tickets to the central FastAPI backend.
- **Pending vs Synced Indicators:** Distinct visual badges showing whether an SOS is safely synced or awaiting uplink.

### 4. AI Urgency Triage & Priority Classification
- Evaluates injury severity, number of trapped victims, immediate danger flags, and medical emergencies.
- Scans emergency descriptions for danger keywords (*trapped, drowning, bleeding, unconscious, collapse*).
- Outputs urgency tier: **Critical**, **High**, or **Medium** with transparent factor reasoning.
- **Operator Override:** Rescue dispatchers can manually override priorities based on field intelligence.

### 5. Live Geospatial Rescue Map (Leaflet + OpenStreetMap)
- Real-time interactive map rendering victim SOS locations, rescue teams, designated trauma hospitals, and relief shelters.
- Custom emoji-based pin markers with priority color indicators (Red = Critical, Orange = High, Yellow = Medium).
- Marker filtering by category (SOS, Hospitals, Shelters) and urgency priority.
- Facility markers are clearly labelled with **DEMO DATA** tags to maintain geographic integrity.

### 6. Rescue Operations & Team Management
- Operational dashboard displaying all incoming SOS tickets, team assignments, and victim details.
- Real-time status workflow transitions: `Pending` ➔ `Assigned` ➔ `In Progress` ➔ `Rescued`.
- Fleet tracking for specialized teams (Flood Rescue, Medical Trauma Unit, Search & Rescue).

### 7. Emergency Resource Logistics & Shortage Detection
- Tracks ambulances, emergency food packs, potable drinking water, shelter tents, medical kits, and rescue personnel.
- Automatic **Shortage Warning** triggers when available supply drops below 25% of depot capacity.
- Complete Add / Edit / Update / Delete capability for warehouse managers.

### 8. Native Multilingual Support (English & Kannada / ಕನ್ನಡ)
- Complete two-way localization between **English** and **Kannada (ಕನ್ನಡ)**.
- Covers navigation menus, dashboard statistics, SOS emergency forms, risk model inputs, precautions, and alert advisories.
- Modular translation dictionary architecture enabling easy expansion to Hindi, Tamil, and Telugu.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Leaflet & React-Leaflet, Recharts, IDB |
| **Backend** | Python 3.15, FastAPI, Pydantic v2, Uvicorn, JSON persistent storage |
| **Offline / PWA** | IndexedDB, Web App Manifest, Service Worker caching (`/sw.js`) |
| **Database** | Persistent local JSON storage (`backend/data/`) with Firebase Firestore fallback |
| **AI / ML** | Explainable rule-based risk evaluation engines (`risk_engine.py`, `classifier.py`) |

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** (v18+ or v20+) and **npm**
- **Python** (v3.10+) and **pip**

### Step 1: Clone or Navigate to Project
```bash
cd c:\Users\karth\SURAKSHA
```

### Step 2: Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 💻 Running the Application

### 1. Start the FastAPI Backend Server
In a terminal window:
```bash
cd c:\Users\karth\SURAKSHA\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger UI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc API Docs: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Start the React Frontend Dev Server
In a separate terminal window:
```bash
cd c:\Users\karth\SURAKSHA\frontend
npm run dev
```
- Frontend Application URL: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing Backend Workflows

You can verify all endpoints and engines in seconds using the direct in-process test suite:
```bash
cd c:\Users\karth\SURAKSHA\backend
python test_in_process.py
```
This tests:
1. Health endpoint status
2. AI Flood risk assessment (Low to Critical evaluation)
3. AI Landslide risk assessment
4. AI Emergency SOS triage & keyword classification
5. SOS status lifecycle updates and team assignments
6. Disaster alert creation and querying
7. Rescue team CRUD operations
8. Resource logistics and shortage monitoring
9. Dashboard analytics aggregation
10. Geospatial map point queries

---

## 📁 Project Structure

```
SURAKSHA/
├── backend/
│   ├── data/                   # Persistent JSON storage for offline/local development
│   ├── classifier.py           # AI emergency urgency classifier & triage logic
│   ├── database.py             # JSON persistence layer, seed data, and CRUD handlers
│   ├── main.py                 # FastAPI application and REST endpoints
│   ├── models.py               # Pydantic data validation schemas
│   ├── requirements.txt        # Python backend dependencies
│   ├── risk_engine.py          # AI flood & landslide explainable assessment engines
│   ├── test_in_process.py      # Direct engine and API integration test suite
│   ├── test_suite.py           # Network HTTP test suite
│   └── .env.example            # Backend environment template
├── frontend/
│   ├── public/
│   │   ├── favicon.svg         # SURAKSHA brand icon
│   │   ├── manifest.json       # PWA web manifest
│   │   └── sw.js               # Service Worker for offline PWA caching
│   ├── src/
│   │   ├── components/         # Layout, Badge, StatCard
│   │   ├── config/             # API endpoint configuration
│   │   ├── contexts/           # AppContext (Language, Online state, Counters)
│   │   ├── hooks/              # useOfflineDB (IndexedDB wrapper)
│   │   ├── i18n/               # English and Kannada translation dictionaries
│   │   ├── pages/              # 9 Core Feature Pages:
│   │   │   ├── Overview.jsx
│   │   │   ├── DisasterMonitoring.jsx
│   │   │   ├── RiskAssessment.jsx
│   │   │   ├── EmergencySOS.jsx
│   │   │   ├── LiveRescueMap.jsx
│   │   │   ├── RescueManagement.jsx
│   │   │   ├── ResourceManagement.jsx
│   │   │   ├── Alerts.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/           # Axios API service client
│   │   ├── App.jsx             # React Router hierarchy
│   │   ├── index.css           # Tailwind CSS directives & scrollbar styling
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   ├── tailwind.config.js      # Emergency dark-theme color definitions
│   └── vite.config.js
├── .env.example
└── README.md
```

---

## 📋 Feature Implementation Status

| Feature | Status | Notes |
|---|---|---|
| **Multi-Disaster Detection** | ✅ Complete | Flood, Landslide, Earthquake, Cyclone, Forest Fire, Cloudburst |
| **AI Risk Assessment** | ✅ Complete | Explainable rule-based flood & landslide quantitative engines |
| **Emergency SOS System** | ✅ Complete | Geolocation, manual coordinates, offline IndexedDB support |
| **Offline Auto-Sync** | ✅ Complete | Automatic sync on reconnect, pending badge queue |
| **AI Urgency Triage** | ✅ Complete | Critical / High / Medium classification with operator override |
| **Live Rescue Map** | ✅ Complete | Leaflet + OpenStreetMap, priority pins, category filters |
| **Rescue Management** | ✅ Complete | Workflow state machine (Pending ➔ Assigned ➔ In Progress ➔ Rescued) |
| **Resource Logistics** | ✅ Complete | 6 categories, depletion warning, CRUD operations |
| **Bilingual Localization** | ✅ Complete | Fluent English and Kannada (ಕನ್ನಡ) translations |
| **Desktop Notifications** | ✅ Complete | Web Notification API integration with user permission |
| **Local Storage Fallback** | ✅ Complete | Persistent JSON database; works with zero Firebase credentials |
| **Firebase Integration** | ⚪ Optional | Architecture prepared for optional Cloud Firestore credentials |
| **Gemini AI Integration** | ⚪ Optional | Non-blocking; no paid API key required for core triage |

---

## 🛡️ License & Acknowledgements
Built for the **SURAKSHA** Disaster Management Initiative. Designed for resilience during critical infrastructure disruptions.
