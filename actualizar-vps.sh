#!/bin/bash

# ============================================
# Script de Actualización para VPS
# Aplica la corrección de imágenes desde GitHub
# ============================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      🚀 ACTUALIZACIÓN VPS - CORRECCIÓN IMÁGENES    ║${NC}"
echo -e "${CYAN}║           La Casa del Suelo Radiante               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "\n${CYAN}═══ $1 ═══${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
    log_error "No parece ser el directorio del proyecto La Casa del Suelo Radiante"
    log_info "Asegúrate de estar en el directorio correcto del proyecto"
    exit 1
fi

log_success "Directorio del proyecto verificado"

# PASO 1: Backup y actualización de código
log_step "1. ACTUALIZACIÓN DE CÓDIGO DESDE GITHUB"

# Backup del .env.production actual
if [ -f ".env.production" ]; then
    log_info "Creando backup de .env.production..."
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    log_success "Backup creado"
fi

# Verificar estado de git
log_info "Verificando estado de Git..."
git status --porcelain > /dev/null 2>&1 || {
    log_error "Este directorio no es un repositorio Git válido"
    exit 1
}

# Actualizar código
log_info "Actualizando código desde GitHub..."
git fetch origin
git pull origin main

if [ $? -eq 0 ]; then
    log_success "Código actualizado desde GitHub"
else
    log_error "Error actualizando código desde GitHub"
    exit 1
fi

# Verificar archivos importantes
log_info "Verificando archivos de corrección..."
if [ -f "GUIA_ACTUALIZACION_VPS.md" ] && [ -f "deploy-with-image-fix.sh" ]; then
    log_success "Archivos de corrección descargados correctamente"
else
    log_error "Faltan archivos de corrección. Verifica que el pull se haya completado"
    exit 1
fi

# PASO 2: Verificar configuración
log_step "2. VERIFICACIÓN DE CONFIGURACIÓN"

# Verificar .env.production
log_info "Verificando .env.production..."
if [ -f ".env.production" ]; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.production | cut -d '=' -f2)
    echo "   URL configurada: $SUPABASE_URL"
    
    if [[ $SUPABASE_URL == *"lacasadelsueloradianteapp.supabase.co"* ]]; then
        log_success "URL de Supabase correcta (dominio estándar)"
    elif [[ $SUPABASE_URL == *"supabase.lacasadelsueloradianteapp.com"* ]]; then
        log_warning "URL usa dominio personalizado - esto podría causar problemas con Storage"
        log_info "Considera cambiar a: https://lacasadelsueloradianteapp.supabase.co"
    else
        log_error "URL de Supabase no reconocida"
        exit 1
    fi
else
    log_error "Archivo .env.production no encontrado"
    exit 1
fi

# PASO 3: Preparar para deploy
log_step "3. PREPARACIÓN PARA DEPLOY"

# Hacer scripts ejecutables
chmod +x deploy-with-image-fix.sh
chmod +x scripts/diagnose-images-production.js 2>/dev/null || true
log_success "Scripts configurados como ejecutables"

# Detectar tipo de deploy
log_info "Detectando configuración de deploy..."

DEPLOY_TYPE=""
if [ -f "docker-compose.yml" ]; then
    DEPLOY_TYPE="docker"
    log_info "Detectado: Deploy con Docker"
elif command -v pm2 >/dev/null 2>&1; then
    DEPLOY_TYPE="pm2"
    log_info "Detectado: Deploy con PM2"
elif [ -f "package.json" ]; then
    DEPLOY_TYPE="node"
    log_info "Detectado: Deploy con Node.js directo"
else
    log_warning "No se pudo detectar el tipo de deploy"
    DEPLOY_TYPE="manual"
fi

# PASO 4: Ejecutar deploy
log_step "4. EJECUTANDO DEPLOY"

case $DEPLOY_TYPE in
    "docker")
        log_info "Iniciando deploy con Docker..."
        
        # Detener contenedores
        log_info "Deteniendo contenedores..."
        docker-compose down
        
        # Limpiar cache
        log_info "Limpiando cache..."
        rm -rf .next node_modules/.cache 2>/dev/null || true
        
        # Build sin cache
        log_info "Construyendo imagen (esto puede tomar varios minutos)..."
        docker-compose build --no-cache
        
        if [ $? -eq 0 ]; then
            log_success "Imagen construida exitosamente"
        else
            log_error "Error construyendo imagen Docker"
            exit 1
        fi
        
        # Iniciar contenedores
        log_info "Iniciando contenedores..."
        docker-compose up -d
        
        if [ $? -eq 0 ]; then
            log_success "Contenedores iniciados"
        else
            log_error "Error iniciando contenedores"
            exit 1
        fi
        ;;
        
    "pm2")
        log_info "Iniciando deploy con PM2..."
        
        # Instalar dependencias si es necesario
        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            log_info "Instalando dependencias..."
            npm ci
        fi
        
        # Build
        log_info "Construyendo aplicación..."
        npm run build
        
        if [ $? -eq 0 ]; then
            log_success "Build completado"
        else
            log_error "Error en build"
            exit 1
        fi
        
        # Reiniciar PM2
        log_info "Reiniciando aplicación con PM2..."
        pm2 restart lacasadelsueloradiante 2>/dev/null || pm2 start npm --name "lacasadelsueloradiante" -- start
        
        log_success "Aplicación reiniciada con PM2"
        ;;
        
    "node")
        log_info "Iniciando deploy con Node.js..."
        
        # Instalar dependencias
        log_info "Instalando dependencias..."
        npm ci
        
        # Build
        log_info "Construyendo aplicación..."
        npm run build
        
        if [ $? -eq 0 ]; then
            log_success "Build completado"
            log_warning "Reinicia manualmente la aplicación cuando estés listo"
        else
            log_error "Error en build"
            exit 1
        fi
        ;;
        
    *)
        log_warning "Deploy manual necesario. Ejecuta uno de estos comandos según tu configuración:"
        echo ""
        echo "   Docker:    docker-compose down && docker-compose build --no-cache && docker-compose up -d"
        echo "   PM2:       npm run build && pm2 restart lacasadelsueloradiante"
        echo "   Node.js:   npm run build && [reinicia tu aplicación]"
        echo ""
        ;;
esac

# PASO 5: Verificación post-deploy
log_step "5. VERIFICACIÓN POST-DEPLOY"

# Esperar a que la aplicación esté lista
log_info "Esperando a que la aplicación esté lista..."
sleep 15

# Health check
log_info "Verificando health check..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

case $HTTP_STATUS in
    "200")
        log_success "Aplicación respondiendo correctamente (HTTP $HTTP_STATUS)"
        ;;
    "000")
        log_warning "No se pudo verificar el estado (¿curl instalado? ¿puerto correcto?)"
        ;;
    *)
        log_warning "Aplicación responde con HTTP $HTTP_STATUS (puede estar iniciándose aún)"
        ;;
esac

# Verificar logs si es Docker
if [ "$DEPLOY_TYPE" = "docker" ]; then
    log_info "Últimas líneas de logs:"
    docker-compose logs --tail=10
fi

# PASO 6: Instrucciones finales
log_step "6. PASOS SIGUIENTES"

echo ""
log_success "¡Deploy completado! 🎉"
echo ""
log_info "Ahora debes:"
echo ""
echo "   1. 📊 Verificar Supabase Storage:"
echo "      → Ir a: https://supabase.lacasadelsueloradianteapp.com/project/default/storage/buckets"
echo "      → Verificar que 'product-images' sea público"
echo ""
echo "   2. 🔒 Aplicar políticas RLS:"
echo "      → Ir a: https://supabase.lacasadelsueloradianteapp.com/project/default/sql"
echo "      → Ejecutar: cat scripts/setup-storage-policies.sql"
echo ""
echo "   3. 🌐 Probar la aplicación:"
echo "      → Abrir: https://lacasadelsueloradianteapp.com"
echo "      → Verificar que las imágenes cargan correctamente"
echo ""
echo "   4. 🔍 Ejecutar diagnóstico (opcional):"
echo "      → Comando: node scripts/diagnose-images-production.js"
echo ""

log_info "Comandos útiles:"
echo ""
case $DEPLOY_TYPE in
    "docker")
        echo "   Ver logs:       docker-compose logs -f"
        echo "   Reiniciar:      docker-compose restart"
        echo "   Estado:         docker-compose ps"
        ;;
    "pm2")
        echo "   Ver logs:       pm2 logs lacasadelsueloradiante"
        echo "   Reiniciar:      pm2 restart lacasadelsueloradiante"
        echo "   Estado:         pm2 status"
        ;;
    *)
        echo "   Ver logs:       [según tu configuración]"
        ;;
esac

echo ""
log_info "Documentación completa disponible en:"
echo "   → GUIA_ACTUALIZACION_VPS.md"
echo "   → QUICK_START_IMAGENES.md"
echo "   → ANALISIS_COMPLETO_IMAGENES.md"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                ✨ ACTUALIZACIÓN COMPLETADA ✨       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""