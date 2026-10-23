# Phase 1 MVP Specification: PaddockMate Core Tyre Pressure & Session Logger

## 1. Executive Summary & Purpose

PaddockMate is an open-source, mobile-first, offline-first web application designed for track day drivers to log tyre pressures, temperatures, bleed calculations, and session notes in noisy, high-glare pit-lane environments.

In typical track day conditions, mobile internet coverage in paddocks and pit garages is patchy or non-existent. Drivers have dirty hands, are frequently wearing racing gloves, and need immediate, zero-latency feedback to bleed hot tyres down to target pressures within minutes of exiting the circuit.

Phase 1 MVP delivers a complete, local-first tracer-bullet product that enables drivers to:
1. Manage their Vehicle profile.
2. Select or create a Track and circuit Layout.
3. Record a Track Day event.
4. Record Sessions with cold tyre pressures, hot off-track pressures, tyre temperatures, calculated bleed values, and adjusted starting pressures for subsequent runs.
5. Operate 100% offline using client-side IndexedDB storage (Dexie.js) with background synchronisation to a Java 21 Spring Boot backend when network connectivity is available.
6. Utilise a high-contrast, glove-friendly Sunlight interaction model by default, with dark mode toggleable via a dedicated Settings page.

---

## 2. Domain Vocabulary & Ubiquitous Language

Per [CONTEXT.md](../../CONTEXT.md), all identifiers, schemas, API parameters, documentation, and user-facing text must strictly follow these terms and British English spelling:

- **Vehicle**: A car being driven and logged on track. (*Avoid: Auto, automobile, ride, machine*).
- **Track**: A motorsport racing circuit facility (*e.g., Brands Hatch, Donington Park*). (*Avoid: Circuit, course, venue*).
- **Layout**: A specific circuit configuration or route variant within a Track (*e.g., Indy, Grand Prix, National*). (*Avoid: Configuration, circuit variant, track variant*).
- **Track Day**: An event or date where a Vehicle is driven on a specific Track Layout. (*Avoid: Event, outing, meet*).
- **Session**: A single stint or run out on circuit during a Track Day (*e.g., Session 1, Session 2*). (*Avoid: Stint, run, heat, lap*).
- **Tyre Reading**: Measurements recorded for each tyre corner (Front Left `FL`, Front Right `FR`, Rear Left `RL`, Rear Right `RR`), including cold pressure, hot pressure, target pressure, and tyre temperature. (*Avoid: Tire, wheel stats, rubber reading*).
- **Cold Pressure**: Tyre pressure measured before a Session when the tyre is at ambient temperature. (*Avoid: Starting pressure, base pressure*).
- **Hot Pressure**: Tyre pressure measured immediately after coming off circuit from a Session. (*Avoid: Working pressure, finish pressure*).
- **Target Pressure**: The desired Hot Pressure a driver aims to achieve when tyres reach operating temperature on circuit. (*Avoid: Goal pressure, optimal pressure*).
- **Bleed**: The pressure intentionally released from a hot tyre to reach Target Pressure. (*Avoid: Vent, dump, drop, release*).
- **Adjusted Pressure**: The tyre pressure set in the pits after bleeding or adding air, representing starting pressure for the next Session. (*Avoid: Final pressure, reset pressure, set pressure*).

---

## 3. Architecture & ADR Alignment

The architecture directly adheres to approved architectural decision records:

1. **Local-First Offline Architecture ([ADR-0001](../adr/0001-local-first-offline.md))**:
   - Primary data store on client is IndexedDB via Dexie.js.
   - All read and write operations complete synchronously against IndexedDB with 0ms network latency.
   - A synchronisation queue tracks created, updated, and deleted entities and syncs asynchronously to the Spring Boot REST API when online.
2. **Client-Generated UUIDs ([ADR-0002](../adr/0002-client-generated-uuids.md))**:
   - All entity primary keys are generated client-side using time-ordered UUIDv7 (or UUIDv4).
   - This eliminates round-trips for ID allocation and allows offline graph construction.
3. **Single Origin & Nginx Gateway ([ADR-0005](../adr/0005-docker-containerisation-gateway.md))**:
   - Single origin on `https://dev.paddockmate.app`.
   - `/api/*` routed to Spring Boot (`backend:8080`), `/` routed to Vue 3 dev server / static bundle (`frontend:5173`).
4. **Technology Stack ([ADR-0004](../adr/0004-tech-stack-monorepo.md))**:
   - Backend: Java 21, Spring Boot 3.3+, Gradle (Kotlin DSL), Spring Data JPA, Flyway, PostgreSQL 16, Testcontainers.
   - Frontend: Vue 3 (Composition API, `<script setup lang="ts">`), Vite, TypeScript, Tailwind CSS v4, Pinia, Dexie.js, Vitest.

---

## 4. Scope Breakdown: Phase 1 MVP

### In-Scope (Phase 1 MVP)
- **Vehicle Profile**:
  - Create and select active Vehicle (Make, Model, Year, Registration/Nickname, Default Cold Pressures, Default Target Pressures).
- **Track & Layout Directory**:
  - Pre-seeded directory of common UK circuits:
    - *Brands Hatch* (Indy, Grand Prix)
    - *Donington Park* (National, Grand Prix)
    - *Silverstone* (National, International, Grand Prix)
    - *Cadwell Park* (Full Circuit)
    - *Bedford Autodrome* (SEN, GT)
    - *Snetterton* (300, 200)
    - *Oulton Park* (International, Island, Fosters)
    - *Castle Combe*
    - *Croft* (Main Circuit, Club Circuit 'A', Club Circuit 'B')
    - *Goodwood* (Main Circuit)
    - *Thruxton* (Main Circuit)
    - *Anglesey* (Coastal Circuit, National Circuit, International GP Circuit)
   - Full list of UK circuits with track map images can be found at https://www.racingcircuits.info/europe/united-kingdom/
    
- **Track Day Lifecycle**:
  - Create Track Day with date, assigned Vehicle, selected Track Layout, and ambient weather/temperature notes.
- **Session Logging**:
  - Add sequential Sessions to an active Track Day.
  - Record pre-session Cold Pressures.
  - Record post-session Hot Pressures and Tyre Temperatures across 4 corners (FL, FR, RL, RR).
  - Real-time Bleed calculation: `Bleed = Hot Pressure - Target Pressure`.
  - Record Adjusted Pressure heading into next session.
- **Pit-Lane Mobile UI (Validated Interaction Model)**:
  - High-contrast Sunlight mode by default (pure black ink on pure white, 3px borders).
  - Chassis Silhouette interactive diagram with direct corner selection.
  - Oversized glove-friendly stepper buttons (`w-10 h-10` / `h-14` targets) with hold-to-repeat acceleration.
  - Fine adjustment accuracy: `±0.1 PSI` for target hot and `±1°C` for tyre temperature.
  - Corner status summary strip (`▼ X BLEED · ▲ Y ADD · ✓ Z DONE`).
  - 1-tap "Set to target" button.
  - Haptic feedback tick on adjustments.
  - Screen Wake Lock ("Keep Screen On") toggle.
- **Settings View**:
  - Theme selector: Default Sunlight Mode vs. Dark Mode (persisted in local preferences).
  - Haptic feedback enable/disable toggle.
  - Wake Lock enable/disable preference.
- **Offline Persistence & Background Synchronisation**:
  - Full IndexedDB storage.
  - Spring Boot REST API for syncing Track Days, Sessions, and Tyre Readings.
  - Idempotent upsert endpoints and last-write-wins / version-based conflict resolution.

### Deferred (Post-Phase 1)
- Suspension geometry and damper clicks (bump/rebound) setup logging (*Phase 2*).
- OAuth2 social login (Google/GitHub) and cloud account merge (*Phase 2*).
- Live ambient weather API integration (*Phase 2*).
- GPS lap timer import and session lap delta analysis (*Phase 3*).
- Multi-user community setup sharing and public leaderboards (*Phase 3*).
- OBD-II Integration for car data pulling (*Phase 4*).
- Potential third-party/external TPMS integration for Pressure & Temperature automation (*Phase 4*).

---

## 5. UI Specification & User Journeys

### User Journey 1: Morning Paddock Arrival (Cold Setup)
1. Driver opens `https://dev.paddockmate.app` on mobile phone. App opens directly in Sunlight mode.
2. Driver creates or selects their Vehicle (*e.g. "BMW M3 E46"*).
3. Driver starts a new Track Day: selects "Brands Hatch" -> "Indy", enters date and notes ambient paddock temperature (*e.g. 14°C*).
4. Driver enters baseline Cold Pressures for all 4 corners (*e.g. FL: 26.0, FR: 26.0, RL: 25.0, RR: 25.0 PSI*) and sets Target Hot Pressures (*e.g. 30.0 PSI front, 28.0 PSI rear*).
5. App saves all data to local IndexedDB instantly.

### User Journey 2: Pit-Lane Stint Return (Hot Pressure Bleed)
1. Driver finishes Session 1, drives down pit lane, parks up with engine idling or cooling down.
2. Driver taps "Log Session 1 Hot Pressures" and takes tyre pressure gauge around the car.
3. App presents the Chassis Silhouette view:
   - Driver taps **FL** card on car diagram (or FL is pre-selected). Card inverts to solid black with white typography.
   - Driver taps or holds `+` / `-` steppers to set measured Hot Pressure (*e.g. 34.2 PSI*) and Tyre Temperature (*e.g. 68°C*).
   - Status badge immediately indicates `▼ BLEED -4.2 PSI`.
   - Driver bleeds air valve until gauge reads 30.0 PSI, then taps "Set to target · 30.0 PSI" (haptic confirmation vibrates).
   - Progress strip increments `✓ 1 DONE`.
   - Driver taps **FR**, enters 35.1 PSI -> bleeds to 30.0 PSI -> taps next corners until `✓ 4 DONE`.
4. Driver taps "Complete Session 1". Adjusted starting pressures automatically carry forward as the baseline for Session 2.

### User Journey 3: Settings & Appearance
1. Driver accesses Settings from top navigation bar.
2. Driver can toggle between **Sunlight Mode** and **Dark Mode**.
3. Preference persists in `localStorage` across page reloads.

---

## 6. Data Model & Database Schemas

### 6.1 Client-Side Schema (Dexie.js / IndexedDB)

```typescript
// Database Name: PaddockMateDB, Version: 1

export interface VehicleEntity {
  id: string // UUIDv7
  make: string
  model: string
  year?: number
  nickname?: string
  defaultColdPressureFl?: number
  defaultColdPressureFr?: number
  defaultColdPressureRl?: number
  defaultColdPressureRr?: number
  defaultTargetPressureFl?: number
  defaultTargetPressureFr?: number
  defaultTargetPressureRl?: number
  defaultTargetPressureRr?: number
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface TrackEntity {
  id: string // UUIDv7
  name: string
  country: string
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface LayoutEntity {
  id: string // UUIDv7
  trackId: string // Foreign Key -> TrackEntity.id
  name: string
  lengthMetres?: number
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackDayEntity {
  id: string // UUIDv7
  vehicleId: string // Foreign Key -> VehicleEntity.id
  trackId: string // Foreign Key -> TrackEntity.id
  layoutId: string // Foreign Key -> LayoutEntity.id
  date: string // YYYY-MM-DD
  ambientTemperature?: number // Celsius
  weatherCondition?: string // 'Dry', 'Damp', 'Wet', etc.
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface SessionEntity {
  id: string // UUIDv7
  trackDayId: string // Foreign Key -> TrackDayEntity.id
  sessionNumber: number // 1, 2, 3...
  timeOfDay?: string // HH:mm
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface TyreReadingEntity {
  id: string // UUIDv7
  sessionId: string // Foreign Key -> SessionEntity.id
  corner: 'FL' | 'FR' | 'RL' | 'RR'
  coldPressure?: number // PSI, 1 decimal place
  hotPressure?: number // PSI, 1 decimal place
  targetPressure?: number // PSI, 1 decimal place
  adjustedPressure?: number // PSI, 1 decimal place
  temperature?: number // Celsius
  createdAt: string
  updatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
}

export interface SyncQueueEntity {
  id: number // Auto-incrementing integer
  entityType: 'vehicle' | 'track_day' | 'session' | 'tyre_reading'
  entityId: string // UUID
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: string // JSON representation
  timestamp: number
  retryCount: number
}
```

### 6.2 Server-Side Schema (PostgreSQL + Flyway)

```sql
-- V1__initial_schema.sql

CREATE TABLE tracks (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE layouts (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    length_metres INTEGER,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER,
    nickname VARCHAR(100),
    default_cold_pressure_fl NUMERIC(4, 1),
    default_cold_pressure_fr NUMERIC(4, 1),
    default_cold_pressure_rl NUMERIC(4, 1),
    default_cold_pressure_rr NUMERIC(4, 1),
    default_target_pressure_fl NUMERIC(4, 1),
    default_target_pressure_fr NUMERIC(4, 1),
    default_target_pressure_rl NUMERIC(4, 1),
    default_target_pressure_rr NUMERIC(4, 1),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE track_days (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id),
    layout_id UUID NOT NULL REFERENCES layouts(id),
    event_date DATE NOT NULL,
    ambient_temperature NUMERIC(4, 1),
    weather_condition VARCHAR(50),
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    track_day_id UUID NOT NULL REFERENCES track_days(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    time_of_day VARCHAR(10),
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_number_per_day UNIQUE (track_day_id, session_number)
);

CREATE TABLE tyre_readings (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    corner VARCHAR(2) NOT NULL CHECK (corner IN ('FL', 'FR', 'RL', 'RR')),
    cold_pressure NUMERIC(4, 1),
    hot_pressure NUMERIC(4, 1),
    target_pressure NUMERIC(4, 1),
    adjusted_pressure NUMERIC(4, 1),
    temperature NUMERIC(4, 1),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_corner_per_session UNIQUE (session_id, corner)
);

CREATE INDEX idx_layouts_track_id ON layouts(track_id);
CREATE INDEX idx_track_days_date ON track_days(event_date);
CREATE INDEX idx_sessions_track_day_id ON sessions(track_day_id);
CREATE INDEX idx_tyre_readings_session_id ON tyre_readings(session_id);
```

---

## 7. Synchronisation & REST API Contracts

### 7.1 Sync Protocol
1. Client pushes pending mutations from its IndexedDB `sync_queue` table to the server.
2. Endpoint: `POST /api/v1/sync/push`
   - Accepts a batch of entity upserts and deletes.
   - Server processes in dependency order (`vehicles` -> `track_days` -> `sessions` -> `tyre_readings`).
   - Server applies Last-Write-Wins (LWW) based on `updatedAt` timestamp and version counters.
   - Responds with accepted IDs and current server timestamps.
3. Client marks accepted entities in IndexedDB as `synced`.

### 7.2 REST Endpoints (Standard CRUD fallback)
- `GET /api/v1/tracks` — Pre-seeded tracks and layouts catalog.
- `GET /api/v1/vehicles` / `POST /api/v1/vehicles` — Vehicle management.
- `GET /api/v1/track-days` / `POST /api/v1/track-days` — Track day events.
- `GET /api/v1/track-days/{id}/sessions` / `POST /api/v1/track-days/{id}/sessions` — Sessions.
- `PUT /api/v1/sessions/{id}/tyres` — Batch update 4 tyre readings for a session.

---

## 8. Quality Gates & Non-Functional Requirements

1. **Zero-Latency Paddock Logging**:
   - UI interactions (stepping pressures, toggling corners, saving readings) must execute locally in < 16ms without waiting on network calls.
2. **Offline-First Resilience**:
   - Application must be fully functional when offline or in airplane mode.
   - Service worker caches application shell, stylesheets, scripts, and pre-seeded tracks.
3. **Strict British English Compliance**:
   - Zero tolerance for American spellings in code identifiers, comments, tests, UI text, or API payloads (`tyre`, `initialise`, `synchronise`, `colour`, `millimetre`, `behaviour`).
4. **Pit-Lane Glove Usability**:
   - Minimum touch target for adjustments: 40px × 40px (steppers), 64px height for primary buttons.
   - High contrast ratio: Sunlight mode exceeds WCAG AAA (21:1 for black on white).
5. **Automated Verification**:
   - Backend: Unit tests and Spring Data JPA integration tests run via Testcontainers (`./gradlew test`).
   - Frontend: Vitest unit tests for composables, calculation utilities, and Pinia stores (`npm test`).
   - Production Build: Clean Vite bundle & PWA service worker generation (`npm run build`).

---

## 9. Implementation Tracer-Bullet Milestones

1. **Milestone 1: Client Database & Pinia Stores (IndexedDB)**
   - Setup Dexie.js database schema and stores for Vehicles, Tracks, Track Days, Sessions, and Tyre Readings.
   - Pre-seed UK circuits catalog into IndexedDB on first launch.
2. **Milestone 2: Vehicle & Track Day Setup UI**
   - Vehicle creation and selection view.
   - Track & Layout selection view.
   - Track Day creation view with date and ambient temperature.
3. **Milestone 3: Pit-Lane Tyre Reading Component (Promoting Sunlight View)**
   - Integrate validated `VariantSunlight.vue` and `useHoldRepeat` composable into the Session Tyre Reading workflow.
   - Session navigation (Session 1, 2, 3...) and automatic pressure carry-forward.
4. **Milestone 4: Settings & Appearance Page**
   - Dedicated Settings view for Sunlight vs. Dark theme toggle, Haptics toggle, and Wake Lock toggle.
5. **Milestone 5: Spring Boot Database & REST Sync Engine**
   - Flyway database migration `V1__initial_schema.sql` and `V2__seed_uk_tracks.sql`.
   - JPA Entities, Repositories, Services, and REST Controllers.
   - Sync service to ingest client offline queues.
6. **Milestone 6: End-to-End PWA Offline Verification**
   - Service worker precaching.
   - End-to-end test verifying offline data entry followed by online synchronisation to PostgreSQL.
