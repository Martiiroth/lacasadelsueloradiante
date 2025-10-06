# 🔄 Migración a Arquitectura Oficial de Supabase SSR

## 🚨 IMPORTANTE: Estado Actual vs Recomendado

### ❌ Arquitectura Actual (NO recomendada)
```
src/lib/supabase.ts (un solo cliente para todo)
├── usado en Client Components
├── usado en Server Components
├── usado en Server Actions
└── usado en Route Handlers
```

### ✅ Arquitectura Recomendada (Oficial de Supabase)
```
src/utils/supabase/
├── client.ts     → Para Client Components (navegador)
├── server.ts     → Para Server Components/Actions
└── middleware.ts → Para refrescar sesión automáticamente

src/middleware.ts → Intercepta todas las requests
```

## 📦 Paquetes Instalados

✅ **@supabase/ssr** - Instalado
- Provee `createBrowserClient` para cliente
- Provee `createServerClient` para servidor
- Manejo correcto de cookies en SSR

## 🏗️ Archivos Creados

### 1. `/src/utils/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Usar en:**
- ✅ Client Components (`'use client'`)
- ✅ Hooks de React
- ✅ Event handlers del navegador

**NO usar en:**
- ❌ Server Components
- ❌ Server Actions
- ❌ Route Handlers

### 2. `/src/utils/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored if called from Server Component
            // Middleware will handle session refresh
          }
        },
      },
    }
  )
}
```

**Usar en:**
- ✅ Server Components
- ✅ Server Actions
- ✅ Route Handlers (GET, POST, etc.)

**NO usar en:**
- ❌ Client Components
- ❌ Código del navegador

### 3. `/src/utils/supabase/middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Crea cliente con acceso a cookies de request/response
  const supabase = createServerClient(...)
  
  // CRITICAL: getUser() revalida el token en cada request
  const { data: { user } } = await supabase.auth.getUser()
  
  return supabaseResponse
}
```

**Función:**
- 🔄 Refresca tokens expirados automáticamente
- 🔄 Actualiza cookies en request y response
- 🔄 Revalida sesión en cada request
- 🔄 NO necesitas hacer refresh manual en visibilitychange

### 4. `/src/middleware.ts`
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Excluir archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Función:**
- 🔄 Intercepta TODAS las requests (excepto estáticos)
- 🔄 Refresca sesión ANTES de llegar al componente
- 🔄 Actualiza cookies automáticamente
- 🔄 Garantiza sesión válida en Server Components

## 🔧 Migración Necesaria

### Estado Actual: PARCIALMENTE MIGRADO

✅ **Ya Hecho:**
1. Instalado `@supabase/ssr`
2. Creados clientes separados (client.ts, server.ts)
3. Creado middleware
4. Actualizado `AuthContext.tsx` para usar `createClient()` del browser

⚠️ **Pendiente de Migrar:**

#### 1. **src/lib/auth.ts**
```typescript
// ❌ ANTES
import { supabase } from './supabase'

// ✅ DESPUÉS (opción 1: recibir cliente como parámetro)
static async signIn(credentials: LoginCredentials, supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.signInWithPassword(...)
}

// ✅ DESPUÉS (opción 2: usar cliente browser por defecto)
import { createClient } from '@/utils/supabase/client'

static async signIn(credentials: LoginCredentials) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword(...)
}
```

#### 2. **Todos los Server Components**
```typescript
// ❌ ANTES
import { supabase } from '@/lib/supabase'

export default async function Page() {
  const { data } = await supabase.from('products').select()
}

// ✅ DESPUÉS
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select()
}
```

#### 3. **Route Handlers (API Routes)**
```typescript
// ❌ ANTES
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('products').select()
}

// ✅ DESPUÉS
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select()
}
```

#### 4. **Server Actions**
```typescript
// ❌ ANTES
import { supabase } from '@/lib/supabase'

export async function createProduct(formData: FormData) {
  'use server'
  const { data } = await supabase.from('products').insert(...)
}

// ✅ DESPUÉS
import { createClient } from '@/utils/supabase/server'

export async function createProduct(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data } = await supabase.from('products').insert(...)
}
```

## 🎯 Beneficios de la Migración

### Antes (Cliente Único)
```
❌ Sesión se puede perder al cambiar tab
❌ Tokens no se refrescan automáticamente en servidor
❌ Cookies mal manejadas en SSR
❌ Posibles race conditions en refresh
❌ Necesitas heartbeat manual en cliente
```

### Después (Arquitectura Oficial)
```
✅ Middleware refresca sesión automáticamente
✅ Tokens siempre válidos en Server Components
✅ Cookies correctamente sincronizadas
✅ NO necesitas visibilitychange listeners
✅ NO necesitas heartbeat manual
✅ Sesión NUNCA se pierde al cambiar tab
```

## 📋 Plan de Migración Gradual

### Fase 1: ✅ COMPLETADA
- [x] Instalar @supabase/ssr
- [x] Crear utils/supabase/client.ts
- [x] Crear utils/supabase/server.ts  
- [x] Crear utils/supabase/middleware.ts
- [x] Crear middleware.ts
- [x] Actualizar AuthContext.tsx

### Fase 2: 🔄 EN PROGRESO (Opcional)
- [ ] Migrar lib/auth.ts para usar createClient()
- [ ] Actualizar todos los Server Components
- [ ] Actualizar Route Handlers
- [ ] Actualizar Server Actions

### Fase 3: ⏳ FUTURA
- [ ] Deprecar lib/supabase.ts
- [ ] Remover listeners de visibilitychange (ya no necesarios)
- [ ] Remover heartbeat manual (ya no necesario)
- [ ] Simplificar AuthContext

## 🔍 Verificación de Uso Correcto

### ✅ Uso Correcto en Client Component
```typescript
'use client'
import { createClient } from '@/utils/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      // OK: Cliente correcto para navegador
    })
  }, [])
}
```

### ✅ Uso Correcto en Server Component
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select()
  
  // OK: Cliente correcto para servidor
  return <div>{data.map(...)}</div>
}
```

### ❌ Uso INCORRECTO
```typescript
// ❌ MAL: Usando cliente de servidor en Client Component
'use client'
import { createClient } from '@/utils/supabase/server'

// ❌ MAL: Usando cliente de navegador en Server Component
import { createClient } from '@/utils/supabase/client'
export default async function Page() { ... }
```

## 🚀 Mejoras Inmediatas

### Con Middleware (Ya Implementado)
```
Usuario hace request → Middleware intercepta → Refresca sesión si necesario
→ Server Component recibe sesión válida → Renderiza con datos correctos
```

### Sin Necesidad de Listeners
```
// ❌ YA NO NECESARIO (pero compatible)
useEffect(() => {
  const handler = () => supabase.auth.refreshSession()
  window.addEventListener('visibilitychange', handler)
}, [])

// ✅ Middleware lo hace automáticamente en cada request
```

## 📊 Estado de Compatibilidad

| Componente | Estado | Usa Cliente Correcto |
|-----------|--------|---------------------|
| AuthContext.tsx | ✅ Migrado | Browser Client |
| Middleware | ✅ Nuevo | Server Client |
| lib/auth.ts | ⚠️ Legacy | Antiguo Client |
| Server Components | ⚠️ Mixed | Antiguo Client |
| Client Components | ⚠️ Mixed | Antiguo Client |

## 🎉 Resultado Final Esperado

Después de completar la migración:

1. **Sesión 100% confiable** - Middleware garantiza refresh
2. **Sin código manual de refresh** - Todo automático
3. **Mejor rendimiento** - Menos llamadas innecesarias
4. **Código más limpio** - Separación clara cliente/servidor
5. **Siguiendo mejores prácticas** - Arquitectura oficial de Supabase

## 📚 Referencias

- [Supabase Next.js SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR Package](https://github.com/supabase/ssr)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---
**Fecha**: 6 de octubre de 2025  
**Estado**: Fase 1 Completada ✅  
**Próximo Paso**: Migrar lib/auth.ts (Opcional)
