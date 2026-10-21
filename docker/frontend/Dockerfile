# Development stage
FROM node:22-alpine AS dev

WORKDIR /app

# Copy package manifests first for Docker layer caching
COPY frontend/package*.json ./

RUN npm install

# Copy application source
COPY frontend/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Builder stage for production bundle
FROM dev AS builder

RUN npm run build

# Production runtime stage
FROM nginx:alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

# Simple SPA fallback for static asset serving
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
