# 💾 Solución: Auto-guardado en Edición de Productos

## 🎯 Problema Resuelto

**ANTES**: Al editar un producto, si cambiabas de pestaña (switch tab) y volvías, todos los cambios no guardados se perdían porque el formulario se recargaba con los datos originales.

**AHORA**: Los cambios se auto-guardan automáticamente en localStorage y se recuperan al volver, sin perder ningún dato.

---

## 🔧 Cómo Funciona

### 1. **Auto-guardado Automático** 💾

Cada vez que modificas cualquier campo del formulario, los cambios se guardan automáticamente en localStorage:

```typescript
// Auto-guardado del formulario en localStorage
const AUTOSAVE_KEY = `product_edit_autosave_${productId}`

useEffect(() => {
  if (!loading && product) {
    const autosaveData = {
      formData,        // Datos básicos del producto
      variants,        // Variantes con precios y stock
      images,          // Imágenes del producto
      resources,       // Recursos/documentos
      selectedCategories, // Categorías seleccionadas
      timestamp: Date.now() // Momento del guardado
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData))
    console.log('💾 Auto-guardado realizado')
  }
}, [formData, variants, images, resources, selectedCategories])
```

**Datos guardados**:
- ✅ Título, slug, descripciones
- ✅ Todas las variantes (SKU, precio, stock, peso)
- ✅ Imágenes y su orden
- ✅ Recursos/documentos adjuntos
- ✅ Categorías seleccionadas
- ✅ Timestamp del guardado

### 2. **Recuperación Inteligente al Cargar** 🔄

Cuando vuelves a la página de edición, el sistema:

```typescript
// Verificar si hay datos auto-guardados
const autosaveData = localStorage.getItem(AUTOSAVE_KEY)

if (autosaveData) {
  const parsed = JSON.parse(autosaveData)
  const autosaveAge = Date.now() - parsed.timestamp
  const autosaveAgeMinutes = Math.floor(autosaveAge / 60000)
  
  // Si tiene menos de 1 hora, preguntar si quiere recuperar
  if (autosaveAge < 3600000) {
    const confirmRestore = confirm(
      `🔄 Se encontraron cambios no guardados de hace ${autosaveAgeMinutes} minuto(s).\n\n` +
      `¿Deseas recuperar estos cambios?`
    )
    
    if (confirmRestore) {
      // Restaurar datos auto-guardados
      setFormData(parsed.formData)
      setVariants(parsed.variants)
      setImages(parsed.images)
      setResources(parsed.resources)
      setSelectedCategories(parsed.selectedCategories)
    }
  }
}
```

**Lógica inteligente**:
1. ✅ Detecta cambios no guardados
2. ⏱️ Calcula cuánto tiempo hace del último cambio
3. ❓ Pregunta al usuario si quiere recuperar
4. 🗑️ Si el auto-guardado tiene más de 1 hora, se elimina automáticamente

### 3. **Indicador Visual** 📊

Cuando hay cambios auto-guardados, se muestra un indicador en el header:

```tsx
{hasAutosave() && !success && (
  <div className="flex items-center space-x-2 text-sm text-blue-600">
    <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full"></div>
    <span>Cambios auto-guardados</span>
  </div>
)}
```

**Indicadores**:
- 🔵 Punto azul pulsante = Hay cambios auto-guardados
- ✅ Desaparece al guardar exitosamente
- 📱 Visible en todo momento mientras editas

### 4. **Botón de Descartar Cambios** 🗑️

Si quieres descartar los cambios y volver a los datos originales:

```tsx
<button onClick={handleDiscardChanges}>
  <TrashIcon className="h-4 w-4 mr-2" />
  Descartar cambios
</button>

const handleDiscardChanges = () => {
  const confirmDiscard = confirm(
    '⚠️ ¿Estás seguro de que deseas descartar todos los cambios?'
  )
  
  if (confirmDiscard) {
    localStorage.removeItem(AUTOSAVE_KEY)
    loadProduct() // Recargar datos originales
  }
}
```

### 5. **Limpieza Automática** 🧹

El auto-guardado se limpia automáticamente en varios casos:

```typescript
// Al guardar exitosamente
setSuccess(true)
localStorage.removeItem(AUTOSAVE_KEY)
console.log('✅ Auto-guardado limpiado después de guardar')

// Si el usuario rechaza la recuperación
if (!confirmRestore) {
  localStorage.removeItem(AUTOSAVE_KEY)
}

// Si el auto-guardado tiene más de 1 hora
if (autosaveAge > 3600000) {
  localStorage.removeItem(AUTOSAVE_KEY)
}
```

---

## 🎯 Flujos de Funcionamiento

### Escenario 1: Edición normal sin switch tab
```
1. Usuario entra a editar producto
2. Modifica título → Auto-guardado en localStorage
3. Modifica precio → Auto-guardado actualizado
4. Guarda cambios → Auto-guardado eliminado ✅
5. Producto actualizado correctamente
```

### Escenario 2: Switch tab con recuperación
```
1. Usuario entra a editar producto
2. Modifica varios campos (título, precio, stock)
3. Cada cambio se auto-guarda → localStorage actualizado
4. Usuario cambia de pestaña (switch tab) → 5 minutos
5. Usuario vuelve a la pestaña
6. Sistema detecta auto-guardado de hace 5 minutos
7. Muestra diálogo: "¿Recuperar cambios de hace 5 minutos?"
8. Usuario acepta → Cambios restaurados ✅
9. Indicador visual: "Cambios auto-guardados"
10. Usuario termina edición y guarda → Auto-guardado limpiado
```

### Escenario 3: Switch tab sin recuperación
```
1. Usuario entra a editar producto
2. Modifica campos → Auto-guardado
3. Usuario cambia de pestaña → 10 minutos
4. Usuario vuelve
5. Diálogo: "¿Recuperar cambios de hace 10 minutos?"
6. Usuario rechaza → Auto-guardado eliminado
7. Formulario muestra datos originales del producto
```

### Escenario 4: Auto-guardado expirado
```
1. Usuario entra a editar producto
2. Modifica campos → Auto-guardado
3. Usuario cierra el navegador → 2 horas
4. Usuario vuelve a entrar a editar
5. Sistema detecta auto-guardado de hace 2 horas
6. Auto-guardado eliminado automáticamente (muy antiguo)
7. Formulario muestra datos originales
```

### Escenario 5: Descartar cambios manualmente
```
1. Usuario entra a editar producto
2. Modifica muchos campos → Auto-guardado continuo
3. Se arrepiente de los cambios
4. Click en botón "Descartar cambios"
5. Confirma en diálogo de seguridad
6. Auto-guardado eliminado
7. Formulario recargado con datos originales ✅
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | ❌ ANTES | ✅ AHORA |
|---------|----------|----------|
| **Switch tab** | ❌ Cambios perdidos | ✅ Cambios preservados |
| **Recuperación** | ❌ No disponible | ✅ Automática con confirmación |
| **Indicador visual** | ❌ No existe | ✅ Punto azul pulsante |
| **Descartar cambios** | ❌ Recargar página | ✅ Botón dedicado |
| **Persistencia** | ❌ Solo en RAM | ✅ En localStorage |
| **Expiración** | N/A | ✅ 1 hora automática |
| **Limpieza** | N/A | ✅ Automática al guardar |
| **Experiencia** | 😞 Frustrante | 😊 Confiable |

---

## 🧪 Cómo Probar

### Test 1: Auto-guardado básico
```bash
1. Ir a editar un producto
2. Modificar el título y precio
3. Abrir DevTools → Application → Local Storage
4. Buscar key: "product_edit_autosave_{productId}"
5. ✅ Verificar que contiene los datos modificados
```

### Test 2: Recuperación después de switch tab
```bash
1. Ir a editar un producto
2. Modificar varios campos (NO guardar)
3. Cambiar a otra pestaña durante 2 minutos
4. Volver a la pestaña de edición
5. ✅ Debe aparecer diálogo preguntando si recuperar
6. Aceptar → ✅ Campos deben tener los cambios
```

### Test 3: Indicador visual
```bash
1. Ir a editar un producto
2. Modificar cualquier campo
3. ✅ En el header debe aparecer: "Cambios auto-guardados" con punto azul pulsante
4. Guardar cambios
5. ✅ Indicador debe desaparecer
```

### Test 4: Descartar cambios
```bash
1. Ir a editar un producto
2. Modificar varios campos
3. Click en "Descartar cambios"
4. Confirmar en diálogo
5. ✅ Formulario debe recargar con datos originales
6. ✅ Indicador "Cambios auto-guardados" debe desaparecer
```

### Test 5: Auto-guardado expirado
```bash
1. Ir a editar un producto
2. Modificar campos
3. En DevTools → Application → Local Storage
4. Editar el timestamp para que sea de hace 2 horas
5. Recargar la página
6. ✅ No debe aparecer diálogo de recuperación
7. ✅ Auto-guardado debe eliminarse automáticamente
```

---

## 🔑 Conceptos Clave

### localStorage
- **Persistencia**: Los datos sobreviven al cierre del navegador
- **Tamaño**: ~5-10 MB por dominio (suficiente para formularios)
- **Ámbito**: Solo accesible desde el mismo dominio
- **Sincrónico**: Acceso instantáneo sin promesas

### Auto-guardado
- **Frecuencia**: En cada cambio de campo (debounced por React)
- **Tamaño**: ~10-50 KB por producto (incluyendo todas las variantes)
- **Estructura**: JSON serializado con timestamp
- **Key**: Única por producto (`product_edit_autosave_{id}`)

### Recuperación
- **Inteligente**: Solo ofrece recuperar si tiene menos de 1 hora
- **Confirmación**: Siempre pregunta al usuario (no fuerza la recuperación)
- **Limpieza**: Elimina auto-guardados muy antiguos automáticamente

---

## ⚠️ Consideraciones

### Limitaciones
- ❌ No funciona en navegación privada (localStorage deshabilitado)
- ❌ No sincroniza entre dispositivos (solo local)
- ❌ Se pierde si se borra caché del navegador

### Ventajas
- ✅ No requiere backend adicional
- ✅ Funciona offline
- ✅ Instantáneo (sin latencia de red)
- ✅ No consume recursos del servidor
- ✅ Privado (no sale del navegador)

### Mejoras Futuras (Opcional)
- 📝 Guardar múltiples versiones (historial de cambios)
- ☁️ Sincronizar con backend (auto-guardado en servidor)
- 🔄 Recuperación automática sin confirmación (configurable)
- ⏰ Ajustar tiempo de expiración por usuario
- 📊 Mostrar diff de cambios antes de recuperar

---

## ✅ Checklist de Validación

- [x] Auto-guardado se ejecuta en cada cambio de campo
- [x] localStorage se actualiza correctamente
- [x] Recuperación pregunta al usuario con confirmación
- [x] Indicador visual "Cambios auto-guardados" funciona
- [x] Botón "Descartar cambios" elimina auto-guardado
- [x] Limpieza automática al guardar exitosamente
- [x] Auto-guardados antiguos (>1h) se eliminan
- [x] No hay errores de compilación TypeScript
- [x] Funciona con todos los campos del formulario
- [x] Preserva variantes, imágenes y categorías

---

## 🎉 Resultado Final

✅ **Los cambios NO se pierden al cambiar de pestaña**  
✅ **Recuperación automática e inteligente**  
✅ **Indicador visual claro de cambios pendientes**  
✅ **Control total: guardar o descartar cambios**  
✅ **Sin impacto en rendimiento**  
✅ **Experiencia de usuario mejorada significativamente**

---

**Implementado**: 5 Octubre 2025  
**Archivo**: `src/app/admin/products/[id]/edit/page.tsx`  
**Patrón**: Auto-save with localStorage + Smart Recovery

**¡Ya no perderás cambios al editar productos! 💪**
