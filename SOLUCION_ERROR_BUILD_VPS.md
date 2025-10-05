# Guía Rápida: Solución Error de Build en VPS

## ❌ Problema

El build de Docker falla con el error:
```
Error: Missing Supabase environment variables
WARNING: The NEXT_PUBLIC_SUPABASE_URL variable is not set. Defaulting to a blank string.
```

## 🔍 Causa

El VPS no tiene un archivo `.env` con las variables de entorno necesarias. Docker Compose intenta cargar las variables pero no las encuentra, por lo que durante el build de Next.js fallan las rutas API que dependen de Supabase.

## ✅ Solución

### Opción 1: Usar el script automático (RECOMENDADO)

1. **En el VPS, crea el archivo .env:**
```bash
cd ~/lacasadelsueloradiante
nano .env
```

2. **Copia y pega este contenido (REEMPLAZA los valores):**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role

# Database
DATABASE_URL=postgresql://postgres:[password]@db.tu-proyecto.supabase.co:5432/postgres

# Email Configuration
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion
EMAIL_FROM_NAME=La Casa del Suelo Radiante
EMAIL_FROM_ADDRESS=tu-email@gmail.com
EMAIL_REPLY_TO=tu-email@gmail.com
EMAIL_ADMIN_ADDRESS=tu-email@gmail.com

# NextAuth
NEXTAUTH_URL=https://lacasadelsueloradiante.es
NEXTAUTH_SECRET=genera_un_secret_con_openssl_rand_base64_32

# App URLs
NEXT_PUBLIC_APP_URL=https://lacasadelsueloradiante.es
NEXT_PUBLIC_API_URL=https://lacasadelsueloradiante.es/api

# Business Information
BUSINESS_NAME=La Casa del Suelo Radiante
BUSINESS_ADDRESS=Tu dirección completa
BUSINESS_PHONE=+34 XXX XXX XXX
BUSINESS_EMAIL=info@lacasadelsueloradiante.es
BUSINESS_CIF=B-XXXXXXXX

# Environment
NODE_ENV=production
```

3. **Guarda el archivo** (Ctrl+O, Enter, Ctrl+X)

4. **Ejecuta el script de deployment:**
```bash
chmod +x deploy-vps-with-env.sh
./deploy-vps-with-env.sh
```

### Opción 2: Deployment manual paso a paso

Si prefieres hacer el proceso manualmente:

```bash
# 1. Asegúrate de tener el archivo .env creado
cat .env  # Verificar que existe y tiene contenido

# 2. Parar contenedores
docker-compose stop

# 3. Eliminar contenedores y red
docker-compose down --remove-orphans

# 4. Build con las variables de entorno
docker-compose build --no-cache

# 5. Levantar servicios
docker-compose up -d

# 6. Ver logs
docker-compose logs -f nextjs-app
```

## 🔧 Generar NEXTAUTH_SECRET

Si no tienes un `NEXTAUTH_SECRET`, genera uno con:

```bash
openssl rand -base64 32
```

Copia el resultado y úsalo en tu archivo `.env`.

## 📋 Variables Críticas Requeridas

Estas variables son OBLIGATORIAS para que la aplicación funcione:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave pública de Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Clave privada de Supabase (admin)
- ✅ `NEXTAUTH_SECRET` - Secret para NextAuth (genera uno único)

## 🔐 Dónde Encontrar tus Claves de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Seguridad

- **NUNCA** subas el archivo `.env` a Git
- El archivo `.env` ya está en `.gitignore`
- Cada entorno (local, VPS) debe tener su propio `.env`
- Mantén las claves `SERVICE_ROLE_KEY` en secreto (tienen acceso completo)

## 🧪 Verificar que Funciona

Después del deployment:

```bash
# Ver si el contenedor está corriendo
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f nextjs-app

# Verificar que la app responde
curl http://localhost:3000

# Si tienes nginx configurado
curl http://tu-dominio.com
```

## 🆘 Troubleshooting

### "Network has active endpoints (nginx-container)"

Si ves este error al hacer `docker-compose down`:

```bash
# Parar nginx externo primero
docker stop nginx-container

# Luego hacer down
docker-compose down --remove-orphans

# O forzar la eliminación de la red
docker network rm lacasadelsueloradiante_app-network
```

### El build falla con "Module not found: Can't resolve 'iconv-lite'"

Estos son warnings normales de dependencias opcionales de PDFKit. No afectan la funcionalidad. Si quieres eliminarlos:

```bash
# Instalar las dependencias opcionales
pnpm add iconv-lite puppeteer
```

### "Node.js 18 and below are deprecated"

Next.js recomienda Node 20+. Para actualizar el Dockerfile:

```dockerfile
FROM node:20-alpine AS base
```

## 📚 Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)

## ✅ Checklist de Deployment

- [ ] Archivo `.env` creado en el VPS
- [ ] Variables de Supabase configuradas
- [ ] `NEXTAUTH_SECRET` generado
- [ ] Variables de email configuradas (si usas email)
- [ ] Variables de negocio configuradas
- [ ] Script de deployment ejecutado
- [ ] Contenedor corriendo (`docker-compose ps`)
- [ ] Aplicación accesible (navegador o curl)
- [ ] Logs sin errores críticos
