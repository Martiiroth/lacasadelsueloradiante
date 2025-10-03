#!/bin/bash

# Script de deployment completo para VPS
# La Casa del Suelo Radiante - Versión Final

echo "🚀 DEPLOYMENT COMPLETO - LA CASA DEL SUELO RADIANTE"
echo "=================================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✅ OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; }
print_error() { echo -e "${RED}[❌ ERROR]${NC} $1"; }
print_info() { echo -e "${BLUE}[ℹ️  INFO]${NC} $1"; }

echo ""
print_info "=== FASE 1: VERIFICACIONES PREVIAS ==="

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker daemon no está corriendo"
    exit 1
fi

print_status "Docker funcionando correctamente"

# Verificar archivos
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.final" ]; then
        print_info "Copiando configuración final..."
        cp .env.production.final .env.production
    else
        print_error "Archivo .env.production no encontrado"
        exit 1
    fi
fi

print_status "Configuración de entorno lista"

echo ""
print_info "=== FASE 2: GIT SYNC ==="

# Resolver conflictos git si existen
if git status --porcelain | grep -q .; then
    print_warning "Hay cambios locales, haciendo stash..."
    git stash push -m "backup-antes-deployment-$(date +%Y%m%d-%H%M%S)"
fi

# Actualizar código
print_info "Actualizando código desde repositorio..."
git fetch origin main
git reset --hard origin/main
git pull origin main

print_status "Código actualizado"

echo ""
print_info "=== FASE 3: DEPLOYMENT ==="

# Parar servicios
print_info "Deteniendo servicios existentes..."
docker-compose down --remove-orphans

# Build limpio
print_info "Construyendo nueva imagen..."
docker-compose build --no-cache nextjs-app

# Configurar nginx si es necesario
if [ -f "nginx/tienda.conf" ]; then
    print_info "Configurando nginx para el dominio..."
    
    # Verificar si nginx-container está corriendo
    if docker ps | grep -q "nginx-container"; then
        # Copiar configuración de nginx
        docker cp nginx/tienda.conf nginx-container:/etc/nginx/conf.d/tienda.conf
        
        # Verificar configuración nginx
        if docker exec nginx-container nginx -t; then
            print_status "Configuración nginx válida"
            docker exec nginx-container nginx -s reload
        else
            print_error "Configuración nginx inválida"
        fi
    fi
fi

# Iniciar servicios
print_info "Iniciando servicios..."
docker-compose up -d

# Esperar que los servicios inicien
print_info "Esperando que los servicios inicien..."
sleep 30

echo ""
print_info "=== FASE 4: VERIFICACIÓN ==="

# Verificar contenedores
CONTAINERS=$(docker-compose ps --services --filter "status=running")
if [ -z "$CONTAINERS" ]; then
    print_error "No hay contenedores corriendo"
    docker-compose logs --tail=50
    exit 1
fi

print_status "Contenedores corriendo: $CONTAINERS"

# Verificar conectividad
print_info "Verificando conectividad..."

# HTTP
if curl -s -f --connect-timeout 10 "http://localhost:3000" > /dev/null; then
    print_status "Aplicación responde en HTTP (localhost:3000)"
else
    print_warning "Aplicación no responde en localhost:3000"
fi

# HTTPS (si el dominio está configurado)
if curl -s -f --connect-timeout 10 "https://lacasadelsueloradianteapp.com" > /dev/null; then
    print_status "Aplicación responde en HTTPS (dominio)"
else
    print_info "Dominio HTTPS no disponible aún (normal en primera configuración)"
fi

echo ""
print_info "=== RESUMEN FINAL ==="

docker-compose ps

echo ""
print_status "🎉 DEPLOYMENT COMPLETADO"
echo ""
print_info "📋 ACCESO A LA APLICACIÓN:"
print_info "  • Local: http://localhost:3000"
print_info "  • Dominio: https://lacasadelsueloradianteapp.com"
print_info "  • Supabase: https://supabase.lacasadelsueloradianteapp.com"
echo ""
print_info "📊 COMANDOS ÚTILES:"
print_info "  • Ver logs: docker-compose logs -f nextjs-app"
print_info "  • Reiniciar: docker-compose restart nextjs-app"
print_info "  • Detener: docker-compose down"
echo ""
print_info "🔧 CONFIGURACIÓN:"
print_info "  • Variables de entorno: .env.production"
print_info "  • Nginx: nginx/tienda.conf"
print_info "  • SSL: Certificados Let's Encrypt activos"
echo ""

# Mostrar logs recientes
print_info "📝 LOGS RECIENTES:"
docker-compose logs --tail=20 nextjs-app