#!/bin/bash

# Script para diagnosticar y actualizar sistema de facturas en producción
# Ejecutar en el servidor VPS

echo "🔍 DIAGNÓSTICO DEL SISTEMA DE FACTURAS EN PRODUCCIÓN"
echo "=================================================="

# Verificar conectividad básica
echo "1. Verificando conectividad básica..."
curl -s -I https://lacasadelsueloradiante.es/ | head -1

# Verificar APIs específicas de facturas
echo "2. Verificando API de facturas..."
echo "   - API nueva (jsPDF): /api/invoices-new"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://lacasadelsueloradiante.es/api/invoices-new

echo "   - API antigua: /api/invoices"  
curl -s -o /dev/null -w "Status: %{http_code}\n" https://lacasadelsueloradiante.es/api/invoices

# Verificar página de facturas del dashboard
echo "3. Verificando página de facturas..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://lacasadelsueloradiante.es/dashboard/invoices

echo ""
echo "🚀 COMANDOS DE DESPLIEGUE EN VPS:"
echo "================================="
echo ""
echo "Conectar al VPS y ejecutar:"
echo ""
echo "ssh root@tu-servidor"
echo "cd ~/lacasadelsueloradiante"
echo "git pull origin main"
echo "docker-compose down"
echo "docker-compose build --no-cache"  
echo "docker-compose up -d"
echo ""
echo "Verificar logs:"
echo "docker-compose logs -f nextjs-app"
echo ""
echo "Probar APIs:"
echo "curl http://localhost:3000/api/invoices-new"
echo ""
echo "✅ Una vez desplegado, las facturas funcionarán con:"
echo "   - ✅ jsPDF (más rápido)"
echo "   - ✅ shadcn UI (interfaz moderna)"  
echo "   - ✅ Generación automática al entregar pedidos"
echo "   - ✅ Envío por email con PDF adjunto"