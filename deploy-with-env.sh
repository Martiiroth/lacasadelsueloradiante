#!/bin/bash

# =======================================================
# Script para cargar variables de entorno y hacer build
# =======================================================

echo "🔍 Cargando variables de entorno desde .env.production..."

# Exportar todas las variables del archivo .env.production
if [ -f .env.production ]; then
    echo "✅ Archivo .env.production encontrado"
    
    # Leer y exportar variables
    export $(grep -v '^#' .env.production | xargs)
    
    echo "🔑 Variables cargadas:"
    echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."
    
    echo "🚀 Iniciando build de Docker..."
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        echo "✅ Build exitoso, iniciando contenedores..."
        docker-compose up -d
    else
        echo "❌ Error en el build"
        exit 1
    fi
else
    echo "❌ Archivo .env.production no encontrado"
    exit 1
fi