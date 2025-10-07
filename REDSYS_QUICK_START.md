# 🚀 Guía Rápida: Integración Redsys

## ✅ Lo que se ha implementado

1. **Servicio de Redsys** (`src/lib/redsys.ts`)
   - Generación de firmas HMAC SHA256
   - Creación de formularios de pago
   - Validación de respuestas

2. **API Endpoints**
   - `/api/payments/redsys/create` - Inicia pago
   - `/api/payments/redsys/callback` - Recibe confirmación

3. **Componentes UI**
   - `RedsysPaymentForm` - Formulario de pago con tarjeta
   - `/checkout/payment-result` - Página de resultado

4. **Flujo de Checkout Modificado**
   - Detección automática de método de pago Redsys
   - Creación de orden previa
   - Redirección a pasarela de pago

## 🔧 Configuración Rápida

### 1. Variables de entorno ya configuradas en `.env`
```bash
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=001
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_CURRENCY=978
REDSYS_ENVIRONMENT=test
```

### 2. Actualizar método de pago en BD
```sql
UPDATE payment_methods 
SET provider = 'Redsys' 
WHERE name = 'Tarjeta de Crédito/Débito';
```

O ejecuta en SQL Editor de Supabase el archivo:
```
database/add_payment_status.sql
```

### 3. Instalar dependencias (ya hecho)
```bash
npm install redsys-easy redsys-pos
```

## 🧪 Probar la Integración

### Tarjeta de Prueba (Autorizada)
```
Número: 4548812049400004
Caducidad: 12/25 (cualquier fecha futura)
CVV: 123
CIP: 123456
```

### Flujo de Prueba
1. Añade productos al carrito
2. Completa el checkout
3. Selecciona "Tarjeta de Crédito/Débito"
4. Confirma el pedido
5. Introduce los datos de la tarjeta de prueba
6. Verifica la confirmación

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `src/lib/redsys.ts` - Servicio principal
- `src/app/api/payments/redsys/create/route.ts` - API inicio pago
- `src/app/api/payments/redsys/callback/route.ts` - API callback
- `src/components/checkout/RedsysPaymentForm.tsx` - Componente pago
- `src/app/checkout/payment-result/page.tsx` - Página resultado
- `database/add_payment_status.sql` - Script BD
- `scripts/test-redsys.js` - Script de prueba
- `INTEGRACION_REDSYS.md` - Documentación completa

### Archivos Modificados
- `src/app/checkout/page.tsx` - Flujo de checkout
- `src/lib/checkout-test-data.ts` - Método de pago actualizado
- `.env` - Variables de entorno añadidas
- `package.json` - Dependencias añadidas

## 🔄 Flujo Completo

```
Usuario completa checkout
         ↓
Selecciona "Tarjeta de Crédito/Débito"
         ↓
Sistema crea orden (estado: pending)
         ↓
API prepara transacción Redsys
         ↓
Usuario redirigido a Redsys
         ↓
Usuario introduce datos tarjeta
         ↓
Redsys procesa pago
         ↓
Callback actualiza estado orden
         ↓
Usuario redirigido a resultado
         ↓
Confirmación o error mostrado
```

## ⚠️ Importante

### En Desarrollo/Pruebas
- ✅ Usa credenciales de TEST
- ✅ Usa tarjetas de prueba
- ✅ URL: `https://sis-t.redsys.es:25443/sis/realizarPago`

### Para Producción
- ❗ Obtén credenciales reales de tu banco
- ❗ Cambia `REDSYS_ENVIRONMENT=production`
- ❗ URL: `https://sis.redsys.es/sis/realizarPago`
- ❗ Configura dominio público en `NEXT_PUBLIC_APP_URL`
- ❗ Asegura que callback sea accesible desde internet

## 📚 Documentación Completa

Ver `INTEGRACION_REDSYS.md` para:
- Detalles técnicos completos
- Ejemplos de código
- Solución de problemas
- Guía de producción
- Códigos de respuesta

## 🎯 Siguientes Pasos

1. ✅ Ejecutar script SQL para añadir `payment_status`
2. ✅ Actualizar método de pago a Redsys
3. ✅ Probar con tarjeta de test
4. ⏳ Obtener credenciales de producción
5. ⏳ Configurar para producción

## 💡 Ayuda Rápida

**Error de firma**: Verifica `REDSYS_SECRET_KEY`
**Orden no encontrada**: Revisa logs del callback
**Pago no actualiza**: Verifica que callback sea accesible

## 📞 Soporte

- Documentación Redsys: https://pagosonline.redsys.es/desarrolladores.html
- Consulta: `INTEGRACION_REDSYS.md`
