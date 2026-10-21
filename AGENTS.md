# AGENTS.md

## Project Rules

### Language and Spelling
- All documentation, code comments, UI text, commit messages, and identifiers must strictly use **British English (en-GB)**.
- Always use `tyre` (never `tire`), `initialise` (never `initialize`), `synchronise` (never `synchronize`), `colour` (never `color`), `millimetre` (never `millimeter`), etc.

## Development Commands

### Full Stack via Docker Compose (Recommended)
- Start entire stack (PostgreSQL + Backend + Frontend + Gateway): `docker compose up -d`
- View logs: `docker compose logs -f`
- Stop entire stack: `docker compose down`
- Rebuild containers: `docker compose up -d --build`

### Database (PostgreSQL only)
- Start database: `docker compose up -d postgres`
- Stop database: `docker compose stop postgres`

### Backend (Java 21 + Spring Boot 3 + Gradle)
- Location: `backend/`
- Build without tests: `./gradlew assemble`
- Run tests: `./gradlew test`
- Start development API server: `./gradlew bootRun` (runs on `http://localhost:8080`)

### Frontend (Vue 3 + Vite + TypeScript)
- Location: `frontend/`
- Install dependencies: `npm install`
- Run unit & component tests: `npm test`
- Build production assets & PWA: `npm run build`
- Start development dev server: `npm run dev` (runs on `http://localhost:5173`)

## Agent skills

### Issue tracker

GitHub issues using `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Custom label vocabulary (`triage`, `question`, `help wanted`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.
