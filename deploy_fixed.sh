#!/bin/bash

# =======================================================
# SCRIPT DE DEPLOYMENT CORREGIDO - VPS PRODUCTION 
# La Casa del Suelo Radiante - Con manejo de variables
# =======================================================

set -e  # Salir en caso de error

echo "🚀 INICIANDO DEPLOYMENT CORREGIDO..."
echo "======================================"

# 1. Verificar que estamos en el directorio correcto
if [ ! -f ".env.production" ]; then
    echo "❌ ERROR: No se encuentra .env.production en el directorio actual"
    echo "Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

# 2. Limpiar contenedores y caché previos
echo "🧹 Limpiando contenedores y caché previos..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f

# 3. Cargar variables de entorno de forma segura
echo "📋 Cargando variables de entorno..."
set -a
source .env.production
set +a

# 4. Verificar variables críticas
echo "✅ Verificando variables críticas..."
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"  
    "SUPABASE_SERVICE_ROLE_KEY"
    "EMAIL_USER"
    "EMAIL_PASSWORD"
    "NEXTAUTH_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERROR: La variable $var no está configurada"
        exit 1
    fi
done

echo "✅ Todas las variables críticas están configuradas"

# 5. Exportar variables para Docker
echo "🔧 Exportando variables para Docker..."
export NEXT_PUBLIC_SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY
export SUPABASE_SERVICE_ROLE_KEY
export EMAIL_USER
export EMAIL_PASSWORD
export EMAIL_FROM_NAME
export EMAIL_FROM_ADDRESS
export EMAIL_REPLY_TO
export EMAIL_ADMIN_ADDRESS
export NODE_ENV
export NEXTAUTH_URL
export NEXTAUTH_SECRET
export DATABASE_URL
export DATABASE_PASSWORD
export NEXT_PUBLIC_APP_URL
export NEXT_PUBLIC_API_URL
export BUSINESS_NAME
export BUSINESS_ADDRESS
export BUSINESS_PHONE
export BUSINESS_EMAIL
export BUSINESS_CIF

# 6. Construir contenedores con variables
echo "🔨 Construyendo contenedores con variables de entorno..."
docker-compose build --no-cache --progress=plain

# 7. Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# 8. Verificar estado de los servicios
echo "⏳ Esperando a que los servicios estén listos..."
sleep 15

echo "🔍 Estado de los servicios:"
docker-compose ps

# 9. Verificar logs de la aplicación
echo "📋 Logs de la aplicación Next.js:"
docker-compose logs --tail=20 nextjs-app

# 10. Verificar conectividad
echo "🔗 Verificando conectividad..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Aplicación funcionando en http://localhost:3000"
else
    echo "⚠️  La aplicación aún se está iniciando, verifica los logs"
fi

# 11. Mostrar información de deployment
echo ""
echo "🎉 DEPLOYMENT COMPLETADO"
echo "======================="
echo "🌐 URL Local: http://localhost:3000"
echo "🌐 URL Nginx: http://localhost"
echo "📊 Monitoreo: docker-compose logs -f"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose logs -f [servicio]"
echo "   - Reiniciar: docker-compose restart [servicio]"
echo "   - Parar: docker-compose down"
echo "   - Estado: docker-compose ps"
echo ""