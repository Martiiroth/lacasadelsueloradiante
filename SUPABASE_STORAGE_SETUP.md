# Configuración de Supabase Storage para Imágenes de Productos

## Paso 1: Crear el Bucket

1. Ve al dashboard de Supabase: https://supabase.lacasadelsueloradianteapp.com
2. Navega a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Configura el bucket con estos valores:
   - **Name**: `product-images`
   - **Public bucket**: ✅ Marcado (activado)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

## Paso 2: Configurar Políticas RLS

Una vez creado el bucket, necesitas configurar las políticas de Row Level Security (RLS):

### Política 1: Lectura Pública
```sql
-- Permite que cualquiera pueda ver las imágenes
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

### Política 2: Subida Autenticada
```sql
-- Permite que usuarios autenticados suban imágenes
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### Política 3: Actualización Autenticada
```sql
-- Permite que usuarios autenticados actualicen imágenes
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### Política 4: Eliminación Autenticada
```sql
-- Permite que usuarios autenticados eliminen imágenes
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## Paso 3: Aplicar las Políticas

1. Ve a **SQL Editor** en el dashboard de Supabase
2. Ejecuta cada una de las políticas SQL mostradas arriba una por una
3. Verifica que todas se ejecutaron correctamente

## Paso 4: Verificar la Configuración

1. Ve de vuelta a **Storage** > **Policies**
2. Deberías ver 4 políticas para el bucket `product-images`:
   - Public Access (SELECT)
   - Authenticated users can upload images (INSERT)
   - Authenticated users can update images (UPDATE)
   - Authenticated users can delete images (DELETE)

## Estructura de Carpetas

El sistema organizará las imágenes de la siguiente manera:
```
product-images/
├── products/
│   ├── [uuid]_[timestamp]_[filename]
│   └── [uuid]_[timestamp]_[filename]
└── temp/
    └── (archivos temporales)
```

## Verificación de Funcionamiento

Una vez configurado:

1. Ve a `/admin/products` en tu aplicación
2. Intenta crear un nuevo producto
3. Sube algunas imágenes usando el componente de upload
4. Verifica que las imágenes se suben correctamente al bucket
5. Guarda el producto y verifica que las URLs de las imágenes funcionan

## Troubleshooting

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "Bucket not found"
- Verifica que el bucket `product-images` existe
- Verifica que esté marcado como público

### Error: "File type not allowed"
- Verifica que el tipo MIME del archivo esté en la lista permitida
- Los tipos permitidos son: image/jpeg, image/jpg, image/png, image/webp

### Las imágenes no se muestran
- Verifica que la política de SELECT (lectura pública) esté activa
- Verifica que las URLs generadas sean correctas

## Logs y Monitoreo

Puedes monitorear el uso del storage en:
- **Storage** > **Usage** - Para ver el espacio utilizado
- **Logs** - Para ver errores de autenticación o políticas