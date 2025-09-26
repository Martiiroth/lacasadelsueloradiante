#!/bin/bash

# Script de despliegue para VPS
# Ejecutar con: chmod +x deploy.sh && ./deploy.sh

echo "🚀 Iniciando despliegue en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Instálalo primero."
    exit 1
fi

# Verificar archivo de entorno
if [ ! -f .env.production ]; then
    print_error "Archivo .env.production no encontrado."
    print_warning "Copia .env.production.example a .env.production y completa los valores."
    exit 1
fi

# Construir y desplegar
print_status "Deteniendo contenedores existentes..."
docker-compose down

print_status "Construyendo imágenes..."
docker-compose build --no-cache

print_status "Iniciando servicios..."
docker-compose up -d

print_status "Esperando que los servicios inicien..."
sleep 30

# Verificar que los servicios estén corriendo
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Despliegue completado exitosamente!"
    print_status "La aplicación debería estar disponible en:"
    print_status "  - HTTP: http://tu-dominio.com"
    print_status "  - HTTPS: https://tu-dominio.com"
else
    print_error "❌ Algunos servicios no están corriendo correctamente."
    print_warning "Revisa los logs con: docker-compose logs"
fi

# Mostrar logs de los últimos minutos
print_status "Mostrando logs recientes..."
docker-compose logs --tail=50