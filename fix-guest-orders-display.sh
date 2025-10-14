#!/bin/bash

# Script para agregar el campo billing_address a la tabla orders
# Esto permitirá mostrar datos de clientes no registrados en el admin

echo "🔧 Agregando campo billing_address a la tabla orders..."

# Ejecutar el script SQL
echo "📝 Ejecutando cambios en la base de datos..."
echo ""
echo "POR FAVOR, ejecuta este SQL en tu panel de Supabase:"
echo "================================================="
cat database/add_billing_address_field.sql
echo "================================================="
echo ""
echo "O si tienes acceso directo a psql:"
echo "psql -f database/add_billing_address_field.sql"
echo ""
echo "✅ Una vez ejecutado, los pedidos de invitados mostrarán los datos del cliente en el admin."