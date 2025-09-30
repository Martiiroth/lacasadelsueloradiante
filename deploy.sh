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
    cp .env.production.example .env.production
    print_warning "Archivo .env.production creado. Edítalo antes de continuar."
    exit 1
fi

# Verificar certificados SSL
if [ ! -d "nginx/ssl" ]; then
    print_status "Creando directorio nginx/ssl..."
    mkdir -p nginx/ssl
fi

if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    print_warning "Certificados SSL no encontrados."
    print_status "Generando certificados auto-firmados para testing..."
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
        -subj "/C=ES/ST=Madrid/L=Madrid/O=La Casa del Suelo Radiante/CN=lacasadelsueloradianteapp.com"
    print_warning "ADVERTENCIA: Certificados auto-firmados. Para producción usa Let's Encrypt."
fi

# Verificar variables críticas
print_status "Verificando variables de entorno críticas..."
if ! grep -q "EMAIL_USER=" .env.production || ! grep -q "EMAIL_PASSWORD=" .env.production; then
    print_warning "Variables de email no configuradas. El sistema de notificaciones no funcionará."
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