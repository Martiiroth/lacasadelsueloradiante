#!/bin/bash

# =======================================================
# SCRIPT MASTER DE DEPLOYMENT CON MÚLTIPLES FALLBACKS
# La Casa del Suelo Radiante - Resolución definitiva
# =======================================================

set -e

echo "🔧 INICIANDO DEPLOYMENT CON TROUBLESHOOTING AUTOMÁTICO"
echo "======================================================="

# Función para verificar si un puerto está disponible
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Función para limpiar todo
cleanup_all() {
    echo "🧹 Limpieza completa del sistema Docker..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true
    docker system prune -af
    docker volume prune -f
}

# Función para verificar variables
check_env_vars() {
    echo "📋 Verificando variables de entorno..."
    
    if [ ! -f ".env.production" ]; then
        echo "❌ ERROR: .env.production no encontrado"
        exit 1
    fi

    source .env.production
    
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"  
        "NEXTAUTH_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ ERROR: Variable $var no configurada"
            exit 1
        fi
    done
    
    echo "✅ Variables básicas verificadas"
}

# MÉTODO 1: Deployment completo con PostgreSQL
try_full_deployment() {
    echo ""
    echo "🎯 MÉTODO 1: Deployment completo..."
    echo "================================="
    
    # Cargar variables
    set -a
    source .env.production
    set +a
    
    # Exportar todas las variables
    export $(grep -v '^#' .env.production | xargs)
    
    echo "Building with full docker-compose..."
    if docker-compose build --no-cache; then
        echo "✅ Build exitoso"
        if docker-compose up -d; then
            echo "✅ MÉTODO 1 EXITOSO!"
            return 0
        fi
    fi
    
    echo "❌ Método 1 falló"
    docker-compose down 2>/dev/null || true
    return 1
}

# MÉTODO 2: Solo Next.js con Supabase remoto
try_simple_deployment() {
    echo ""
    echo "🎯 MÉTODO 2: Deployment simplificado..."
    echo "====================================="
    
    # Crear configuración simplificada
    cat > Dockerfile.minimal << 'EOF'
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cp .env.production .env.local
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY .env.production .env.local
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
EOF

    cat > docker-compose.minimal.yml << 'EOF'
version: '3.8'
services:
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile.minimal
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "3000:3000"
EOF

    echo "Building minimal configuration..."
    if docker-compose -f docker-compose.minimal.yml build --no-cache; then
        echo "✅ Build minimal exitoso"
        if docker-compose -f docker-compose.minimal.yml up -d; then
            echo "✅ MÉTODO 2 EXITOSO!"
            return 0
        fi
    fi
    
    echo "❌ Método 2 falló"
    docker-compose -f docker-compose.minimal.yml down 2>/dev/null || true
    return 1
}

# MÉTODO 3: Build local + contenedor de runtime
try_local_build() {
    echo ""
    echo "🎯 MÉTODO 3: Build local + contenedor..."
    echo "======================================="
    
    # Verificar Node.js local
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo "❌ Node.js/npm no disponible localmente"
        return 1
    fi
    
    echo "Building locally..."
    export $(grep -v '^#' .env.production | xargs)
    
    if npm install && npm run build; then
        echo "✅ Build local exitoso"
        
        # Crear contenedor solo para runtime
        cat > Dockerfile.runtime << 'EOF'
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY .env.production .env.local
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
EOF

        cat > docker-compose.runtime.yml << 'EOF'
version: '3.8'
services:
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile.runtime
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "3000:3000"
EOF

        if docker-compose -f docker-compose.runtime.yml build && docker-compose -f docker-compose.runtime.yml up -d; then
            echo "✅ MÉTODO 3 EXITOSO!"
            return 0
        fi
    fi
    
    echo "❌ Método 3 falló"
    return 1
}

# MÉTODO 4: Desarrollo con Next.js local
try_dev_mode() {
    echo ""
    echo "🎯 MÉTODO 4: Modo desarrollo local..."
    echo "==================================="
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no disponible"
        return 1
    fi
    
    export $(grep -v '^#' .env.production | xargs)
    export NODE_ENV=development
    
    echo "Instalando dependencias..."
    npm install
    
    echo "🚀 Iniciando en modo desarrollo..."
    echo "URL: http://localhost:3000"
    echo "Presiona Ctrl+C para detener"
    
    npm run dev
}

# FUNCIÓN PRINCIPAL
main() {
    echo "🔍 Verificando estado inicial..."
    check_env_vars
    
    if ! check_port 3000; then
        echo "⚠️  Puerto 3000 ocupado, limpiando..."
        cleanup_all
    fi
    
    echo "🚀 Probando métodos de deployment..."
    
    # Probar métodos en orden
    if try_full_deployment; then
        echo "🎉 Deployment completo exitoso!"
    elif try_simple_deployment; then
        echo "🎉 Deployment simplificado exitoso!"  
    elif try_local_build; then
        echo "🎉 Build local + contenedor exitoso!"
    else
        echo "⚠️  Todos los métodos Docker fallaron"
        echo "🔄 Intentando modo desarrollo local..."
        try_dev_mode
    fi
    
    # Verificar resultado final
    sleep 5
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo ""
        echo "🎉 ¡APLICACIÓN FUNCIONANDO!"
        echo "========================="
        echo "🌐 URL: http://localhost:3000"
        echo "📊 Estado: docker-compose ps"
        echo "📋 Logs: docker-compose logs -f"
    else
        echo ""
        echo "❌ La aplicación no responde en el puerto 3000"
        echo "🔍 Verifica los logs para más detalles"
    fi
}

# Ejecutar función principal
main "$@"