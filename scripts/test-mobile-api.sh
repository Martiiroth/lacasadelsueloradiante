#!/bin/bash

# Script para probar la API de productos móvil con curl
# Ejecutar: chmod +x scripts/test-mobile-api.sh && ./scripts/test-mobile-api.sh

BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

echo "🧪 Probando API de productos para móvil..."
echo "📍 Base URL: $BASE_URL"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  TEST 1: Listar productos (primeros 5)"
echo "═══════════════════════════════════════════════════════════"
curl -s "$BASE_URL/api/mobile/products?limit=5" | jq '.'
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  TEST 2: Productos en stock"
echo "═══════════════════════════════════════════════════════════"
curl -s "$BASE_URL/api/mobile/products?in_stock=true&limit=3" | jq '.'
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  TEST 3: Listar categorías"
echo "═══════════════════════════════════════════════════════════"
curl -s "$BASE_URL/api/mobile/categories" | jq '.'
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  TEST 4: Detalle de primer producto"
echo "═══════════════════════════════════════════════════════════"
FIRST_SLUG=$(curl -s "$BASE_URL/api/mobile/products?limit=1" | jq -r '.data[0].slug')
if [ "$FIRST_SLUG" != "null" ] && [ -n "$FIRST_SLUG" ]; then
  echo "Obteniendo detalle de: $FIRST_SLUG"
  curl -s "$BASE_URL/api/mobile/products/$FIRST_SLUG" | jq '.'
else
  echo "❌ No se pudo obtener el slug del primer producto"
fi
echo ""

echo "✅ Pruebas completadas"
