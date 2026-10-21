# Monorepo Structure and Technology Stack

We decided on a monorepo containing `/backend` and `/frontend` directories. The backend uses Java 21 LTS with Spring Boot 3, Gradle (Kotlin DSL), Spring Data JPA, PostgreSQL, Flyway, and Testcontainers. The frontend is an offline-first Progressive Web App built with Vue 3, Vite, Pinia, Dexie.js (IndexedDB), and Tailwind CSS. This allows independent development and testing of both client and server while maintaining a single repository for collaborative showcase and synchronised domain schemas.
