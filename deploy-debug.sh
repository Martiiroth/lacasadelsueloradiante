#!/bin/bash

# Script de deployment con diagnóstico completo
echo "🔍 DIAGNÓSTICO Y DEPLOYMENT PARA VPS"
echo "===================================="

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
print_info "=== FASE 1: DIAGNÓSTICO PREVIO ==="

# 1. Verificar archivos críticos
echo ""
print_info "Verificando archivos de configuración..."

if [ -f ".env.production" ]; then
    print_status "✅ .env.production encontrado"
    
    # Verificar variables críticas sin mostrar valores
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.production; then
        SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.production | cut -d'=' -f2)
        print_status "✅ SUPABASE_URL configurada: ${SUPABASE_URL}"
        
        # Probar conectividad a Supabase
        print_info "Probando conectividad a Supabase..."
        if curl -s -f --connect-timeout 10 "$SUPABASE_URL/health" > /dev/null 2>&1; then
            print_status "✅ Supabase accesible"
        else
            print_warning "⚠️ No se puede conectar a Supabase. Verificar URL o conectividad."
        fi
    else
        print_error "❌ SUPABASE_URL no configurada correctamente"
    fi
    
    if grep -q "EMAIL_USER=" .env.production && grep -q "EMAIL_PASSWORD=" .env.production; then
        print_status "✅ Configuración de email presente"
    else
        print_warning "⚠️ Configuración de email incompleta"
    fi
else
    print_error "❌ Archivo .env.production no encontrado"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    print_status "✅ Dockerfile encontrado"
else
    print_error "❌ Dockerfile no encontrado"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    print_status "✅ docker-compose.yml encontrado"
else
    print_error "❌ docker-compose.yml no encontrado"
    exit 1
fi

# 2. Verificar Docker
echo ""
print_info "Verificando Docker..."
if command -v docker &> /dev/null; then
    print_status "✅ Docker instalado: $(docker --version)"
    
    if docker info > /dev/null 2>&1; then
        print_status "✅ Docker daemon corriendo"
    else
        print_error "❌ Docker daemon no está corriendo"
        exit 1
    fi
else
    print_error "❌ Docker no instalado"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    print_status "✅ Docker Compose instalado: $(docker-compose --version)"
else
    print_error "❌ Docker Compose no instalado"
    exit 1
fi

# 3. Limpiar contenedores anteriores
echo ""
print_info "=== FASE 2: LIMPIEZA ==="
print_info "Deteniendo contenedores existentes..."

if docker-compose ps -q | grep -q .; then
    print_warning "Deteniendo contenedores activos..."
    docker-compose down --remove-orphans
    print_status "✅ Contenedores detenidos"
else
    print_info "No hay contenedores activos"
fi

# Limpiar imágenes antiguas (opcional)
print_info "Limpiando imágenes Docker antiguas..."
docker system prune -f > /dev/null 2>&1
print_status "✅ Sistema Docker limpiado"

# 4. Verificar espacio en disco
echo ""
print_info "Verificando espacio en disco..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "⚠️ Espacio en disco bajo: ${DISK_USAGE}% usado"
else
    print_status "✅ Espacio en disco adecuado: ${DISK_USAGE}% usado"
fi

# 5. Build de la aplicación
echo ""
print_info "=== FASE 3: BUILD ==="
print_info "Construyendo imagen Docker..."

if docker-compose build --no-cache; then
    print_status "✅ Imagen construida exitosamente"
else
    print_error "❌ Error construyendo imagen"
    print_info "Mostrando logs de build..."
    docker-compose logs --tail=50
    exit 1
fi

# 6. Iniciar servicios
echo ""
print_info "=== FASE 4: DEPLOYMENT ==="
print_info "Iniciando servicios..."

if docker-compose up -d; then
    print_status "✅ Servicios iniciados"
else
    print_error "❌ Error iniciando servicios"
    docker-compose logs --tail=50
    exit 1
fi

# 7. Verificar salud de los servicios
echo ""
print_info "=== FASE 5: VERIFICACIÓN ==="
print_info "Esperando que los servicios inicien..."

# Esperar un poco para que los servicios inicien
sleep 20

# Verificar que los contenedores estén corriendo
CONTAINER_STATUS=$(docker-compose ps --services --filter "status=running")
if [ -z "$CONTAINER_STATUS" ]; then
    print_error "❌ No hay contenedores corriendo"
    print_info "Mostrando logs..."
    docker-compose logs --tail=100
    exit 1
else
    print_status "✅ Contenedores corriendo: $CONTAINER_STATUS"
fi

# Verificar conectividad local
print_info "Probando conectividad a la aplicación..."
sleep 10

if curl -s -f --connect-timeout 15 "http://localhost:3000" > /dev/null 2>&1; then
    print_status "✅ Aplicación responde en puerto 3000"
else
    print_warning "⚠️ Aplicación no responde en puerto 3000"
    print_info "Verificando logs de la aplicación..."
    docker-compose logs nextjs-app --tail=50
fi

# Verificar APIs críticas
print_info "Probando endpoints críticos..."

# Test API health (si existe)
if curl -s -f --connect-timeout 10 "http://localhost:3000/api/health" > /dev/null 2>&1; then
    print_status "✅ API health endpoint responde"
else
    print_info "ℹ️ API health endpoint no disponible (opcional)"
fi

# Test API notifications
if curl -s -f --connect-timeout 10 "http://localhost:3000/api/notifications" > /dev/null 2>&1; then
    print_status "✅ API notifications endpoint accesible"
else
    print_warning "⚠️ API notifications endpoint no responde"
fi

echo ""
print_info "=== FASE 6: RESUMEN FINAL ==="

# Mostrar estado final
docker-compose ps

echo ""
print_status "🎉 DEPLOYMENT COMPLETADO"
echo ""
print_info "📋 INFORMACIÓN DE ACCESO:"
print_info "  • Aplicación: http://localhost:3000"
print_info "  • Para verificar logs: docker-compose logs -f"
print_info "  • Para detener: docker-compose down"
echo ""
print_info "📊 PRÓXIMOS PASOS:"
print_info "  1. Verificar que la aplicación carga correctamente en el navegador"
print_info "  2. Probar login y funcionalidades básicas"
print_info "  3. Verificar emails y PDF downloads"
print_info "  4. Configurar dominio y SSL si es necesario"
echo ""

# Mostrar logs recientes
print_info "📝 LOGS RECIENTES:"
docker-compose logs --tail=30 nextjs-app