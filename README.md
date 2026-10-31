# NAVIBAND — Advanced Real-Time Map Navigation & Haptic Wristband Simulator

> **Navigation Beyond Your Screen.**  
> A high-performance, interactive GPS navigation simulation and hardware prototyping platform for the ESP32 haptic navigation wristband project. Simulates realistic vehicle physics on real OpenRouteService road geometry and drives a 4-channel LED matrix with dual-actuator ERM haptic feedback.

---

## 🌟 Key Features

### 1. Two-Stage Pre-Turn Warning System (150m Early & 50m Immediate)
- **Stage 1 — Early Warning (Default: 150 metres, configurable 80m – 300m)**:
  - Triggers well before reaching the intersection to give the rider ample preparation time.
  - Generates the classified directional green LED pulse sequence (`pulseCount` based on corner angle) and activates the corresponding ERM haptic actuator.
  - Displays dynamic HUD title: `↰ LEFT TURN IN 150 m` / `↱ RIGHT TURN IN 150 m` with smooth real-time countdown.
- **Stage 2 — Immediate Alert (Default: 50 metres, configurable 20m – 100m)**:
  - Triggers at the 50m threshold with an urgent, high-energy cadence (160ms ON / 120ms OFF).
  - Displays prominent urgent banner: **`TURN LEFT NOW`** / **`TURN RIGHT NOW`**.
- **Turn Negotiation Zone (20m down to intersection)**:
  - Actively maintains directional green indication while the rider negotiates the turn curve.
- **Maneuver Reached & Completed**:
  - Automatically marks turn reached at $\le$ 5m and completed after passing through the turn.
  - Automatically advances to the next maneuver or returns to dual-green straight cruising.
- **Configurable Distance Controls**:
  - Live interactive sliders directly in the dashboard to customize both warning thresholds without code changes, with automatic clamping (`immediate < early`).

### 2. Lightweight 2D Leaflet Map with Turn Waypoint Highlights
- Single persistent Leaflet 2D map instance (`react-leaflet` + `leaflet`) initialized once without memory thrashing.
- 100% free OpenStreetMap tile layers with dark shader mode (`map-dark-tiles`), Standard OSM, and Humanitarian (HOT) tiles.
- **Zero-overhead 60 FPS marker animation:** The directional vehicle marker updates directly through Leaflet's marker reference and GPU-accelerated CSS rotation, **completely decoupled from React's render cycle**.
- **Upcoming Maneuver Waypoint Highlight:** Automatically illuminates an animated pulsing target ring directly on the map at the upcoming turn intersection.
- **Follow Vehicle Mode:** Smoothly keeps the moving car centered on the map without tile thrashing, or allows free panning exploration when disabled.

### 3. Realistic Vehicle Physics & Speed Controller
- Physical distance integration: `distanceTravelled = speedInMetersPerSecond × elapsedTimeInSeconds`.
- **Dynamic Speed Controller:** Range from `0` to `120 km/h` with a smooth slider and **large digital speedometer**.
- **Driving Presets:** Instant one-click selection for **Stop (0 km/h)**, **City (30 km/h)**, **Normal (40 km/h)**, **Highway (80 km/h)**, and **Fast Sim (120 km/h)**.
- Setting speed to `0 km/h` or pausing immediately freezes distance progress and warning calculations. Resuming continues seamlessly from the exact route position.
- Cornering bearing smoothing: Blends forward azimuth as the car approaches road vertices for natural turning along road curves.

### 4. NAVIBAND 4-LED & Dual-ERM Haptic Vibration Matrix
- Physical layout: **Left Red**, **Left Green**, **Right Green**, **Right Red** plus **Left ERM Haptic Actuator** and **Right ERM Haptic Actuator**.
- **Completely Independent Directional Control:** Left Green and Right Green are strictly isolated, mutually exclusive during single turns, and both illuminate steadily during straight cruising.
- **Pulse Classification Matrix:**
  - **Wide Angle / Slight Turn (`> 90°`)**: `1 pulse` (Direction Green + Motor)
  - **Square Turn (`90°`, within 85° - 95°)**: `2 pulses` (Direction Green + Motor)
  - **Sharp / Acute Turn (`< 90°`)**: `3 pulses` (Direction Green + Motor)
  - **U-turn / Hairpin (`≥ 165°` or ORS code 9)**: `4 pulses` (Both Red LEDs Flash + Direction Green + Dual Haptic Buzz)
  - **Straight Cruising**: **Both Green LEDs illuminated together**. Both red LEDs stay OFF.
  - **Destination Reached**: Car stops, **both Green LEDs illuminate together**, and arrival celebration triggers.
  - **Stopped / Idle**: All LEDs and haptic motors OFF.

### 5. Ergonomic Desktop Dashboard Layout
- **Left Column**:
  1. 2D Leaflet Interactive Map with live vehicle and turn waypoint markers.
  2. **Route Planner Box** directly below the map (Origin, Destination, Autocomplete, Map-click pick mode, and Presets).
  3. Turn-by-Turn Route Maneuver List & Route Summary.
  4. Real-time Simulation Event Log.
- **Right Column**:
  1. Realistic 4-LED & Dual-ERM Haptic Wristband Simulator.
  2. Navigation Controller, Speedometer & Configurable Warning Distance Sliders.
  3. Interactive Hardware LED Test Bench with 7 pre-engineered scenarios.

### 6. Interactive Hardware Test Bench & Pre-Engineered Scenarios
- Manual direct testing: Left (1, 2, 3), Right (1, 2, 3), Straight (both green), U-Turn (4 pulses), Arrival, and Stop.
- **7 Pre-Engineered Test Scenarios:**
  1. Straight Road (Dual Green ON)
  2. Slight Left Turn (1 pulse)
  3. Sharp Left Turn (3 pulses)
  4. Slight Right Turn (1 pulse)
  5. Sharp Right Turn (3 pulses)
  6. U-Turn Maneuver (4 pulses, Dual Red Alert)
  7. Destination Arrival (Both green lit)
- Non-destructive override: manual tests demonstrate the exact LED and haptic behavior without resetting active route progress.

### 7. Secure OpenRouteService (ORS) Integration
- The ORS API key is securely loaded from `.env` via `OPEN_ROUTE_SERVICES` on the Express backend.
- The API key is **never exposed** to the client browser or frontend bundle.
- Full Pelias geocoding (`/api/geocoding/search`), reverse geocoding (`/api/geocoding/reverse`), and driving directions (`/api/directions`).

---

## 🏗 System Architecture

```
[React Navigation Dashboard]
        │
        ├──► [Leaflet 2D Map (60 FPS Vehicle Marker & Maneuver Highlight)]
        │
        ├──► [Route Planner & Geocoding Search]
        │
        ├──► [Digital Speedometer & Physics Distance Controller]
        │
        └──► [Distance-Based Pre-Turn Warning Engine]
                     │ (150m Early / 50m Immediate)
                     ▼
             [IWristbandOutput Interface]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
[Simulator Output]        [Future ESP32 BLE Driver]
(4-LEDs + Haptic Actuator) (Web Bluetooth GATT Packets)
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+ (tested on Node v20 & v24)
- NPM v9+
- An OpenRouteService API account (free registration at [openrouteservice.org](https://openrouteservice.org/dev/#/signup))

---

### 1. Environment Variable Configuration (`.env`)

The application requires an OpenRouteService API key to calculate driving routes, maneuvers, and turn-by-turn geometry. The key is securely loaded and queried **only by the Express backend**, protecting your credentials from client-side exposure.

#### Step 1: Create the `.env` file
In the **root directory** of the project, create a file named `.env` (or copy the provided `.env.example` template):

```bash
# On Linux / macOS:
cp .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

#### Step 2: Add the required environment variable key
Open `.env` in your text editor and add the environment variable using the exact key name **`OPEN_ROUTE_SERVICES`**:

```env
# OpenRouteService API Key
OPEN_ROUTE_SERVICES=your_openrouteservice_api_key_here

# Optional: Server Port (defaults to 5000 if omitted)
PORT=5000
```

> [!IMPORTANT]
> - Replace `your_openrouteservice_api_key_here` with your actual key from the OpenRouteService dashboard.
> - Do not wrap the key in quotes or add extra whitespace around the `=` sign.
> - The `.env` file is listed in `.gitignore` and must **never** be committed to GitHub.

---

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Mode (Concurrent Backend + Frontend)
```bash
npm run dev
```
- **Frontend (Vite UI)**: [http://localhost:5173](http://localhost:5173) (Vite dev server automatically proxies `/api` calls to the backend on port 5000)
- **Backend (Express Proxy)**: [http://localhost:5000](http://localhost:5000)

### 4. Production Build & Run
```bash
npm run build
npm start
```
The Express server serves the compiled production frontend and API endpoints at [http://localhost:5000](http://localhost:5000).

---

## 🧪 Automated Test Suite

Run the automated verification suite to test turn classification, bearing normalization, LED controller independence, and distance-based warning engine:

```bash
node tests/navigation-warning.test.mjs
```

All 8 test suites verify:
- 0°/360° bearing crossing and angle normalization.
- Pulse classification rules (`>90° = 1`, `90° = 2`, `<90° = 3`, `U-turn = 4`).
- Independent directional classification (Right vs Left vs U-turn).
- LED controller independence (Left Green vs Right Green mutual exclusion).
- 150m Early Warning & 50m Immediate Warning pre-turn triggering.
- Duplicate alert prevention across animation frames.
- Sequential execution of consecutive turns.
- Speed scaling and pause/resume invariance.

---

## 🎛 Pulse Classification Matrix

| Turn Deflection Angle | Pulses | Active LEDs | Active Haptic Motor | Timing (Configurable) |
| :--- | :---: | :--- | :--- | :--- |
| **Wide Angle / Slight Turn** (`> 90°`) | **1** | Left or Right Green | Left or Right ERM Buzz | 250ms ON / 200ms OFF |
| **Square Turn** (`90°`, `85° - 95°`) | **2** | Left or Right Green | Left or Right ERM Buzz | 250ms ON / 200ms OFF |
| **Acute Sharp Turn** (`< 90°`) | **3** | Left or Right Green | Left or Right ERM Buzz | 250ms ON / 200ms OFF |
| **U-Turn / Hairpin** (`≥ 165°`) | **4** | **Both Red LEDs** + Green | Dual Haptic Buzz (4x) | Urgent Warning Pattern |
| **Straight Cruising** | Steady | **Both Green LEDs ON** | Idle | Both Green Steady Glow |
| **Destination Reached** | Steady | **Both Green LEDs ON** | Single Confirmation Buzz | Arrival Celebration |
| **Stopped / Idle** | None | All LEDs OFF | OFF | Standby |

---

## 🛡 Security & Best Practices

- The OpenRouteService API key is strictly maintained in `.env` on the backend server.
- No secrets are leaked in client code, terminal logs, or browser console.
- `.env` and `.env.*` are strictly protected in `.gitignore`, and `.env.example` provides safe placeholder documentation.
