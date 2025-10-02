# Sistema de Generación Automática de Facturas

## Descripción General

Este sistema genera automáticamente facturas cuando un pedido cambia al estado "delivered" (entregado). La funcionalidad está integrada en el flujo administrativo y proporciona una experiencia fluida para los administradores.

## Componentes Principales

### 1. Servicio de Facturas (`src/lib/invoiceService.ts`)

**Funciones principales:**
- `generateInvoiceForOrder(orderId)`: Genera una factura automáticamente para un pedido
- `getNextInvoiceNumber()`: Obtiene el próximo número de factura disponible
- `incrementInvoiceCounter()`: Incrementa el contador de facturas

**Características:**
- ✅ Verifica si ya existe una factura para evitar duplicados
- ✅ Maneja contadores automáticos de números de factura
- ✅ Calcula fecha de vencimiento (30 días por defecto)
- ✅ Incluye todos los datos del pedido y cliente

### 2. Lógica de Activación (`src/lib/adminService.ts`)

**Función modificada:**
- `updateOrderStatus()`: Detecta cambios a estado "delivered" y activa generación de factura

**Flujo:**
```javascript
1. Administrador cambia estado de pedido a "delivered"
2. Se actualiza el estado en la base de datos
3. Se verifica si el nuevo estado es "delivered"
4. Si es así, se llama automáticamente a InvoiceService.generateInvoiceForOrder()
5. Se genera la factura con número secuencial
6. Se actualiza el contador de facturas
```

### 3. API Endpoints

**Endpoints creados:**

#### `GET/PUT /api/admin/orders/[id]`
- Obtiene y actualiza pedidos individuales
- Genera factura automáticamente en cambios a "delivered"

#### `POST /api/admin/orders/[id]/deliver`
- Endpoint específico para marcar pedidos como entregados
- Optimizado para mostrar información de factura generada

### 4. Componente de UI (`src/components/admin/DeliverOrderButton.tsx`)

**Características:**
- ✅ Botón especializado para marcar pedidos como entregados
- ✅ Modal de confirmación con información sobre generación de facturas
- ✅ Indicadores de carga durante el proceso
- ✅ Solo se muestra para pedidos que pueden ser entregados
- ✅ Feedback visual sobre la factura generada

### 5. Esquema de Base de Datos

**Tablas involucradas:**

```sql
-- Pedidos
orders (
  id, client_id, status, total_cents, 
  shipping_address, created_at, updated_at
)

-- Facturas
invoices (
  id, client_id, order_id, invoice_number, 
  prefix, suffix, total_cents, currency,
  created_at, due_date, status
)

-- Contador de facturas
invoice_counters (
  id, prefix, suffix, next_number
)
```

## Uso del Sistema

### Para Administradores

1. **Acceder al pedido:**
   - Ir a `/admin/orders`
   - Seleccionar el pedido deseado

2. **Marcar como entregado:**
   - Usar el botón verde "Marcar como Entregado"
   - Confirmar en el modal que aparece
   - El sistema generará automáticamente la factura

3. **Verificar factura:**
   - La factura aparecerá inmediatamente en el pedido
   - Se asignará número secuencial automático
   - Estado inicial: "pending"

### Estados de Pedido Válidos

| Estado | Descripción | Permite Entrega |
|---------|-------------|----------------|
| pending | Pendiente | ✅ |
| confirmed | Confirmado | ✅ |
| processing | Procesando | ✅ |
| shipped | Enviado | ✅ |
| **delivered** | **Entregado** | ➡️ **Genera Factura** |
| cancelled | Cancelado | ❌ |

## Configuración de Facturas

### Numeración Automática

El sistema usa la tabla `invoice_counters` para manejar la numeración:

```javascript
// Configuración por defecto
{
  prefix: "FAC-",    // Prefijo de factura
  suffix: "",        // Sufijo (opcional)
  next_number: 1     // Próximo número disponible
}

// Resultado: FAC-1, FAC-2, FAC-3, etc.
```

### Personalización

Para cambiar el formato de numeración:

```sql
UPDATE invoice_counters 
SET prefix = 'FACT-', suffix = '/2024'
WHERE id = 'counter_id';
```

## Verificación y Pruebas

### Script de Verificación

```bash
# Verificar estructura de base de datos
node scripts/test-simple-invoice.mjs

# Prueba completa del sistema
node scripts/test-auto-invoice.mjs
```

### Casos de Prueba

1. **Pedido sin factura → Delivered:**
   - ✅ Debe generar nueva factura
   - ✅ Número secuencial correcto
   - ✅ Datos completos del pedido y cliente

2. **Pedido con factura → Delivered:**
   - ✅ No debe crear factura duplicada
   - ✅ Debe mostrar factura existente

3. **Estados no válidos:**
   - ✅ Cancelled → Delivered: No debe permitirse
   - ✅ Delivered → Otros: No debe regenerar factura

## Manejo de Errores

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "No se pudo crear factura" | Contador no configurado | Ejecutar setup inicial |
| "Factura duplicada" | Ya existe factura | Verificar en base de datos |
| "Cliente no encontrado" | Datos incompletos | Verificar relación client_id |

### Logs del Sistema

El sistema genera logs detallados:

```javascript
// Ejemplos de logs
📄 Generando factura para pedido: abc-123
✅ Factura FAC-42 creada exitosamente  
⚠️ Ya existe una factura para el pedido abc-123
❌ Error generando factura para pedido abc-123
```

## Seguridad

### Validaciones Implementadas

- ✅ Autenticación de administrador requerida
- ✅ Validación de estados de pedido
- ✅ Verificación de existencia de pedido
- ✅ Prevención de facturas duplicadas
- ✅ Transacciones atómicas en base de datos

### Permisos

Solo usuarios con rol administrativo pueden:
- Cambiar estados de pedidos
- Generar facturas
- Acceder a endpoints de administración

## Futuras Mejoras

### Posibles Extensiones

1. **Notificaciones por Email:**
   - Enviar factura PDF por email al cliente
   - Notificación de entrega al cliente

2. **Generación de PDF:**
   - Crear PDF de factura automáticamente
   - Plantilla personalizable

3. **Integración Contable:**
   - Exportar a sistemas contables
   - Sincronización con software externo

4. **Facturación por Lotes:**
   - Marcar múltiples pedidos como entregados
   - Generación masiva de facturas

### Configuraciones Avanzadas

```javascript
// Configurar vencimiento dinámico por cliente
const dueDate = calculateDueDateByClient(clientId)

// Aplicar descuentos automáticos
const invoice = applyClientDiscounts(baseInvoice, clientId)

// Diferentes numeraciones por año
const invoiceNumber = getYearlyInvoiceNumber(year)
```

## Contacto de Soporte

Para problemas técnicos con el sistema de facturas automáticas, contactar al equipo de desarrollo con:

1. **ID del pedido afectado**
2. **Logs de error específicos**  
3. **Pasos para reproducir el problema**
4. **Estado actual vs. estado esperado**

---

*Última actualización: Octubre 2024*