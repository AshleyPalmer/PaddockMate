# Development stage
FROM eclipse-temurin:21-jdk AS dev

WORKDIR /app

# Copy Gradle wrapper and configuration files first for layer caching
COPY backend/gradlew backend/settings.gradle.kts backend/build.gradle.kts ./
COPY backend/gradle ./gradle

RUN chmod +x ./gradlew

# Pre-fetch Gradle dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY backend/src ./src

EXPOSE 8080

CMD ["./gradlew", "bootRun", "--no-daemon"]

# Builder stage for production JAR
FROM dev AS builder

RUN ./gradlew bootJar -x test --no-daemon

# Production runtime stage
FROM eclipse-temurin:21-jre AS prod

WORKDIR /app

# Non-root user for container security
RUN groupadd -r paddockmate && useradd -r -g paddockmate paddockmate
USER paddockmate

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
