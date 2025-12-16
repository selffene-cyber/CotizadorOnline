# Dockerfile para Cotizador.PiwiSuite
# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias en build time
ENV NEXT_TELEMETRY_DISABLED 1

# Limpiar caché de Next.js antes del build para forzar un build limpio
RUN rm -rf .next

# Build de la aplicación
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del build standalone
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar los archivos standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Cargar variables de entorno desde .env si existe (para Easypanel)
# Easypanel crea el archivo .env cuando "Crear archivo .env" está activado
CMD sh -c 'if [ -f .env ]; then export $(cat .env | grep -v "^#" | xargs) && node server.js; else node server.js; fi'

