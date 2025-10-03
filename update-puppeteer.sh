#!/bin/bash

# Script para actualizar contenedor con corrección de Puppeteer
# Ejecutar en VPS como: ./update-puppeteer.sh

set -e

echo "[ℹ️  INFO] === ACTUALIZACIÓN PUPPETEER ==="
echo "[ℹ️  INFO] Actualizando código desde Git..."

# Actualizar código
git pull origin main

echo "[ℹ️  INFO] Deteniendo contenedor actual..."
docker-compose down nextjs-app

echo "[ℹ️  INFO] Reconstruyendo imagen con Chromium..."
docker-compose build --no-cache nextjs-app

echo "[ℹ️  INFO] Iniciando contenedor actualizado..."
docker-compose up -d nextjs-app

echo "[ℹ️  INFO] Esperando que el servicio inicie..."
sleep 10

echo "[ℹ️  INFO] Verificando estado del contenedor..."
docker-compose ps nextjs-app

echo "[ℹ️  INFO] Mostrando logs recientes..."
docker-compose logs --tail=20 nextjs-app

echo "[✅ OK] 🎉 ACTUALIZACIÓN COMPLETADA"
echo ""
echo "[ℹ️  INFO] 📋 VERIFICAR:"
echo "[ℹ️  INFO]   • Probar descarga de PDF: https://lacasadelsueloradianteapp.com"
echo "[ℹ️  INFO]   • Ver logs: docker-compose logs -f nextjs-app"
echo "[ℹ️  INFO]   • Reiniciar: docker-compose restart nextjs-app"