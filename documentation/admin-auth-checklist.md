## Checklist de pruebas para autenticación admin

1. **Preparar token válido**
   - Inicia sesión en el panel admin.
   - En DevTools → Network, realiza una acción admin y copia el header `Authorization`.

2. **Prueba de estrés con `curl` (10 minutos)**
   ```bash
   TOKEN="COPIA_TU_JWT"
   URL="http://localhost:3000/api/admin/clients"
   for i in $(seq 1 20); do
     STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $TOKEN" \
       -d "{\"email\":\"stress-$i@test.com\",\"first_name\":\"A\",\"last_name\":\"B\"}")
     echo "$(date +%H:%M:%S) Request $i: HTTP $STATUS"
     sleep 30
   done
   ```
   - Esperado: todos los estados `HTTP 201`.
   - Si aparece `401`, sesión expirada → repetir con token fresco.
   - Si aparece `403`, revisar logs para `roleDebug`.

3. **Prueba manual en panel**
   - Crear 1 cliente inmediatamente después de desplegar.
   - Esperar 10 minutos sin recargar la pestaña.
   - Crear otro cliente; validar que el formulario invita a reautenticar si la sesión caducó (mensaje 401).

4. **Logs en producción**
   - Activar `DEBUG_ADMIN_AUTH=1`.
   - Ante cualquier 401/403, revisar `docker logs --tail 200 nextjs-app-container`.
   - Guardar fragmentos relevantes en la incidencia correspondiente.

5. **Checklist de regresión**
   - Crear cliente con rol admin válido.
   - Intentar crear cliente con usuario sin rol admin → esperar 403 con mensaje claro.
   - Session expirada: forzar `signOut` y repetir → el front muestra mensaje para re-login.

> Anotar resultados reales en la incidencia o documentación interna tras ejecutar las pruebas.

---

## Correos al crear pedido desde admin

La creación de pedidos se hace mediante POST `/api/admin/orders` (servidor), de modo que el envío de emails corre en el backend con nodemailer.

1. **Verificar SMTP**: `GET /api/test-email` comprueba credenciales y conexión.
2. **Crear pedido**: Panel Admin → Pedidos → Crear. Se envían correos a cliente (si tiene email) y a admin.
3. **Logs**: Buscar `📧 [EMAIL]` en `docker logs nextjs-app-container` para diagnosticar fallos.
4. **Variables**: `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_ADMIN_ADDRESS` deben estar en el contenedor.

---

## Mapa de flujos de correo

| Flujo | Origen | Servicio de envío | Estado |
|-------|--------|-------------------|--------|
| **Pedido desde admin** | POST /api/admin/orders | ServerEmailService (servidor) | ✅ Corregido |
| **Crear cliente desde admin** | POST /api/admin/clients | ServerEmailService (servidor) | ✅ Corregido |
| **Pedido desde tienda (checkout)** | OrderService.createOrder (cliente) | EmailService → POST /api/notifications → ServerEmailService | ✅ OK |
| **Registro público** | AuthService.signUp (cliente) | EmailService → POST /api/notifications → ServerEmailService | ✅ OK |
| **Pago Redsys confirmado** | API process-result / callback | ServerEmailService (servidor) | ✅ OK |
| **Reenviar / cambiar estado pedido** | API send-status-email, resend-email | ServerEmailService (servidor) | ✅ OK |
