# PaddockMate 🏎️

> Track day tyre pressure and vehicle setup logging tool, designed for fast, glove-friendly use in the paddock with offline-first synchronisation.

PaddockMate is a full-stack open-source application built with a **Java 21 / Spring Boot** backend and a **Vue 3 / Vite** Progressive Web App (PWA) frontend.

---

## Features

- **Offline-First PWA**: Instant data entry in the pit lane via IndexedDB, with background cloud synchronisation when network connectivity returns.
- **Glove-Friendly Touch UI**: Large touch steppers and buttons designed specifically for mobile pit-lane conditions with driving gloves and dirty hands.
- **Pit-Lane Pressure & Bleed Calculator**: Automatically computes tyre bleed amounts based on off-track hot readings and target pressures.
- **Circuit Baseline Recalls**: Historical tyre and alignment settings stored per track and layout to initialise baseline settings on arrival.

<table width="100%">
  <tr>
    <td width="33.33%" valign="top" align="center">
      <img alt="Login" src="https://github.com/user-attachments/assets/d6209a64-2c03-4d48-9154-28452aa47b27" />
    </td>
    <td width="33.33%" valign="top" align="center">
      <img alt="Vehicle management" src="https://github.com/user-attachments/assets/0014dcd5-0f0a-4f0d-8b3f-ba1778ee499d" />
    </td>
    <td width="33.33%" valign="top" align="center">
      <img alt="Track and layout selection" src="https://github.com/user-attachments/assets/90a82f55-b4f8-435b-a39a-534084b9f027" />
    </td>
  </tr>
</table>

---

## Tech Stack

- **Backend**: Java 21 LTS, Spring Boot 3, Gradle (Kotlin DSL), Spring Data JPA, PostgreSQL, Flyway, Testcontainers.
- **Frontend**: Vue 3, Vite, TypeScript, Pinia, Dexie.js (IndexedDB), Tailwind CSS, `vite-plugin-pwa`, Vitest.
- **Database**: PostgreSQL 16 (via Docker Compose on port `5433`).

---

## Prerequisites

- **Node.js**: v20+ and `npm`
- **Java**: JDK 21+ (e.g., Eclipse Temurin 21)
- **Docker**: For running PostgreSQL locally and Testcontainers during backend integration tests.

---

## Getting Started

### Local Domain Setup

To access the application at `https://dev.paddockmate.app`, add an entry to your operating system's `hosts` file:

- **Linux / macOS**:
  ```bash
  echo "127.0.0.1 dev.paddockmate.app" | sudo tee -a /etc/hosts
  ```
- **Windows** (run PowerShell as Administrator):
  ```powershell
  Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1 dev.paddockmate.app"
  ```

---

### Quick Start with Docker (Recommended)

Start the entire full-stack application (PostgreSQL + Spring Boot Backend + Vue 3 Frontend + Nginx Gateway) with live reloading:

```bash
docker compose up -d
```

> [!NOTE]
> The gateway container automatically generates a local development SSL certificate on startup. On first load in your browser, click **Advanced ➔ Proceed** (or type `thisisunsafe`), or double-click `docker/gateway/certs/dev.paddockmate.app.crt` and install it into your operating system's Trusted Root Certification Authorities for a permanent green padlock.

Once running:
- **Application (HTTPS via Gateway)**: [https://dev.paddockmate.app](https://dev.paddockmate.app)
  - Web UI: `https://dev.paddockmate.app/`
  - REST API: `https://dev.paddockmate.app/api/`
- **Direct Frontend Dev Server**: [http://localhost:5173](http://localhost:5173)
- **Direct Backend REST API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Database**: Port `5433` (mapped from container `5432`)

To view live service logs:
```bash
docker compose logs -f
```

To stop the services:
```bash
docker compose down
```

---

### Local Development (Without Docker Compose)

#### 1. Start the Database Only
```bash
docker compose up -d postgres
```

#### 2. Run the Backend API
```bash
cd backend
./gradlew bootRun
```

To run backend tests:
```bash
cd backend
./gradlew test
```

#### 3. Run the Frontend PWA
```bash
cd frontend
npm install
npm run dev
```

To run frontend tests:
```bash
cd frontend
npm test
```

To build production assets & PWA service worker:
```bash
cd frontend
npm run build
```

---

## Project Structure

```
├── .env.example         # Template for environment configuration
├── AGENTS.md            # Agent instructions and development commands
├── CONTEXT.md           # Project domain glossary
├── docker-compose.yml   # Full-stack Docker Compose definition
├── docker/              # Service container configurations
│   ├── gateway/         # Reverse proxy (Nginx SSL termination & routing)
│   ├── backend/         # Spring Boot multi-stage Dockerfile
│   └── frontend/        # Vue 3 multi-stage Dockerfile
├── docs/
│   ├── adr/             # Architecture Decision Records
│   └── agents/          # Agent tooling configurations
├── backend/             # Spring Boot 3 REST API (Java 21 + Gradle)
└── frontend/            # Vue 3 PWA (Vite + TypeScript)
```
