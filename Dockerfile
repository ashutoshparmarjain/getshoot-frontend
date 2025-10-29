# syntax=docker/dockerfile:1

# -------- Base image --------
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Some Next.js dependencies require this on Alpine (e.g., sharp)
RUN apk add --no-cache libc6-compat

# -------- Dependencies (dev) --------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -------- Build --------
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}



COPY . .
RUN npm run build

# -------- Production runtime --------
FROM base AS runner
WORKDIR /app

# Install only production dependencies for smaller image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy necessary build outputs and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose port and set default envs
ENV PORT=3000
EXPOSE 3000

# Run the Next.js server
CMD ["npm", "run", "start"]


