# AGENTS.md

## Project Rules

### Language and Spelling

- All documentation, code comments, UI text, commit messages, and identifiers must strictly use **British English (en-GB)**.
- Always use `tyre` (never `tire`), `initialise` (never `initialize`), `synchronise` (never `synchronize`), `colour` (never `color`), `millimetre` (never `millimeter`), etc.

### Environment Configuration

- Environment secrets, API keys, and local overrides belong in `.env` (template provided in `.env.example`).
- Never commit `.env` to version control. Docker Compose and Spring Boot fall back to safe local development defaults if `.env` is absent.

## Development Commands

### Repository Hygiene & Git Hooks

- Install root hook dependencies: `npm install` (at repository root)
- Test staged files hook: `npx lint-staged`
- Verify spelling repository-wide: `npx cspell "**/*"`
- Commit messages must strictly use **Conventional Commits** (`feat(scope): ...`, `fix(scope): ...`) with allowed scopes: `frontend`, `backend`, `docker`, `gateway`, `docs`, `ci`.

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
- Run all quality verification (tests + Spotless + Checkstyle): `./gradlew check`
- Format Java code automatically: `./gradlew spotlessApply`
- Check Java code formatting: `./gradlew spotlessCheck`
- Run Checkstyle naming convention validation: `./gradlew checkstyleMain checkstyleTest`
- Start development API server: `./gradlew bootRun` (runs on `http://localhost:8080`)

### Frontend (Vue 3 + Vite + TypeScript)

- Location: `frontend/`
- Install dependencies: `npm install`
- Run unit & component tests: `npm test`
- Run ESLint: `npm run lint`
- Fix ESLint issues: `npm run lint:fix`
- Format code with Prettier: `npm run format`
- Check code formatting: `npm run format:check`
- Verify TypeScript types: `npm run typecheck`
- Build production assets & PWA: `npm run build`
- Start development dev server: `npm run dev` (runs on `http://localhost:5173`)

## Agent skills

### Issue tracker

GitHub issues using `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Custom label vocabulary (`triage`, `question`, `help wanted`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.
