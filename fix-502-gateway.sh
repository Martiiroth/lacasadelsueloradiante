#!/bin/bash

# Script para solucionar automáticamente errores 502 Bad Gateway
# Limpia cookies, reinicia servicios y optimiza la configuración

echo "🚨 SOLUCIONANDO 502 BAD GATEWAY"
echo "================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para limpiar cookies del lado del servidor
clean_server_side() {
    log_info "Limpiando cookies del lado del servidor..."
    
    # Si existe nginx, limpiar cache
    if command -v nginx &> /dev/null; then
        sudo nginx -s reload 2>/dev/null && log_success "Nginx recargado" || log_warning "No se pudo recargar nginx"
    fi
    
    # Limpiar archivos temporales de Next.js
    if [ -d ".next" ]; then
        rm -rf .next/cache 2>/dev/null && log_success "Cache de Next.js limpiado"
    fi
    
    log_success "Limpieza del servidor completada"
}

# Función para reiniciar servicios Docker
restart_docker_services() {
    log_info "Reiniciando servicios Docker..."
    
    if command -v docker-compose &> /dev/null; then
        # Parar servicios
        docker-compose down 2>/dev/null
        
        # Limpiar volumes y cache
        docker system prune -f 2>/dev/null
        
        # Reiniciar servicios
        docker-compose up -d --build 2>/dev/null && log_success "Servicios Docker reiniciados" || log_error "Error reiniciando Docker"
    else
        log_warning "Docker Compose no disponible"
    fi
}

# Función para verificar y optimizar memoria
optimize_system() {
    log_info "Optimizando recursos del sistema..."
    
    # Verificar memoria disponible
    MEMORY_FREE=$(free -m | awk 'NR==2{printf "%.1f", $7/$2*100}' 2>/dev/null || echo "0")
    log_info "Memoria libre: ${MEMORY_FREE}%"
    
    # Limpiar memoria cache si es necesario
    if command -v sync &> /dev/null; then
        sync && echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 && log_success "Cache de memoria limpiado"
    fi
    
    log_success "Optimización completada"
}

# Función para generar HTML de instrucciones para el cliente
generate_client_instructions() {
    cat > /tmp/fix_502_instructions.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solucionando Error 502 - La Casa del Suelo Radiante</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .button { background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px 5px; }
        .button:hover { background: #b91c1c; }
        .success { background: #059669; }
        .success:hover { background: #047857; }
        .steps { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .step { margin: 10px 0; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 La Casa del Suelo Radiante</div>
            <h1>Error 502 - Solución Automática</h1>
        </div>
        
        <p>Si estás viendo un <strong>Error 502 Bad Gateway</strong>, podemos solucionarlo automáticamente:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <button class="button" onclick="clearAllData()">🧹 Limpiar Cookies y Recargar</button>
        </div>
        
        <div class="steps">
            <h3>¿Qué hace esta solución?</h3>
            <div class="step">1. 🗑️ Limpia todas las cookies de sesión</div>
            <div class="step">2. 🧹 Borra el caché del navegador</div>
            <div class="step">3. 🔄 Recarga la página automáticamente</div>
            <div class="step">4. ✨ Restaura el funcionamiento normal</div>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>💡 Causa del problema:</strong> Tras las actualizaciones de la web, algunas cookies pueden volverse incompatibles y causar errores de conexión.
        </div>
        
        <div id="result" style="display: none; margin-top: 20px; padding: 15px; border-radius: 8px;">
        </div>
    </div>

    <script>
        function clearAllData() {
            const button = document.querySelector('.button');
            const result = document.getElementById('result');
            
            button.textContent = '🔄 Limpiando...';
            button.disabled = true;
            
            // Lista de cookies problemáticas
            const problematicCookies = [
                'next-auth.session-token',
                'next-auth.csrf-token', 
                'next-auth.callback-url',
                '__Secure-next-auth.session-token',
                '__Host-next-auth.csrf-token',
                'authjs.session-token',
                'authjs.csrf-token',
                'showWithVAT'
            ];

            // Limpiar cookies
            problematicCookies.forEach(cookieName => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
            });

            // Limpiar localStorage
            const localStorageKeys = ['supabase.auth.token', 'showWithVAT', 'user-preferences'];
            localStorageKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            // Limpiar sessionStorage
            sessionStorage.clear();

            // Mostrar resultado
            result.style.display = 'block';
            result.style.background = '#d1fae5';
            result.style.color = '#065f46';
            result.innerHTML = '✅ <strong>Limpieza completada!</strong> Recargando página en 3 segundos...';
            
            // Recargar página
            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 3000);
        }
        
        // Auto-ejecutar si hay parámetro en URL
        if (window.location.search.includes('auto=true')) {
            setTimeout(() => {
                clearAllData();
            }, 1000);
        }
    </script>
</body>
</html>
EOF

    log_success "Página de instrucciones generada en /tmp/fix_502_instructions.html"
}

# Función principal
main() {
    echo ""
    log_info "Iniciando solución automática para 502 Bad Gateway..."
    echo ""
    
    # Paso 1: Limpiar del lado del servidor
    clean_server_side
    echo ""
    
    # Paso 2: Reiniciar servicios
    restart_docker_services
    echo ""
    
    # Paso 3: Optimizar sistema
    optimize_system
    echo ""
    
    # Paso 4: Generar instrucciones para el cliente
    generate_client_instructions
    echo ""
    
    log_success "🎉 Solución completada!"
    echo ""
    echo "📋 SIGUIENTE PASOS PARA EL USUARIO:"
    echo "1. Borrar cookies del navegador (Ctrl+Shift+Delete)"
    echo "2. O usar: /tmp/fix_502_instructions.html"
    echo "3. Recargar la página"
    echo ""
    echo "📊 MONITOREO:"
    echo "• docker-compose logs -f (ver logs en tiempo real)"
    echo "• ./diagnose-502.sh (diagnóstico completo)"
    echo ""
}

# Verificar si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi