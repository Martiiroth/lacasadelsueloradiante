# 🧪 Guía de Pruebas - Integración Redsys

## 📋 Pre-requisitos

Antes de probar, asegúrate de:
- ✅ Haber ejecutado `database/add_redsys_fields.sql`
- ✅ Tener configurados métodos de pago y envío
- ✅ Variables de entorno configuradas en `.env`

## 🔧 Configuración Inicial

### 1. Verifica la Base de Datos
```bash
# En Supabase SQL Editor, ejecuta:
SELECT * FROM verify_redsys_fields.sql
```

### 2. Configura el Sistema
Visita: `http://localhost:3000/admin/checkout-setup`
- Haz clic en "Configurar Sistema de Checkout"
- Verifica que se creen métodos de pago y envío

### 3. Verifica el Método de Pago Redsys
```sql
SELECT * FROM payment_methods WHERE provider = 'Redsys';
```

## 🧪 Prueba 1: Checkout Básico

### Pasos:
1. Añade productos al carrito
2. Ve a `/checkout`
3. Completa datos de facturación
4. Completa datos de envío
5. Selecciona método de envío
6. **Selecciona "Tarjeta de Crédito/Débito"**
7. Revisa el pedido
8. Confirma

### Resultado Esperado:
- ✅ Se crea la orden en estado `pending`
- ✅ Aparece el formulario de pago con Redsys
- ✅ Se muestra el número de pedido
- ✅ Botón "Proceder al Pago"

## 🧪 Prueba 2: Pago con Tarjeta de Prueba

### Pasos:
1. Completa Prueba 1 hasta ver el formulario de Redsys
2. Haz clic en "Proceder al Pago"
3. Serás redirigido a Redsys (entorno de test)
4. Introduce datos de tarjeta de prueba:
   - **Número**: `4548812049400004`
   - **Caducidad**: Cualquier fecha futura (ej: 12/26)
   - **CVV**: `123`
   - **CIP/PIN**: `123456`
5. Confirma el pago

### Resultado Esperado:
- ✅ Redsys procesa el pago
- ✅ Te redirige a `/checkout/payment-result?status=success`
- ✅ Ves mensaje de "¡Pago Completado!"
- ✅ La orden cambia a estado `confirmed`
- ✅ El `payment_status` es `paid`

### Verificación en BD:
```sql
-- Ver la orden creada
SELECT 
    id, 
    status, 
    payment_status, 
    total_cents, 
    confirmation_number,
    created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver logs de la orden
SELECT 
    status,
    comment,
    details,
    created_at
FROM order_logs 
WHERE order_id = 'id-de-tu-orden'
ORDER BY created_at DESC;

-- Ver transacción de pago (si creaste la tabla)
SELECT 
    transaction_id,
    authorization_code,
    status,
    response_code,
    amount_cents
FROM payment_transactions
WHERE order_id = 'id-de-tu-orden';
```

## 🧪 Prueba 3: Pago Rechazado

### Pasos:
1. Repite Prueba 1 y 2
2. Usa tarjeta de rechazo:
   - **Número**: `4548810000000003`
   - **Caducidad**: Cualquier fecha futura
   - **CVV**: `123`

### Resultado Esperado:
- ✅ Redsys rechaza el pago
- ✅ Te redirige a `/checkout/payment-result?status=error`
- ✅ Ves mensaje de "Pago No Completado"
- ✅ La orden cambia a estado `cancelled`
- ✅ El `payment_status` es `failed`

## 🧪 Prueba 4: Callback de Redsys

### Verificar que el Callback Funciona:

```sql
-- Ver logs de la orden después del pago
SELECT 
    status,
    comment,
    details,
    created_at
FROM order_logs 
WHERE comment LIKE '%Redsys%'
ORDER BY created_at DESC;
```

Deberías ver:
- "Iniciando pago con Redsys"
- "Pago confirmado vía Redsys" (o "rechazado")

## 🧪 Prueba 5: Checkout como Invitado

### Pasos:
1. **Cierra sesión** si estás autenticado
2. Añade productos al carrito
3. Ve a `/checkout`
4. Verás el mensaje "Checkout como invitado"
5. Completa todos los pasos
6. Verifica que el campo `guest_email` se guarde

### Verificación:
```sql
SELECT 
    id,
    client_id,
    guest_email,
    billing_address->>'email' as billing_email
FROM orders 
WHERE guest_email IS NOT NULL
ORDER BY created_at DESC;
```

## 🧪 Prueba 6: Con Cupón de Descuento

### Pasos:
1. Crea un cupón de prueba (si no existe):
```sql
INSERT INTO coupons (code, description, discount_type, discount_value, applies_to, usage_limit, valid_from, valid_to)
VALUES ('TEST10', '10% de descuento', 'percentage', 10, 'order', 100, NOW(), NOW() + INTERVAL '30 days');
```

2. En el checkout, paso de pago:
   - Introduce el cupón: `TEST10`
   - Haz clic en "Aplicar"
   - Verifica que se aplique el descuento

3. Completa el pago

### Verificación:
```sql
SELECT 
    o.id,
    o.coupon_code,
    o.subtotal_cents,
    o.discount_cents,
    o.total_cents
FROM orders o
WHERE o.coupon_code IS NOT NULL
ORDER BY o.created_at DESC;

-- Ver uso del cupón
SELECT * FROM coupon_redemptions ORDER BY redeemed_at DESC;
```

## 📊 Panel de Verificación Completo

### Script SQL para ver todo:
```sql
-- Resumen de órdenes recientes
SELECT 
    o.id,
    o.confirmation_number,
    o.status,
    o.payment_status,
    pm.name as payment_method,
    pm.provider,
    o.total_cents / 100.0 as total_eur,
    o.guest_email,
    o.created_at
FROM orders o
LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Logs de las órdenes
SELECT 
    ol.order_id,
    o.confirmation_number,
    ol.status,
    ol.comment,
    ol.created_at
FROM order_logs ol
JOIN orders o ON ol.order_id = o.id
ORDER BY ol.created_at DESC
LIMIT 20;

-- Transacciones de pago
SELECT 
    pt.order_id,
    o.confirmation_number,
    pt.transaction_id,
    pt.authorization_code,
    pt.status,
    pt.response_code,
    pt.amount_cents / 100.0 as amount_eur,
    pt.created_at
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.id
ORDER BY pt.created_at DESC
LIMIT 10;
```

## 🐛 Solución de Problemas

### Error: "Método de pago no válido"
```sql
-- Verifica métodos de pago
SELECT * FROM payment_methods WHERE active = true;

-- Actualiza el proveedor
UPDATE payment_methods 
SET provider = 'Redsys' 
WHERE name LIKE '%Tarjeta%';
```

### Error: "Orden no encontrada" en callback
```bash
# Verifica los logs en la consola del servidor
# El callback debe recibir:
# - Ds_SignatureVersion
# - Ds_MerchantParameters
# - Ds_Signature
```

### El pago no se actualiza
```sql
-- Verifica que el callback se haya ejecutado
SELECT * FROM order_logs 
WHERE comment LIKE '%Redsys%'
ORDER BY created_at DESC;

-- Si no hay logs, el callback no llegó
-- Verifica la URL en NEXT_PUBLIC_APP_URL
```

## ✅ Checklist de Pruebas

- [ ] Base de datos verificada
- [ ] Métodos de pago configurados
- [ ] Métodos de envío configurados
- [ ] Checkout básico funciona
- [ ] Pago exitoso con tarjeta de prueba
- [ ] Pago rechazado funciona correctamente
- [ ] Callback de Redsys actualiza la orden
- [ ] Checkout como invitado funciona
- [ ] Cupones de descuento funcionan
- [ ] Emails de confirmación se envían (opcional)
- [ ] Página de resultado muestra info correcta

## 🎯 Criterios de Éxito

Una integración exitosa debe cumplir:

1. ✅ Crear orden en estado `pending`
2. ✅ Redirigir correctamente a Redsys
3. ✅ Recibir callback de Redsys
4. ✅ Actualizar estado a `confirmed` (pago exitoso)
5. ✅ Actualizar `payment_status` a `paid`
6. ✅ Crear logs con detalles de la transacción
7. ✅ Mostrar página de resultado correcta
8. ✅ Enviar email de confirmación (opcional)

## 📝 Notas Finales

- Todos los importes están en **céntimos**
- Los números de orden tienen máximo **12 caracteres**
- El entorno de test no requiere tarjetas reales
- En producción, necesitarás credenciales reales del banco

## 🎉 ¡Listo para Producción!

Una vez que todas las pruebas pasen:
1. Obtén credenciales reales de tu banco
2. Actualiza `.env` con credenciales de producción
3. Cambia `REDSYS_ENVIRONMENT=production`
4. Prueba con una transacción real pequeña
5. ¡Deploy y celebra! 🎊
