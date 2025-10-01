#!/bin/bash

# =======================================================
# Script directo para VPS - Variables de entorno
# =======================================================

echo "🛑 Parando contenedores existentes..."
docker-compose down

echo "🧹 Limpiando puertos ocupados..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true

echo "🔍 Cargando variables desde .env.production..."

# Método alternativo: usar env-file directamente en docker-compose
if [ -f .env.production ]; then
    echo "✅ Usando .env.production directamente"
    
    # Copiar .env.production como .env para docker-compose
    cp .env.production .env
    
    echo "🚀 Build completo con --no-cache..."
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        echo "✅ Build exitoso, iniciando..."
        docker-compose up -d
        
        echo "🔍 Verificando variables en el contenedor..."
        sleep 5
        docker-compose exec nextjs-app printenv | grep -E "(EMAIL|SUPABASE)" | head -10
    else
        echo "❌ Error en build"
        exit 1
    fi
else
    echo "❌ No se encuentra .env.production"
    exit 1
fi