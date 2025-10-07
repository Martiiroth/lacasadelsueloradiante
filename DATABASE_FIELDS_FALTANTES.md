# 📋 Campos Faltantes en la Base de Datos para Redsys

## ❌ Campos que FALTAN en la tabla `orders`

Según el schema actual, la tabla `orders` solo tiene:
```sql
id, client_id, status, total_cents, shipping_address, created_at, updated_at
```

### 🔴 Campos NECESARIOS que faltan:

1. **`guest_email`** (TEXT)
   - Para permitir checkout sin cuenta de usuario
   - Almacena el email del comprador invitado

2. **`payment_status`** (TEXT)
   - Estado del pago: 'pending', 'paid', 'failed', 'refunded', 'cancelled'
   - **CRÍTICO para Redsys**

3. **`billing_address`** (JSONB)
   - Dirección de facturación del cliente
   - Contiene nombre, email, teléfono, dirección fiscal

4. **`shipping_method_id`** (UUID)
   - Foreign key a `shipping_methods`
   - Identifica el método de envío seleccionado

5. **`payment_method_id`** (UUID)
   - Foreign key a `payment_methods`
   - Identifica si es Redsys, PayPal, etc.
   - **CRÍTICO para detectar pagos con tarjeta**

6. **`coupon_code`** (TEXT)
   - Código de cupón aplicado al pedido

7. **`discount_cents`** (INTEGER)
   - Descuento aplicado en céntimos

8. **`shipping_cost_cents`** (INTEGER)
   - Coste de envío en céntimos

9. **`subtotal_cents`** (INTEGER)
   - Subtotal antes de envío y descuentos

10. **`confirmation_number`** (TEXT)
    - Número de confirmación único del pedido
    - Formato: ORD-YYYYMMDD-XXXX

## ❌ Campos que FALTAN en la tabla `order_logs`

1. **`status`** (TEXT)
   - Estado de la orden en ese momento del log

2. **`comment`** (TEXT)
   - Comentario descriptivo del evento
   - Usado para mensajes de Redsys

## 🔴 Constraint que FALTA en `orders.status`

El constraint actual solo permite 'pending', pero necesitamos:
- 'pending'
- 'confirmed' ← **NECESARIO para pago exitoso**
- 'processing'
- 'shipped'
- 'delivered'
- 'cancelled'
- 'refunded'

## 📊 Tabla NUEVA que se recomienda crear

### `payment_transactions`
Tabla para registrar transacciones de pago con Redsys:

```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    transaction_id TEXT,  -- DS_ORDER de Redsys
    authorization_code TEXT,  -- DS_AUTHORISATIONCODE
    amount_cents INTEGER,
    status TEXT,
    response_code TEXT,
    response_message TEXT,
    card_type TEXT,
    card_country TEXT,
    raw_response JSONB,
    created_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

## 🚀 Cómo Aplicar los Cambios

### Opción 1: Ejecutar el script SQL
```bash
psql -h your-host -U your-user -d your-database -f database/add_redsys_fields.sql
```

### Opción 2: Desde Supabase Dashboard
1. Ve a SQL Editor en Supabase
2. Copia el contenido de `database/add_redsys_fields.sql`
3. Ejecuta el script

### Opción 3: Usando el cliente de Supabase
```sql
-- Copiar y pegar el contenido del archivo en el SQL Editor de Supabase
```

## ✅ Verificación

Después de ejecutar el script, verifica:

```sql
-- Ver estructura actualizada de orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Verificar que payment_transactions existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payment_transactions'
);
```

## 📝 Impacto en el Código

### Archivos que usan estos campos:

1. **`src/lib/orders.ts`** - OrderService.createOrder()
   - Guarda billing_address, shipping_method_id, payment_method_id
   
2. **`src/app/api/payments/redsys/callback/route.ts`**
   - Actualiza payment_status a 'paid' o 'failed'
   - Actualiza status a 'confirmed' o 'cancelled'

3. **`src/types/checkout.ts`**
   - Define interfaces para Order, OrderConfirmation
   - Espera estos campos en las respuestas

## ⚠️ IMPORTANTE

**SIN ESTOS CAMPOS LA INTEGRACIÓN DE REDSYS NO FUNCIONARÁ**

Específicamente:
- Sin `payment_status` → No se puede marcar el pago como completado
- Sin `payment_method_id` → No se puede detectar que es pago con tarjeta
- Sin `billing_address` → No se puede almacenar info de facturación
- Sin `confirmation_number` → No se puede generar número de pedido único

## 🎯 Resumen

**Total de campos a añadir: 10**
**Nueva tabla a crear: 1**
**Constraints a actualizar: 2**

Ejecuta el script `database/add_redsys_fields.sql` para aplicar todos los cambios de una vez.
