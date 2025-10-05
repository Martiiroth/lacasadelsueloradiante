# ✨ Auto-Recuperación Automática de Cambios - Sin Refresh

## 🎯 Problema Resuelto

**ANTES:**
- Usuario edita un producto
- Cambia de pestaña sin guardar
- Los cambios se auto-guardan en localStorage ✅
- Al volver a la pestaña: **NECESITABA REFRESCAR (F5)** para recuperarlos ❌

**AHORA:**
- Usuario edita un producto
- Cambia de pestaña sin guardar
- Los cambios se auto-guardan en localStorage ✅
- Al volver a la pestaña: **RECUPERA AUTOMÁTICAMENTE SIN REFRESCAR** ✅

---

## 🚀 Cómo Funciona

### 1. **Auto-Guardado Continuo**
```typescript
useEffect(() => {
  if (!loading && product) {
    const autosaveData = {
      formData,
      variants,
      images,
      resources,
      selectedCategories,
      timestamp: Date.now()
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData))
    setHasUnsavedChanges(true)
    console.log('💾 Auto-guardado realizado')
  }
}, [formData, variants, images, resources, selectedCategories, loading, product])
```

**Qué hace:**
- Detecta cada cambio en el formulario
- Guarda instantáneamente en localStorage
- Marca que hay cambios no guardados

---

### 2. **Recuperación Automática al Volver**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && product && hasUnsavedChanges) {
      console.log('👁️ Pestaña visible - Verificando auto-guardado...')
      
      const autosaveData = localStorage.getItem(AUTOSAVE_KEY)
      if (autosaveData) {
        const parsed = JSON.parse(autosaveData)
        const autosaveAge = Date.now() - parsed.timestamp
        
        if (autosaveAge < 3600000) { // Menos de 1 hora
          // Recuperar automáticamente
          setFormData(parsed.formData)
          setVariants(parsed.variants)
          setImages(parsed.images)
          setResources(parsed.resources)
          setSelectedCategories(parsed.selectedCategories)
          
          // Mostrar notificación
          setAutoRecovered(true)
          setTimeout(() => setAutoRecovered(false), 4000)
        }
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleVisibilityChange)
}, [product, hasUnsavedChanges, AUTOSAVE_KEY])
```

**Qué hace:**
- Escucha eventos de `visibilitychange` (cambio de pestaña)
- Escucha eventos de `focus` (volver a la ventana)
- Al detectar que vuelves a la pestaña:
  1. Verifica si hay auto-guardado reciente (< 1 hora)
  2. **Recupera automáticamente** todos los datos
  3. Muestra notificación azul temporal
- **NO pregunta al usuario** - lo hace automáticamente

---

### 3. **Limpieza Inteligente**

#### Al Guardar Exitosamente:
```typescript
setSuccess(true)
localStorage.removeItem(AUTOSAVE_KEY)
setHasUnsavedChanges(false)
console.log('✅ Auto-guardado limpiado después de guardar')
```

#### Al Descartar Cambios:
```typescript
if (confirmDiscard) {
  localStorage.removeItem(AUTOSAVE_KEY)
  setHasUnsavedChanges(false)
  console.log('🗑️ Cambios descartados, recargando datos originales')
  loadProduct()
}
```

---

## 🎨 UI/UX Mejorada

### 1. **Indicador de Cambios Auto-Guardados**
```tsx
{hasAutosave() && !success && (
  <div className="flex items-center space-x-2 text-sm text-blue-600">
    <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full"></div>
    <span>Cambios auto-guardados</span>
  </div>
)}
```

**Muestra:**
- Punto azul pulsante
- Texto "Cambios auto-guardados"
- Solo visible cuando hay cambios pendientes

---

### 2. **Notificación de Recuperación Automática**
```tsx
{autoRecovered && (
  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
    <div className="flex">
      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
      <div className="ml-3">
        <p className="text-sm font-medium text-blue-800">
          ✨ Cambios no guardados recuperados automáticamente
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Tus modificaciones se han restaurado sin necesidad de refrescar la página
        </p>
      </div>
    </div>
  </div>
)}
```

**Muestra:**
- Banner azul con ícono de check
- Mensaje claro y amigable
- Se oculta automáticamente después de 4 segundos
- **Solo aparece cuando se recuperan cambios automáticamente**

---

### 3. **Botón de Descartar Cambios**
```tsx
{hasAutosave() && !success && (
  <button onClick={handleDiscardChanges} type="button">
    <TrashIcon className="h-4 w-4 mr-2" />
    Descartar cambios
  </button>
)}
```

**Permite:**
- Descartar cambios auto-guardados manualmente
- Volver a los datos originales del producto
- Confirmación antes de descartar

---

## 📊 Flujo Completo

### Escenario 1: Usuario Edita y Cambia de Pestaña
```
1. Usuario abre /admin/products/[id]/edit
   └─> Carga datos del producto

2. Usuario modifica "Título" de "Producto A" a "Producto B"
   └─> Auto-guardado en localStorage ✅
   └─> Aparece indicador "Cambios auto-guardados" 💾

3. Usuario cambia a otra pestaña (Gmail, YouTube, etc.)
   └─> localStorage mantiene los cambios

4. Usuario VUELVE a la pestaña del producto
   └─> Evento 'visibilitychange' detectado 👁️
   └─> Verifica localStorage
   └─> Encuentra cambios de hace 30 segundos
   └─> RECUPERA AUTOMÁTICAMENTE sin preguntar ✨
   └─> Muestra notificación azul: "Cambios recuperados automáticamente"
   └─> Usuario ve "Producto B" sin haber refrescado 🎉

5. Usuario termina de editar y presiona "Guardar"
   └─> Se guarda en base de datos
   └─> Se limpia el auto-guardado
   └─> Se limpia el flag de hasUnsavedChanges
   └─> Redirect a /admin/products/[id]
```

---

### Escenario 2: Usuario Cierra Navegador y Vuelve
```
1. Usuario edita un producto
   └─> Auto-guardado en localStorage ✅

2. Usuario CIERRA EL NAVEGADOR (sin guardar)
   └─> localStorage persiste

3. Usuario REABRE EL NAVEGADOR después de 10 minutos
   └─> Va a /admin/products/[id]/edit
   └─> loadProduct() detecta auto-guardado
   └─> Pregunta: "¿Recuperar cambios de hace 10 minutos?" ❓
   └─> Usuario acepta ✅
   └─> Se recuperan los cambios

4. Usuario cambia a otra pestaña
   └─> Al volver, recuperación automática sin preguntar ✨
```

**Diferencia clave:**
- **Primera carga después de refresh:** Pregunta si quiere recuperar
- **Cambio de pestaña (sin refresh):** Recupera automáticamente sin preguntar

---

## 🔧 Eventos Escuchados

| Evento | Cuándo se dispara | Acción |
|--------|-------------------|--------|
| `visibilitychange` | Al cambiar de pestaña | Recuperar auto-guardado si existe |
| `focus` | Al enfocar la ventana | Recuperar auto-guardado si existe |
| Form changes | Cada cambio en el formulario | Guardar en localStorage |
| Submit | Al presionar "Guardar" | Limpiar auto-guardado |
| Discard | Al presionar "Descartar cambios" | Limpiar y recargar original |

---

## ⚙️ Configuración

### Tiempo de Expiración
```typescript
const autosaveAge = Date.now() - parsed.timestamp

// Auto-guardado válido por 1 hora
if (autosaveAge < 3600000) { // 3600000 ms = 1 hora
  // Recuperar
}
```

**Modificar:**
- `3600000` = 1 hora
- `1800000` = 30 minutos
- `7200000` = 2 horas

---

### Tiempo de Notificación
```typescript
setAutoRecovered(true)
setTimeout(() => setAutoRecovered(false), 4000) // 4 segundos
```

**Modificar:**
- `4000` = 4 segundos (actual)
- `3000` = 3 segundos (más rápido)
- `6000` = 6 segundos (más lento)

---

## 🎯 Beneficios

### Para el Usuario
✅ **No pierde trabajo** - Auto-guardado continuo
✅ **No necesita refrescar** - Recuperación automática
✅ **Feedback visual claro** - Indicadores y notificaciones
✅ **Control manual** - Puede descartar si quiere
✅ **Sin interrupciones** - Flujo de trabajo natural

### Para el Negocio
✅ **Menos frustraciones** - Mejor experiencia de usuario
✅ **Más productividad** - Menos tiempo perdido
✅ **Menos soporte** - Menos tickets de "perdí mis cambios"
✅ **Mejor retención** - Usuarios más satisfechos

---

## 🧪 Testing

### Test 1: Recuperación al Cambiar de Pestaña
```
1. Editar producto
2. Cambiar título
3. Cambiar a otra pestaña (Gmail)
4. Esperar 5 segundos
5. Volver a pestaña del producto
✅ Debería: Mostrar notificación azul "Cambios recuperados"
✅ Debería: Mantener el título editado sin refresh
```

### Test 2: Múltiples Cambios de Pestaña
```
1. Editar título a "Test 1"
2. Cambiar de pestaña
3. Volver (debería mostrar "Test 1")
4. Editar título a "Test 2"
5. Cambiar de pestaña
6. Volver (debería mostrar "Test 2")
✅ Debería: Recuperar siempre el último cambio
```

### Test 3: Guardar y Limpiar
```
1. Editar producto
2. Cambiar de pestaña y volver (recupera cambios)
3. Presionar "Guardar"
4. Recargar página con F5
✅ Debería: NO preguntar si quiere recuperar (ya guardado)
✅ Debería: NO mostrar indicador "Cambios auto-guardados"
```

### Test 4: Descartar Cambios
```
1. Editar producto
2. Cambiar de pestaña y volver
3. Presionar "Descartar cambios"
4. Confirmar
✅ Debería: Volver a datos originales
✅ Debería: Limpiar localStorage
✅ Debería: Ocultar indicador de auto-guardado
```

---

## 📝 Logs de Debugging

```
Console logs que verás:

💾 Auto-guardado realizado
👁️ Pestaña visible - Verificando auto-guardado...
🔄 Auto-guardado encontrado (30s ago)
✅ Cambios recuperados automáticamente
✅ Auto-guardado limpiado después de guardar
🗑️ Cambios descartados, recargando datos originales
```

---

## 🚀 Próximas Mejoras (Opcional)

- [ ] Sincronización en tiempo real entre pestañas (Broadcast Channel API)
- [ ] Versionado de auto-guardados (múltiples puntos de restauración)
- [ ] Comparación visual de cambios (diff)
- [ ] Auto-guardado en servidor (no solo localStorage)
- [ ] Notificación de conflictos si otro usuario edita

---

**Resultado Final:** Experiencia de edición fluida sin pérdida de datos, similar a Google Docs o Notion. 🎉
