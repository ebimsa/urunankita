# Multi-stage build untuk efisiensi
FROM node:22-alpine AS builder

WORKDIR /app

# Salin konfigurasi workspace dan package
COPY package*.json ./
COPY .npmrc ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Install semua dependensi
RUN npm ci

# Generate Prisma Client & Build backend
RUN npm run prisma:generate
RUN npm run build:backend

# Stage Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Hugging Face Spaces mengharuskan aplikasi mendengar di PORT 7860
ENV PORT=7860

# Salin hasil build & dependensi
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/backend/ ./apps/backend/
COPY --from=builder /app/node_modules/ ./node_modules/

# Expose port Hugging Face Spaces
EXPOSE 7860

# Jalankan backend
CMD ["node", "apps/backend/dist/main.js"]
