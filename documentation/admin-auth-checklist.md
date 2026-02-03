## Redirect www (evitar 403 por inconsistencia de dominio)

**Importante:** Si entras por `lacasadelsueloradiante.es` (sin www) pero `NEXT_PUBLIC_APP_URL` usa `www`, las cookies pueden fallar y provocar 403.

**Solución:** Redirigir siempre a `https://www.lacasadelsueloradiante.es`. El archivo `conf.d/redirect-non-www-to-www.conf` hace esto. Asegúrate de:
1. Que nginx lo cargue (está en conf.d/ si usas docker-compose-nginx)
2. Ajustar rutas SSL si tu certbot usa otras rutas
3. Certificado que cubra ambos: `certbot -d lacasadelsueloradiante.es -d www.lacasadelsueloradiante.es`

---

## Auth admin simplificado (Opción A)

Flujo actual:
- **Usuario:** Bearer header primero, cookies si no hay Bearer
- **Rol:** Siempre de `clients.role_id` → `customer_roles.name` (tablas DB)
  - 1º Service role (SUPABASE_SERVICE_ROLE_KEY)
  - 2º Fallback con token del usuario (RLS permite leer propia fila en clients)
- **Frontend:** Refresca sesión antes de llamadas API y envía `Authorization: Bearer <token>`

---

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

4. **Logs en producción (VPS/Docker)**
   - Los logs solo aparecen cuando se hacen peticiones al API (crear cliente, crear pedido, etc.).
   - **Ver logs en tiempo real:**
     ```bash
     cd lacasadelsueloradiante
     docker compose logs -f nextjs-app
     ```
   - En otra ventana o navegador, ejecuta una acción admin (crear cliente). Verás líneas como:
     - `🔐 Procesando solicitud de creación de cliente`
     - `✅ Usuario autenticado: email@ejemplo.com`
     - O en error: `⚠️ Admin auth unauthorized` / `❌ Admin auth forbidden` con roleDebug
   - **Últimas 200 líneas:** `docker compose logs --tail=200 nextjs-app`
   - **Buscar texto (evitar emojis en grep):** `docker compose logs nextjs-app 2>&1 | grep -E "Admin auth|Procesando|Usuario autenticado|forbidden|unauthorized"`

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
