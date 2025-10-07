# Integración de Redsys para Pagos con Tarjeta

## 📋 Resumen

Se ha implementado la integración completa de Redsys como pasarela de pago para procesar pagos con tarjeta de crédito/débito en el checkout de la tienda.

## 🎯 Características Implementadas

### 1. Servicio de Redsys (`src/lib/redsys.ts`)
- ✅ Generación de firmas HMAC SHA256 según especificaciones de Redsys
- ✅ Codificación/decodificación de parámetros en Base64
- ✅ Creación de formularios de pago con todos los parámetros requeridos
- ✅ Validación de respuestas de Redsys (verificación de firma)
- ✅ Procesamiento de códigos de respuesta de transacciones
- ✅ Soporte para entornos de pruebas y producción

### 2. API Routes
- ✅ `POST /api/payments/redsys/create` - Prepara transacción de pago
- ✅ `POST /api/payments/redsys/callback` - Recibe notificaciones de Redsys

### 3. Componentes
- ✅ `RedsysPaymentForm` - Formulario de pago con tarjeta
- ✅ Página de resultado `/checkout/payment-result` - Muestra éxito/error del pago

### 4. Flujo de Checkout Modificado
- ✅ Detección automática de método de pago Redsys
- ✅ Creación de orden antes de redirigir al pago
- ✅ Redirección automática a Redsys para pago seguro
- ✅ Manejo de callbacks y actualización de estado de orden

## 🔧 Configuración

### Variables de Entorno

Añade estas variables a tu archivo `.env`:

```bash
# REDSYS PAYMENT GATEWAY
# Código de comercio proporcionado por tu banco
REDSYS_MERCHANT_CODE=999008881

# Terminal (normalmente 001)
REDSYS_TERMINAL=001

# Clave secreta para firmar transacciones
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7

# Moneda (978 = EUR)
REDSYS_CURRENCY=978

# Entorno: test o production
REDSYS_ENVIRONMENT=test
```

### Credenciales de Prueba

Para el entorno de pruebas, puedes usar estas credenciales:
- **Merchant Code**: `999008881`
- **Terminal**: `001`
- **Secret Key**: `sq7HjrUOBfKmC576ILgskD5srU870gJ7`

### Tarjetas de Prueba

Para realizar pagos de prueba en el entorno de test de Redsys:

#### ✅ Transacciones Autorizadas
- **Número**: `4548812049400004`
- **Caducidad**: Cualquier fecha futura
- **CVV**: `123`
- **CIP**: `123456`

#### ❌ Transacciones Denegadas
- **Número**: `4548810000000003`
- **Caducidad**: Cualquier fecha futura
- **CVV**: `123`

## 🚀 Flujo de Pago

### 1. Usuario Completa el Checkout
El usuario llena los formularios de:
- Dirección de facturación
- Dirección de envío
- Método de envío y pago (selecciona "Tarjeta de Crédito/Débito")

### 2. Revisión del Pedido
El usuario revisa su pedido y confirma

### 3. Creación de Orden
- Se crea la orden en estado `pending`
- Se genera un número de orden único

### 4. Redirección a Redsys
- Se genera el formulario de pago con firma
- El usuario es redirigido a la pasarela de Redsys
- El usuario introduce los datos de su tarjeta

### 5. Procesamiento del Pago
- Redsys procesa el pago
- Envía notificación al callback de tu servidor
- Actualiza el estado de la orden según el resultado

### 6. Retorno al Sitio
- El usuario es redirigido a `/checkout/payment-result`
- Se muestra el resultado del pago (éxito o error)

## 📡 Endpoints API

### Crear Transacción
```http
POST /api/payments/redsys/create
Content-Type: application/json

{
  "orderId": "uuid-de-orden",
  "amount": 10000,  // En céntimos (100.00 EUR)
  "description": "Pedido #ABC123",
  "consumerName": "Juan Pérez"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "paymentForm": {
    "Ds_SignatureVersion": "HMAC_SHA256_V1",
    "Ds_MerchantParameters": "base64-encoded-params",
    "Ds_Signature": "signature-hash",
    "redsysUrl": "https://sis-t.redsys.es:25443/sis/realizarPago"
  }
}
```

### Callback de Redsys
```http
POST /api/payments/redsys/callback
Content-Type: application/x-www-form-urlencoded

Ds_SignatureVersion=HMAC_SHA256_V1
Ds_MerchantParameters=base64-encoded-response
Ds_Signature=signature-hash
```

## 🔒 Seguridad

### Verificación de Firmas
- Todas las comunicaciones con Redsys están firmadas con HMAC SHA256
- Se valida la firma en cada respuesta antes de procesar
- Se rechaza cualquier respuesta con firma inválida

### URLs de Callback
- El callback es un endpoint protegido que solo procesa peticiones válidas de Redsys
- Se valida la firma antes de actualizar el estado de las órdenes

### Manejo de Datos Sensibles
- Nunca se almacenan datos de tarjetas en el servidor
- Todo el procesamiento de pagos ocurre en Redsys
- Solo se reciben códigos de autorización y resultado

## 🧪 Pruebas

### Actualizar Método de Pago en Base de Datos

Si ya tienes métodos de pago creados, actualiza el proveedor de tarjetas a Redsys:

```sql
UPDATE payment_methods 
SET provider = 'Redsys' 
WHERE name = 'Tarjeta de Crédito/Débito';
```

O ejecuta el script de configuración:
```bash
# Accede a /admin/checkout-setup y ejecuta la configuración
```

### Flujo de Prueba Completo

1. **Añade productos al carrito**
2. **Inicia el checkout**
3. **Completa los datos de facturación y envío**
4. **Selecciona "Tarjeta de Crédito/Débito" como método de pago**
5. **Revisa y confirma el pedido**
6. **Introduce los datos de la tarjeta de prueba en Redsys**
7. **Verifica la redirección y confirmación**

## 🐛 Solución de Problemas

### Error: "Firma inválida"
- Verifica que el `SECRET_KEY` sea correcto
- Asegúrate de que el entorno (`test`/`production`) coincide con las credenciales

### Error: "Orden no encontrada"
- Verifica que la orden se haya creado correctamente en la base de datos
- Revisa los logs del callback en la consola

### Pago no se actualiza
- Verifica que la URL de callback sea accesible desde internet (en producción)
- Redsys necesita poder hacer POST a tu callback
- En desarrollo local, considera usar ngrok o similar

### Transacción denegada
- Verifica que uses tarjetas de prueba válidas
- En producción, el usuario debe verificar con su banco

## 🎨 Personalización

### Cambiar Textos e Idioma
Modifica los componentes en:
- `src/components/checkout/RedsysPaymentForm.tsx`
- `src/app/checkout/payment-result/page.tsx`

### Añadir Métodos de Pago Adicionales
Edita `src/lib/checkout-test-data.ts` para añadir más proveedores

### Modificar Flujo de Checkout
El flujo principal está en `src/app/checkout/page.tsx`

## 📦 Dependencias Instaladas

```json
{
  "redsys-easy": "^latest",
  "redsys-pos": "^latest"
}
```

## 🌐 URLs Importantes

### Documentación Oficial de Redsys
- [Guía de Integración](https://pagosonline.redsys.es/desarrolladores.html)
- [Manual de Firmas](https://pagosonline.redsys.es/firmas.html)

### Entornos de Redsys
- **Test**: `https://sis-t.redsys.es:25443/sis/realizarPago`
- **Producción**: `https://sis.redsys.es/sis/realizarPago`

## ⚠️ Antes de Pasar a Producción

1. **Obtén credenciales reales** de tu banco
2. **Actualiza las variables de entorno** con las credenciales de producción
3. **Cambia** `REDSYS_ENVIRONMENT=production`
4. **Configura el dominio público** en `NEXT_PUBLIC_APP_URL`
5. **Asegúrate de que el callback sea accesible** desde internet
6. **Prueba con transacciones reales pequeñas** antes del lanzamiento
7. **Configura el certificado SSL** en tu dominio

## 📝 Notas Adicionales

- Los importes siempre se manejan en **céntimos** (ej: 100€ = 10000)
- El número de orden de Redsys debe tener **máximo 12 caracteres numéricos**
- Los primeros 4 caracteres del número de orden deben ser **numéricos**
- Redsys espera una respuesta HTTP 200 vacía en el callback

## ✅ Checklist de Implementación

- [x] Instalar dependencias de Redsys
- [x] Configurar variables de entorno
- [x] Crear servicio de Redsys
- [x] Implementar API routes
- [x] Crear componente de pago
- [x] Integrar en flujo de checkout
- [x] Crear página de resultado
- [x] Actualizar método de pago en BD
- [ ] Probar flujo completo en test
- [ ] Obtener credenciales de producción
- [ ] Configurar dominio público
- [ ] Probar en producción

## 🎉 ¡Listo!

La integración de Redsys está completa y lista para usar. Prueba con las tarjetas de test para verificar que todo funciona correctamente.
