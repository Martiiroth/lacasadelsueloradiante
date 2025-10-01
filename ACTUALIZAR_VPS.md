# 🚀 ACTUALIZAR VPS - Fix Filtros Duplicados

## Solución Aplicada

Se agregaron las clases CSS personalizadas `mobile-filters` y `desktop-filters` que tienen reglas con `!important` en `globals.css`:

- `mobile-filters`: Se muestra solo en pantallas < 1024px (móviles/tablets)
- `desktop-filters`: Se muestra solo en pantallas ≥ 1024px (desktop)

Estas clases sobrescriben cualquier conflicto de CSS y garantizan que:
- ✅ En móvil: Solo se ve el acordeón de filtros colapsable
- ✅ En desktop: Solo se ve la sidebar de filtros a la izquierda

## 📋 Pasos para Actualizar el VPS

### 1. Conectar al VPS
```bash
ssh root@217.154.102.142
```

### 2. Navegar al directorio del proyecto
```bash
cd /root/lacasadelsueloradiante
```

### 3. Detener los contenedores
```bash
docker-compose down
```

### 4. Actualizar el código desde GitHub
```bash
git pull origin main
```

### 5. Reconstruir la imagen (forzar sin caché)
```bash
docker-compose build --no-cache
```

### 6. Iniciar los contenedores
```bash
docker-compose up -d
```

### 7. Ver los logs (opcional)
```bash
docker-compose logs -f
```

Presiona `Ctrl+C` para salir de los logs.

## ✅ Verificación

1. Espera 30-60 segundos después de `docker-compose up -d`
2. Abre http://217.154.102.142:3000/products
3. **En desktop**: Deberías ver solo UN filtro en el lado izquierdo
4. **En móvil**: Deberías ver solo el botón de filtros colapsable en la parte superior

## 🔄 Script Rápido (Todo en uno)

Si prefieres ejecutar todo de una vez:

```bash
ssh root@217.154.102.142 << 'ENDSSH'
cd /root/lacasadelsueloradiante
docker-compose down
git pull origin main
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
ENDSSH
```

## 📝 Notas Técnicas

- Las clases `mobile-filters` y `desktop-filters` están definidas en `src/app/globals.css`
- Usan `!important` para sobrescribir cualquier otro CSS
- Son mobile-first: ocultan con `display: none !important` según el breakpoint
- Breakpoint: 1024px (clase `lg:` de Tailwind)
