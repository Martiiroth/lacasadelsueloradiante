# Dockerfile para Next.js
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias basadas en el gestor de paquetes preferido
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public directory exists
RUN mkdir -p ./public

# Build-time environment variables (required for Next.js build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG EMAIL_USER
ARG EMAIL_PASSWORD
ARG EMAIL_FROM_NAME
ARG EMAIL_FROM_ADDRESS
ARG EMAIL_REPLY_TO
ARG EMAIL_ADMIN_ADDRESS
ARG NODE_ENV
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG DATABASE_URL
ARG DATABASE_PASSWORD
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG BUSINESS_NAME
ARG BUSINESS_ADDRESS
ARG BUSINESS_PHONE
ARG BUSINESS_EMAIL
ARG BUSINESS_CIF

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV EMAIL_USER=${EMAIL_USER}
ENV EMAIL_PASSWORD=${EMAIL_PASSWORD}
ENV EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
ENV EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
ENV EMAIL_REPLY_TO=${EMAIL_REPLY_TO}
ENV EMAIL_ADMIN_ADDRESS=${EMAIL_ADMIN_ADDRESS}
ENV NODE_ENV=${NODE_ENV}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV BUSINESS_NAME=${BUSINESS_NAME}
ENV BUSINESS_ADDRESS=${BUSINESS_ADDRESS}
ENV BUSINESS_PHONE=${BUSINESS_PHONE}
ENV BUSINESS_EMAIL=${BUSINESS_EMAIL}
ENV BUSINESS_CIF=${BUSINESS_CIF}

# Next.js recolecta datos de telemetría completamente anónimos sobre el uso general.
# Aprende más aquí: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Descomenta la siguiente línea en caso de que quieras deshabilitar la telemetría durante runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Establecer los permisos correctos para prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Aprovechar automáticamente las trazas de salida para reducir el tamaño de la imagen
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]