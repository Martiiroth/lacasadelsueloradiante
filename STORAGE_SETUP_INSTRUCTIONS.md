# 🔧 CONFIGURACIÓN DE STORAGE VÍA DASHBOARD DE SUPABASE

## ⚠️ IMPORTANTE: No uses el SQL Editor, usa la interfaz de Policies

### PASO 1: Ir a Storage Policies
1. Ve a tu dashboard de Supabase
2. Navega a: **Storage → Policies**
3. Busca la tabla `objects` en la lista

### PASO 2: Crear Política de Lectura Pública
1. Haz clic en **"New Policy"** para la tabla `objects`
2. Elige **"Custom policy"**
3. Configura:
   - **Policy Name**: `Public read for brand logos`
   - **Allowed Operation**: `SELECT` ✓
   - **Target Roles**: `public` ✓
   - **USING Expression**: 
     ```sql
     bucket_id = 'brand-logos'
     ```
4. Haz clic en **"Save Policy"**

### PASO 3: Crear Política de Subida Autenticada
1. Haz clic en **"New Policy"** otra vez
2. Elige **"Custom policy"**
3. Configura:
   - **Policy Name**: `Authenticated users can upload brand logos`
   - **Allowed Operation**: `INSERT` ✓
   - **Target Roles**: `authenticated` ✓
   - **WITH CHECK Expression**:
     ```sql
     bucket_id = 'brand-logos'
     ```
4. Haz clic en **"Save Policy"**

### PASO 4: Verificar
Deberías ver dos políticas nuevas:
- ✅ `Public read for brand logos` (SELECT)
- ✅ `Authenticated users can upload brand logos` (INSERT)

### PASO 5: Probar
Vuelve al admin panel y prueba subir una imagen.

---

## 🚨 Si no funciona la interfaz de Policies

### ALTERNATIVA: Contactar soporte de Supabase
1. Ve a: **Settings → Support**
2. Explica que necesitas configurar políticas RLS para Storage
3. Menciona el bucket `brand-logos`

### ALTERNATIVA: Usar Service Role Key
Si tienes acceso a la Service Role Key:
1. Ve a **Settings → API**
2. Copia la **service_role** key (no la anon key)
3. Añádela a tu `.env` como `SUPABASE_SERVICE_ROLE_KEY`
4. Ejecuta el script: `node scripts/setup-storage-policies.js`