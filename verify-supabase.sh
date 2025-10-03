#!/bin/bash

# Script para verificar y corregir configuración de Supabase
echo "🔍 VERIFICANDO CONFIGURACIÓN DE SUPABASE"
echo "========================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✅]${NC} $1"; }
print_error() { echo -e "${RED}[❌]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠️]${NC} $1"; }

echo ""
echo "1. Verificando URL de Supabase actual..."

if [ -f ".env.production" ]; then
    CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.production | cut -d'=' -f2)
    echo "   URL actual: $CURRENT_URL"
    
    # Probar conectividad
    echo "2. Probando conectividad..."
    
    if curl -s -f --connect-timeout 10 "$CURRENT_URL/health" > /dev/null 2>&1 || \
       curl -s -f --connect-timeout 10 "$CURRENT_URL" > /dev/null 2>&1; then
        print_status "URL de Supabase es accesible"
    else
        print_error "URL de Supabase NO es accesible"
        echo ""
        echo "🔧 OPCIONES DE SOLUCIÓN:"
        echo ""
        echo "A) Si usas Supabase Cloud, la URL debería ser:"
        echo "   https://[tu-project-id].supabase.co"
        echo ""
        echo "B) Si usas Supabase auto-hospedado, verificar:"
        echo "   - El servidor está corriendo"
        echo "   - La configuración DNS es correcta"
        echo "   - Los certificados SSL están configurados"
        echo ""
        echo "C) Para usar la configuración corregida:"
        echo "   cp .env.production.fixed .env.production"
        echo "   # Y editar la URL correcta de tu proyecto Supabase"
        echo ""
    fi
else
    print_error "Archivo .env.production no encontrado"
fi

echo ""
echo "3. Para verificar tu URL de Supabase real:"
echo "   - Ve a https://supabase.com/dashboard"
echo "   - Selecciona tu proyecto"
echo "   - Ve a Settings > API"
echo "   - Copia la 'Project URL'"