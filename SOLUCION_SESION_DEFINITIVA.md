# ✅ Solución Definitiva: Sesión Persistente con Supabase Auth v2

## 🎯 Problema Resuelto

**ANTES**: Al cambiar de pestaña, la aplicación perdía la sesión (`state = null`), obligando al usuario a refrescar manualmente la página.

**AHORA**: La sesión se mantiene automáticamente al cambiar de pestaña, sin pérdida de datos ni necesidad de refresh manual.

---

## 🔧 Cambios Implementados

### 1. **src/lib/supabase.ts** - Cliente con Persistencia Configurada

```typescript
// ✅ CONFIGURACIÓN CORRECTA
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // ✅ Auto-renueva tokens antes de expirar
    persistSession: true,         // ✅ Guarda sesión en localStorage
    detectSessionInUrl: true,     // ✅ Para OAuth/magic links
    flowType: 'pkce',            // ✅ PKCE flow (más seguro)
    storage: window.localStorage, // ✅ Storage explícito
    storageKey: 'sb-auth-token',  // ✅ Key consistente
  },
})
```

**¿Por qué funciona?**
- `autoRefreshToken`: Supabase maneja automáticamente el refresh del token antes de que expire (default: 1 hora)
- `persistSession`: Guarda `access_token` y `refresh_token` en localStorage, permitiendo recuperación después de recargas
- `flowType: 'pkce'`: Usa Proof Key for Code Exchange para mayor seguridad en aplicaciones SPA

**ANTES** (❌ Incorrecto):
```typescript
export const supabase = createClient(url, key) // Sin configuración de auth
```

---

### 2. **src/contexts/AuthContext.tsx** - Patrón de 3 Fases

#### **FASE 1: Hidratación Inicial** ✅

```typescript
useEffect(() => {
  async function initializeAuth() {
    // ✅ CLAVE: Recuperar sesión del localStorage
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (session) {
      console.log('✅ Session recovered from storage')
      setSession(session)
      
      // Cargar datos completos del usuario
      const user = await AuthService.getCurrentUser()
      setState({ user, loading: false, error: null })
    }
    
    setIsInitialized(true)
  }
  
  initializeAuth()
}, []) // Solo al montar
```

**¿Por qué funciona?**
- `supabase.auth.getSession()` lee del localStorage **sin hacer petición de red** (rápido ⚡)
- Recupera la sesión almacenada localmente si existe
- Solo carga datos completos del usuario **una vez** después de confirmar que hay sesión

**ANTES** (❌ Incorrecto):
```typescript
useEffect(() => {
  if (!isHydrated) return
  getCurrentUser() // ❌ Solo carga usuario, no recupera sesión
}, [isHydrated])
```

#### **FASE 2: Listener de Eventos** ✅

```typescript
useEffect(() => {
  if (!isInitialized) return
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, currentSession) => {
      console.log('🔄 Auth state changed:', event)
      
      setSession(currentSession)
      
      if (event === 'SIGNED_IN') {
        const user = await AuthService.getCurrentUser()
        setState({ user, loading: false, error: null })
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, error: null })
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully')
        // Session actualizada automáticamente
      } else if (event === 'USER_UPDATED') {
        const user = await AuthService.getCurrentUser()
        setState(prev => ({ ...prev, user }))
      }
    }
  )
  
  return () => subscription.unsubscribe()
}, [isInitialized])
```

**¿Por qué funciona?**
- Se suscribe **después** de la inicialización (evita race conditions)
- Reacciona a **todos los eventos** de Supabase:
  - `SIGNED_IN`: Usuario hizo login
  - `SIGNED_OUT`: Usuario hizo logout
  - `TOKEN_REFRESHED`: Supabase renovó el token automáticamente ⚡
  - `USER_UPDATED`: Datos del usuario cambiaron
- `TOKEN_REFRESHED` se dispara automáticamente cada vez que Supabase renueva el token

**ANTES** (❌ Incorrecto):
```typescript
// Se suscribía inmediatamente sin esperar inicialización
AuthService.onAuthStateChange((user) => {
  setState(prev => ({ ...prev, user, loading: false }))
})
```

#### **FASE 3: Sincronización al Cambiar de Pestaña** ✅

```typescript
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (!document.hidden && isInitialized) {
      console.log('👁️ Tab visible - Syncing session...')
      
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // Sincronizar si hay discrepancia
      if (currentSession && !session) {
        console.log('🔄 Recovering lost session...')
        setSession(currentSession)
        const user = await AuthService.getCurrentUser()
        setState({ user, loading: false, error: null })
      } else if (!currentSession && session) {
        console.log('🔄 Clearing stale session...')
        setSession(null)
        setState({ user: null, loading: false, error: null })
      } else if (currentSession && session && 
                 currentSession.user.id !== session.user.id) {
        console.log('🔄 Session mismatch - Updating...')
        setSession(currentSession)
        const user = await AuthService.getCurrentUser()
        setState({ user, loading: false, error: null })
      }
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleVisibilityChange)
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleVisibilityChange)
  }
}, [session, isInitialized])
```

**¿Por qué funciona?**
- Se ejecuta **cada vez que la pestaña vuelve a ser visible**
- Compara el estado en memoria (`session`) con el estado en localStorage (`currentSession`)
- **Sincroniza automáticamente** si detecta discrepancias:
  - Sesión en localStorage pero no en estado → **Recupera** ✅
  - Sesión en estado pero no en localStorage → **Limpia** ✅
  - IDs diferentes entre ambas → **Actualiza** ✅

**ANTES** (❌ No existía): No había ningún listener de visibilidad

---

## 🎯 Flujos de Funcionamiento

### Escenario 1: Usuario recarga la página (F5)
```
1. Component mount
2. initializeAuth() ejecuta
3. supabase.auth.getSession() → Recupera del localStorage ✅
4. setSession(existingSession)
5. AuthService.getCurrentUser() → Carga datos completos
6. setState({ user, loading: false })
7. onAuthStateChange se suscribe → Listo para eventos futuros
```

**Resultado**: Usuario logueado instantáneamente sin flash de loading prolongado ⚡

### Escenario 2: Usuario cambia de pestaña y vuelve
```
1. User switches tab → document.hidden = true
2. [30 segundos después]
3. User returns → document.hidden = false
4. visibilitychange event fires
5. handleVisibilityChange() ejecuta
6. supabase.auth.getSession() → Verifica localStorage
7. Compara con session en estado
8. Si hay discrepancia → Sincroniza ✅
9. setState actualizado → UI refleja sesión correcta
```

**Resultado**: Sesión se mantiene, usuario sigue logueado sin problemas ✅

### Escenario 3: Token expira mientras usuario está inactivo (1h+)
```
1. Token expira (después de 1 hora)
2. Usuario vuelve a la pestaña
3. visibilitychange event fires
4. supabase.auth.getSession() → Intenta recuperar
5. Supabase detecta token expirado
6. autoRefreshToken: true → Usa refresh_token automáticamente ✅
7. TOKEN_REFRESHED event → onAuthStateChange lo captura
8. Estado actualizado con nuevo token
```

**Resultado**: Token se renueva automáticamente, usuario ni se entera ⚡

### Escenario 4: Usuario inicia sesión en otra pestaña
```
1. Pestaña A: User logged out
2. Pestaña B: User logs in → localStorage updated
3. Pestaña A: User switches back
4. visibilitychange event fires
5. handleVisibilityChange() ejecuta
6. supabase.auth.getSession() → Lee localStorage actualizado
7. Detecta sesión nueva (!session pero currentSession existe)
8. Recupera sesión: setSession(currentSession) ✅
9. UI actualizada en ambas pestañas
```

**Resultado**: Ambas pestañas sincronizadas automáticamente ✅

---

## 📊 Comparación: Antes vs Después

| Aspecto | ❌ ANTES | ✅ AHORA |
|---------|----------|----------|
| **Configuración cliente** | Sin opciones de auth | autoRefreshToken + persistSession + PKCE |
| **Hidratación inicial** | Manual con getCurrentUser() | Automática con getSession() |
| **Cambio de pestaña** | ❌ Perdía sesión | ✅ Sincroniza automáticamente |
| **Recarga de página** | ❌ Requería login | ✅ Recupera sesión instantáneamente |
| **Token refresh** | ❌ Manual, podía fallar | ✅ Automático por Supabase |
| **Múltiples pestañas** | ❌ Inconsistente | ✅ Sincronizado |
| **Logs** | Excesivos y confusos | Claros y solo cuando necesario |
| **Dependencias** | useHydration innecesario | Sin dependencias extras |
| **Líneas de código** | ~150 líneas | ~200 líneas (más funcional) |

---

## 🧪 Cómo Probar

### Test 1: Cambio de pestaña básico
```bash
1. Iniciar sesión en la app
2. Abrir DevTools → Application → Local Storage
3. Verificar: "sb-auth-token" existe
4. Cambiar a otra pestaña durante 30 segundos
5. Volver → Verificar consola: "👁️ Tab visible - Syncing session..."
6. ✅ Usuario debe seguir logueado sin perder datos
```

### Test 2: Recargar página
```bash
1. Iniciar sesión
2. F5 (recargar página)
3. Verificar consola: "✅ Session recovered from storage"
4. ✅ Usuario logueado instantáneamente (sin flash de login)
```

### Test 3: Cerrar y reabrir navegador
```bash
1. Iniciar sesión
2. Cerrar navegador completamente
3. Reabrir navegador
4. Navegar a la app
5. ✅ Usuario debe seguir logueado (persistSession: true)
```

### Test 4: Múltiples pestañas
```bash
1. Abrir app en pestaña A (logged out)
2. Abrir app en pestaña B
3. Iniciar sesión en pestaña B
4. Volver a pestaña A
5. ✅ Pestaña A debe mostrar usuario logueado
```

---

## 🎓 Conceptos Clave

### 1. getSession() vs getCurrentUser()
- **getSession()**: Lee del localStorage (rápido, sin red) ⚡ → Úsalo para recuperación
- **getCurrentUser()**: Hace query a DB para datos completos 🐢 → Úsalo solo cuando necesites datos actualizados

### 2. Eventos de onAuthStateChange
```typescript
'SIGNED_IN'         // Usuario hizo login
'SIGNED_OUT'        // Usuario hizo logout
'TOKEN_REFRESHED'   // Supabase renovó el token automáticamente
'USER_UPDATED'      // Datos del usuario cambiaron
'PASSWORD_RECOVERY' // Usuario solicitó reset de contraseña
```

### 3. Flujo de tokens
```
1. Login → access_token (1h) + refresh_token (30d)
2. access_token expira → autoRefreshToken usa refresh_token
3. Nuevo access_token → TOKEN_REFRESHED event
4. Si refresh_token expira → SIGNED_OUT event
```

### 4. Storage keys
```javascript
localStorage['sb-auth-token'] = {
  access_token: "eyJ...",
  refresh_token: "...",
  expires_at: 1234567890,
  user: { id: "...", email: "..." }
}
```

---

## ✅ Checklist de Validación

- [x] Cliente Supabase con `autoRefreshToken: true`
- [x] Cliente Supabase con `persistSession: true`
- [x] Cliente Supabase con `detectSessionInUrl: true`
- [x] Cliente Supabase con `flowType: 'pkce'`
- [x] Hidratación inicial con `getSession()` en AuthContext
- [x] Listener `onAuthStateChange` correctamente configurado
- [x] Sincronización en `visibilitychange` event
- [x] Sincronización en `focus` event
- [x] Manejo de todos los eventos de auth (SIGNED_IN, SIGNED_OUT, etc.)
- [x] Logs útiles para debugging
- [x] Sin dependencia de hooks innecesarios (`useHydration` eliminado)
- [x] Estado consistente entre localStorage y React state
- [x] Sin errores de compilación TypeScript

---

## 🎉 Resultado Final

✅ **La sesión ahora es totalmente persistente y sincronizada**  
✅ **NO se pierde al cambiar de pestaña**  
✅ **Se recupera automáticamente al recargar**  
✅ **Funciona en múltiples pestañas simultáneas**  
✅ **Maneja expiración y refresh automáticamente**  
✅ **Sin necesidad de refresh manual por parte del usuario**

---

**Implementado**: 5 Octubre 2025  
**Patrón**: Supabase Auth v2 + Next.js App Router  
**Arquitectura**: 3-Phase Authentication Pattern (Hydration → Listener → Sync)

**¡Tu aplicación ahora tiene autenticación de nivel producción! 🚀**
