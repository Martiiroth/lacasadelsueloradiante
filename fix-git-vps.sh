#!/bin/bash

# Script para resolver conflictos de git en VPS y hacer deployment limpio
echo "🔧 RESOLVIENDO CONFLICTOS GIT Y DEPLOYMENT"
echo "=========================================="

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
print_info "PASO 1: Resolver conflictos de git"
print_warning "El VPS tiene ramas divergentes. Vamos a hacer un reset limpio."

echo ""
print_info "Ejecutar estos comandos en el VPS:"
echo ""
echo "# 1. Hacer backup de cambios locales (por si acaso)"
echo "git stash push -m 'backup-antes-del-pull'"
echo ""
echo "# 2. Configurar estrategia de merge"  
echo "git config pull.rebase false"
echo ""
echo "# 3. Hacer reset hard al último commit remoto"
echo "git fetch origin main"
echo "git reset --hard origin/main"
echo ""
echo "# 4. Pull limpio"
echo "git pull origin main"
echo ""

print_info "PASO 2: Verificar que el pull fue exitoso"
echo "git log --oneline -5"
echo ""

print_info "PASO 3: Ejecutar deployment"
echo "# Usando Docker Compose"
echo "docker-compose down"
echo "docker-compose build --no-cache" 
echo "docker-compose up -d"
echo ""
echo "# O usando el script de deployment"
echo "./deploy.sh"
echo ""

print_info "PASO 4: Verificar que todo funciona"
echo "# Comprobar contenedores"
echo "docker-compose ps"
echo ""
echo "# Comprobar logs"
echo "docker-compose logs -f nextjs-app"
echo ""

print_warning "ALTERNATIVA - Reset completo si hay problemas:"
echo ""
echo "# Eliminar todo y clonar de nuevo"
echo "cd ~"
echo "rm -rf lacasadelsueloradiante"
echo "git clone https://github.com/Martiiroth/lacasadelsueloradiante.git"
echo "cd lacasadelsueloradiante"
echo "./deploy.sh"
echo ""

echo "🎯 COMANDOS RESUMIDOS PARA COPIAR/PEGAR:"
echo "========================================="
echo ""
echo "# EN EL VPS, ejecutar línea por línea:"
echo "cd ~/lacasadelsueloradiante"
echo "git stash push -m 'backup-antes-del-pull'"
echo "git config pull.rebase false"
echo "git fetch origin main"  
echo "git reset --hard origin/main"
echo "git pull origin main"
echo "docker-compose down"
echo "docker-compose build --no-cache"
echo "docker-compose up -d"
echo "docker-compose logs -f nextjs-app"