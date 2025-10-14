# ============================================================================
# GUÍA COMPLETA: DÓNDE VA CADA COSA EN EL SERVIDOR
# ============================================================================

## 🏗️ ESTRUCTURA DEL SERVIDOR VPS

Tu servidor tiene esta estructura:
```
/root/
├── supabase-automated-self-host/
│   └── docker/
│       ├── .env                          # ← AQUÍ configuramos GoTrue
│       ├── docker-compose.yml            # ← Orquestación de servicios
│       └── volumes/                      # ← Datos persistentes
└── tu-aplicacion-nextjs/                 # ← Tu app web (opcional)
```

## 📧 PLANTILLA DE EMAIL - OPCIÓN 1: EN TU WEB (RECOMENDADO)

### Paso 1: Subir plantilla a tu aplicación Next.js

**EN TU MÁQUINA LOCAL:**
```bash
# La plantilla ya está en:
./public/templates/recovery-email.html

# Hacer deploy de tu aplicación para que sea accesible en:
# https://lacasadelsueloradiante.es/templates/recovery-email.html
```

### Paso 2: Configurar el .env de Supabase en el servidor

**EN EL SERVIDOR VPS:**
```bash
# 1. Conectar al servidor
ssh root@tu-servidor-ip

# 2. Ir al directorio de Supabase
cd ~/supabase-automated-self-host/docker

# 3. Hacer backup del .env actual
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# 4. Editar el archivo de configuración
nano .env
```

**CONFIGURACIÓN EXACTA PARA EL .env:**
```bash
# ✅ ELIMINAR estas líneas (si existen):
# GOTRUE_EXTERNAL_REDIRECT_ENABLED=true
# GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true

# ✅ VERIFICAR/AÑADIR estas líneas:
SITE_URL=https://lacasadelsueloradiante.es
MAILER_URLPATHS_RECOVERY=/auth/reset-password
ADDITIONAL_REDIRECT_URLS=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**

# ✅ AÑADIR la plantilla personalizada:
MAILER_TEMPLATES_RECOVERY=https://lacasadelsueloradiante.es/templates/recovery-email.html

# ✅ OPCIONAL - Sujeto personalizado:
MAILER_SUBJECTS_RECOVERY=Recupera tu contraseña - La Casa del Suelo Radiante
```

## 📧 PLANTILLA DE EMAIL - OPCIÓN 2: DIRECTAMENTE EN EL SERVIDOR

Si prefieres que la plantilla esté en el servidor VPS:

### Paso 1: Crear directorio para plantillas en el servidor

**EN EL SERVIDOR VPS:**
```bash
# 1. Crear directorio para plantillas
mkdir -p /var/www/email-templates

# 2. Subir la plantilla desde tu máquina local
scp public/templates/recovery-email.html root@tu-servidor:/var/www/email-templates/

# 3. Configurar nginx para servir las plantillas
nano /etc/nginx/sites-available/default
```

**AÑADIR AL NGINX:**
```nginx
server {
    listen 443 ssl;
    server_name lacasadelsueloradiante.es;
    
    # Tu configuración SSL existente...
    
    # AÑADIR esta sección:
    location /templates/ {
        alias /var/www/email-templates/;
        expires 1d;
        add_header Cache-Control "public, no-transform";
        add_header Content-Type "text/html; charset=utf-8";
    }
    
    # El resto de tu configuración...
}
```

### Paso 2: Reiniciar nginx y configurar .env

```bash
# Verificar configuración de nginx
nginx -t

# Reiniciar nginx
systemctl reload nginx

# Ir a directorio de Supabase y configurar .env (igual que Opción 1)
cd ~/supabase-automated-self-host/docker
nano .env
```

## ⚙️ CONFIGURACIÓN DEL .ENV COMPLETA

**ARCHIVO: `/root/supabase-automated-self-host/docker/.env`**

```bash
##############################
# Supabase Self-Hosting ENV
##############################

# ============================================================================
# MANTENER TODA TU CONFIGURACIÓN ACTUAL Y SOLO MODIFICAR ESTAS SECCIONES:
# ============================================================================

############
# Auth (GoTrue) - CONFIGURACIÓN PARA RESET PASSWORD
############

# ✅ URLs BÁSICAS
SITE_URL=https://lacasadelsueloradiante.es
API_EXTERNAL_URL=https://supabase.lacasadelsueloradianteapp.com/goapi

# ✅ REDIRECCIONES PERMITIDAS
ADDITIONAL_REDIRECT_URLS=https://lacasadelsueloradiante.es/**,https://lacasadelsueloradiante.es/auth/**,https://lacasadelsueloradiante.es/auth/reset-password

# ✅ CONFIGURACIÓN DE EMAIL
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true

# ✅ SMTP (ya lo tienes configurado)
SMTP_HOST=mail.lacasadelsueloradiante.es
SMTP_PORT=587
SMTP_USER=consultas@lacasadelsueloradiante.es
SMTP_PASS=Limpiezas-2024
SMTP_ADMIN_EMAIL=consultas@lacasadelsueloradiante.es
SMTP_SENDER_NAME=La Casa del Suelo Radiante

# ✅ CONFIGURACIÓN ESPECÍFICA DEL RESET
MAILER_URLPATHS_RECOVERY=/auth/reset-password
MAILER_TEMPLATES_RECOVERY=https://lacasadelsueloradiante.es/templates/recovery-email.html
MAILER_SUBJECTS_RECOVERY=Recupera tu contraseña - La Casa del Suelo Radiante

# ❌ ELIMINAR ESTAS LÍNEAS (si existen):
# GOTRUE_EXTERNAL_REDIRECT_ENABLED=true
# GOTRUE_MAILER_AUTOCONFIRM_REDIRECTS=true
```

## 🔄 APLICAR LOS CAMBIOS

**EN EL SERVIDOR VPS:**
```bash
# 1. Verificar que la configuración esté correcta
cd ~/supabase-automated-self-host/docker
grep -E 'SITE_URL|MAILER_.*RECOVERY|ADDITIONAL_REDIRECT' .env

# 2. Reiniciar el servicio de autenticación
docker-compose restart auth

# 3. Verificar que esté funcionando
docker-compose ps
docker logs supabase-auth --tail 10
```

## 🧪 PROBAR EL FUNCIONAMIENTO

### 1. Verificar que la plantilla sea accesible:
```bash
curl -I https://lacasadelsueloradiante.es/templates/recovery-email.html
# Debe devolver: HTTP/2 200
```

### 2. Probar el envío de reset:
```bash
curl -X POST "https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJ0eXAiOiAiSldUIiwiYWxnIjogIkhTMjU2In0.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzU4NzAwNTMzLAogICJleHAiOiAxOTE2MzgwNTMzCn0.uhOFMEExih6oXgd9tDGK87L-xQMK6J-6w5oPDs2tnbc" \
  -d '{"email": "djmartiiservicios@gmail.com"}'
```

## 📁 RESUMEN DE UBICACIONES

### En tu máquina local:
```
./public/templates/recovery-email.html        # ← Plantilla HTML
./server-env-with-template.env               # ← Configuración .env completa
./next.config.js                             # ← Actualizado para servir templates
```

### En el servidor VPS:
```
/root/supabase-automated-self-host/docker/.env              # ← Configuración principal
/root/supabase-automated-self-host/docker/docker-compose.yml # ← Orquestación
/var/www/email-templates/recovery-email.html                # ← Plantilla (Opción 2)
/etc/nginx/sites-available/default                          # ← Config nginx (Opción 2)
```

### URLs finales:
```
https://lacasadelsueloradiante.es/templates/recovery-email.html      # ← Plantilla
https://lacasadelsueloradiante.es/auth/reset-password?token=xxx      # ← Reset page
https://supabase.lacasadelsueloradianteapp.com/auth/v1/recover       # ← API endpoint
```

## 🎯 RESULTADO ESPERADO

Cuando un usuario solicita reset de contraseña:

1. **GoTrue** lee la configuración del `.env`
2. **Descarga** la plantilla desde `MAILER_TEMPLATES_RECOVERY`
3. **Reemplaza** `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`
4. **Envía** el email con tu diseño personalizado
5. **El link** apunta a `https://lacasadelsueloradiante.es/auth/reset-password?token=xxx`

¿Te queda claro dónde va cada cosa? ¿Prefieres la Opción 1 (plantilla en tu web) o la Opción 2 (plantilla en el servidor)?