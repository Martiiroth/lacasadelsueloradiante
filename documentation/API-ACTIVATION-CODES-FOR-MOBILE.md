# API de Códigos de Activación - Documentación para Desarrolladores Mobile

## 📱 Descripción General

Sistema de códigos de activación premium que desbloquea funcionalidades en la app móvil. Los códigos se generan automáticamente al completar una compra en la tienda web y tienen una validez de **30 días**.

**Base URL:** `https://lacasadelsueloradiante.es/api/activation-codes`

---

## 🔑 Endpoints Disponibles

### 1. Validar Código de Activación

Valida un código ingresado por el usuario y registra el dispositivo.

**Endpoint:** `POST /api/activation-codes/validate`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "A2BC-D3FG-H4JK",
  "device_id": "iPhone14-ABC123DEF456",
  "app_version": "1.0.0",
  "platform": "ios"
}
```

**Campos:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `code` | string | ✅ Sí | Código de activación (12 caracteres, formato: XXXX-XXXX-XXXX) |
| `device_id` | string | ❌ No | Identificador único del dispositivo |
| `app_version` | string | ❌ No | Versión de la aplicación |
| `platform` | string | ❌ No | Plataforma: "ios" o "android" |

**Respuesta Exitosa (200):**
```json
{
  "valid": true,
  "code": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "A2BC-D3FG-H4JK",
    "order_id": "789e4567-e89b-12d3-a456-426614174111",
    "client_id": "456e4567-e89b-12d3-a456-426614174222",
    "status": "active",
    "created_at": "2025-10-22T10:00:00.000Z",
    "expires_at": "2025-11-21T10:00:00.000Z",
    "activated_at": "2025-10-22T10:05:00.000Z",
    "last_validated_at": "2025-10-22T10:05:00.000Z",
    "device_id": "iPhone14-ABC123DEF456",
    "metadata": {
      "app_version": "1.0.0",
      "platform": "ios",
      "last_device_id": "iPhone14-ABC123DEF456"
    }
  },
  "expires_at": "2025-11-21T10:00:00.000Z",
  "days_remaining": 30,
  "message": "Código válido"
}
```

**Respuestas de Error:**

**400 - Código no encontrado:**
```json
{
  "valid": false,
  "message": "Código no encontrado"
}
```

**400 - Código expirado:**
```json
{
  "valid": false,
  "message": "Código expirado",
  "expires_at": "2025-10-15T10:00:00.000Z"
}
```

**400 - Código revocado:**
```json
{
  "valid": false,
  "message": "Código revocado"
}
```

**400 - Código requerido:**
```json
{
  "valid": false,
  "message": "Código requerido"
}
```

**500 - Error del servidor:**
```json
{
  "valid": false,
  "message": "Error al validar código"
}
```

---

### 2. Consultar Estado de Código

Obtiene información detallada de un código sin validarlo (consulta de solo lectura).

**Endpoint:** `GET /api/activation-codes/{code}`

**Parámetros URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `code` | string | Código de activación a consultar |

**Ejemplo:** `GET /api/activation-codes/A2BC-D3FG-H4JK`

**Headers:**
```http
Content-Type: application/json
```

**Respuesta Exitosa (200):**
```json
{
  "code": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "A2BC-D3FG-H4JK",
    "order_id": "789e4567-e89b-12d3-a456-426614174111",
    "client_id": "456e4567-e89b-12d3-a456-426614174222",
    "status": "active",
    "created_at": "2025-10-22T10:00:00.000Z",
    "expires_at": "2025-11-21T10:00:00.000Z",
    "activated_at": "2025-10-22T10:05:00.000Z",
    "last_validated_at": "2025-10-22T15:30:00.000Z",
    "device_id": "iPhone14-ABC123DEF456",
    "metadata": {
      "app_version": "1.0.0",
      "platform": "ios"
    },
    "order": {
      "id": "789e4567-e89b-12d3-a456-426614174111",
      "order_number": "1234",
      "total_cents": 5999,
      "status": "delivered",
      "created_at": "2025-10-20T09:00:00.000Z"
    }
  },
  "is_valid": true,
  "is_expired": false,
  "is_revoked": false,
  "days_remaining": 28,
  "expires_at": "2025-11-21T10:00:00.000Z"
}
```

**Respuesta - Código expirado (200):**
```json
{
  "code": { /* ... */ },
  "is_valid": false,
  "is_expired": true,
  "is_revoked": false,
  "days_remaining": 0,
  "expires_at": "2025-10-15T10:00:00.000Z"
}
```

**404 - Código no encontrado:**
```json
{
  "error": "Código no encontrado"
}
```

**400 - Código requerido:**
```json
{
  "error": "Código requerido"
}
```

**500 - Error del servidor:**
```json
{
  "error": "Error al obtener código"
}
```

---

## 📋 Flujo de Integración Recomendado

### 1. Pantalla de Activación

```
┌─────────────────────────────────────┐
│  🔑 Activar Código Premium          │
├─────────────────────────────────────┤
│                                     │
│  Ingresa tu código de activación:  │
│  ┌─────────────────────────────┐   │
│  │ A2BC-D3FG-H4JK             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [  Validar Código  ]              │
│                                     │
│  ℹ️ El código viene en tu email    │
│     de confirmación de compra      │
└─────────────────────────────────────┘
```

### 2. Validación al Iniciar

```typescript
// Al iniciar la app, verificar si hay código guardado
async function checkPremiumStatus() {
  const savedCode = await getStoredCode()
  
  if (!savedCode) {
    return { isPremium: false }
  }
  
  // Verificar si ha expirado localmente
  const expiresAt = await getStoredExpirationDate()
  if (new Date() > new Date(expiresAt)) {
    await clearStoredCode()
    return { isPremium: false, reason: 'expired' }
  }
  
  // Opcional: Revalidar con servidor cada X días
  const lastValidation = await getLastValidationDate()
  const daysSinceValidation = getDaysBetween(lastValidation, new Date())
  
  if (daysSinceValidation > 7) {
    const response = await validateCodeWithServer(savedCode)
    if (!response.valid) {
      await clearStoredCode()
      return { isPremium: false, reason: response.message }
    }
    await updateLastValidationDate()
  }
  
  return { 
    isPremium: true, 
    expiresAt,
    daysRemaining: getDaysBetween(new Date(), expiresAt)
  }
}
```

### 3. Validación con Servidor

```typescript
async function validateCodeWithServer(code: string) {
  try {
    const deviceId = await getDeviceUniqueId()
    const appVersion = getAppVersion()
    const platform = Platform.OS // 'ios' | 'android'
    
    const response = await fetch(
      'https://lacasadelsueloradiante.es/api/activation-codes/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase().replace(/\s/g, ''),
          device_id: deviceId,
          app_version: appVersion,
          platform: platform
        })
      }
    )
    
    const result = await response.json()
    
    if (result.valid) {
      // Guardar datos en storage local
      await saveActivationData({
        code: result.code.code,
        expiresAt: result.expires_at,
        daysRemaining: result.days_remaining,
        validatedAt: new Date().toISOString()
      })
      
      return { valid: true, data: result }
    } else {
      return { valid: false, message: result.message }
    }
    
  } catch (error) {
    console.error('Error validando código:', error)
    return { 
      valid: false, 
      message: 'Error de conexión. Intenta de nuevo.' 
    }
  }
}
```

---

## 💾 Almacenamiento Local

### Datos a Guardar

```typescript
interface StoredActivationData {
  code: string                  // "A2BC-D3FG-H4JK"
  expiresAt: string            // "2025-11-21T10:00:00.000Z"
  activatedAt: string          // "2025-10-22T10:05:00.000Z"
  lastValidatedAt: string      // "2025-10-22T15:30:00.000Z"
  daysRemaining: number        // 28
  isPremium: boolean           // true
}
```

### React Native / Expo Example

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@activation_data'

// Guardar datos
async function saveActivationData(data: StoredActivationData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Leer datos
async function getActivationData(): Promise<StoredActivationData | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

// Limpiar datos
async function clearActivationData() {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

// Verificar si es premium localmente
async function isPremiumActive(): Promise<boolean> {
  const data = await getActivationData()
  if (!data) return false
  
  const expiresAt = new Date(data.expiresAt)
  const now = new Date()
  
  return now < expiresAt
}
```

### Flutter Example

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class ActivationStorage {
  static const String _key = 'activation_data';
  
  // Guardar datos
  static Future<void> saveActivationData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(data));
  }
  
  // Leer datos
  static Future<Map<String, dynamic>?> getActivationData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_key);
    return data != null ? jsonDecode(data) : null;
  }
  
  // Limpiar datos
  static Future<void> clearActivationData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
  
  // Verificar si es premium
  static Future<bool> isPremiumActive() async {
    final data = await getActivationData();
    if (data == null) return false;
    
    final expiresAt = DateTime.parse(data['expiresAt']);
    return DateTime.now().isBefore(expiresAt);
  }
}
```

---

## 🔒 Seguridad y Buenas Prácticas

### ✅ Hacer:

1. **Validar formato del código antes de enviar:**
   - 12 caracteres alfanuméricos
   - Formato: XXXX-XXXX-XXXX
   - Remover espacios y convertir a mayúsculas

2. **Almacenar localmente después de validación exitosa:**
   - Guardar fecha de expiración
   - Verificar expiración localmente antes de hacer requests innecesarios

3. **Revalidar periódicamente con el servidor:**
   - Cada 7 días como máximo
   - Al iniciar la app si han pasado más de X días

4. **Manejar errores de red gracefully:**
   - Si hay código guardado válido localmente y falla la revalidación por red, mantener acceso premium
   - Mostrar mensaje informativo pero no bloquear

5. **Generar device_id único y consistente:**
   - Usar identificadores nativos del dispositivo
   - Mantener el mismo ID entre sesiones

### ❌ No hacer:

1. **No hacer requests en cada pantalla:**
   - Verificar estado premium localmente
   - Solo revalidar cuando sea necesario

2. **No bloquear la UI durante validación:**
   - Usar loading states apropiados
   - Permitir cancelación

3. **No exponer el código en logs:**
   - Redactar información sensible en logs de producción

4. **No almacenar el código en texto plano sin cifrar:**
   - Considerar usar keychain/keystore del sistema

---

## 📊 Estados del Código

```
┌──────────────────────────────────────────────────────────┐
│ Estado                │ Descripción                       │
├──────────────────────────────────────────────────────────┤
│ active                │ Código válido y dentro del        │
│                       │ período de 30 días                │
├──────────────────────────────────────────────────────────┤
│ expired               │ Han pasado más de 30 días desde  │
│                       │ la compra                          │
├──────────────────────────────────────────────────────────┤
│ revoked               │ Código cancelado (ej: pedido      │
│                       │ cancelado o reembolsado)          │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Códigos de Prueba (Desarrollo)

Durante el desarrollo, puedes crear códigos de prueba ejecutando en Supabase:

```sql
-- Crear código de prueba que expira en 30 días
INSERT INTO activation_codes (
  code,
  order_id,
  client_id,
  status,
  expires_at
) VALUES (
  'TEST-1234-ABCD',
  (SELECT id FROM orders LIMIT 1),
  NULL,
  'active',
  NOW() + INTERVAL '30 days'
);

-- Crear código de prueba expirado
INSERT INTO activation_codes (
  code,
  order_id,
  status,
  expires_at
) VALUES (
  'EXPR-5678-EFGH',
  (SELECT id FROM orders LIMIT 1),
  'expired',
  NOW() - INTERVAL '1 day'
);
```

---

## 🐛 Troubleshooting

### Error: "Código no encontrado"
- Verificar que el código esté bien escrito
- Verificar que tenga el formato correcto (12 caracteres)
- Verificar que se haya completado la compra (pedido en estado "delivered")

### Error: "Código expirado"
- El código tiene más de 30 días desde la fecha de compra
- Informar al usuario que debe realizar una nueva compra

### Error: "Error al validar código"
- Problema de conexión a internet
- Servidor temporalmente no disponible
- Reintentar después de unos segundos

### El código valida pero las funciones premium no se activan
- Verificar que estás guardando correctamente los datos localmente
- Verificar que `isPremium: true` se está guardando
- Verificar que la lógica de verificación local está correcta

---

## 📞 Soporte

Para problemas de integración o preguntas técnicas:

- **Email:** consultas@lacasadelsueloradiante.es
- **Repositorio:** github.com/Martiiroth/lacasadelsueloradiante
- **Documentación adicional:** Ver `/documentation/activation-codes.readme`

---

## 📝 Changelog

### v1.0.0 (2025-10-22)
- ✅ Implementación inicial del sistema de códigos
- ✅ API de validación
- ✅ API de consulta
- ✅ Expiración automática a los 30 días
- ✅ Tracking de dispositivos
