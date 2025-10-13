# 📧 Sistema de Recuperación de Contraseñas Personalizado

Este proyecto ahora incluye un sistema completo de recuperación de contraseñas que **no depende** del servicio de email de Supabase (que está deshabilitado en instalaciones self-hosted).

## ✅ ¿Qué se implementó?

### 1. **Servicio de Email Personalizado** (`/src/lib/passwordResetService.ts`)
- ✅ Clase `PasswordResetEmailService` con Nodemailer
- ✅ Generación y validación de tokens UUID
- ✅ Gestión de base de datos para tokens
- ✅ Templates HTML y texto plano para emails
- ✅ Sistema de expiración de tokens (1 hora)

### 2. **APIs REST** 
- ✅ **POST** `/api/send-reset-email` - Envía email de recuperación
- ✅ **POST** `/api/reset-password` - Valida token y cambia contraseña

### 3. **Base de Datos**
- ✅ Tabla `password_reset_tokens` con esquema completo
- ✅ Indexes para optimización
- ✅ Campos: token (UUID), email, expires_at, used, created_at

### 4. **Frontend Actualizado**
- ✅ `/auth/forgot-password` usa API personalizada
- ✅ `/auth/reset-password` con validación de tokens
- ✅ Manejo de errores y estados de carga
- ✅ Compliance con Next.js 15 (Suspense boundaries)

## 🚀 Configuración

### 1. **Variables de Entorno - ✅ YA CONFIGURADO**

Tu configuración SMTP ya está lista en `.env.production`:

```env
# URL del sitio
NEXT_PUBLIC_SITE_URL=https://lacasadelsueloradiante.es

# SMTP - Servidor propio ✅ FUNCIONANDO
EMAIL_HOST=mail.lacasadelsueloradiante.es
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=consultas@lacasadelsueloradiante.es
EMAIL_PASSWORD=Limpiezas-2024
EMAIL_FROM=consultas@lacasadelsueloradiante.es
```

**Estado**: ✅ **Conexión SMTP verificada y funcionando**

### 2. **Base de Datos**
Ejecuta la migración SQL:

```bash
psql "$DATABASE_URL" -f database/password_reset_tokens.sql
```

### 3. **Servidor SMTP - ✅ CONFIGURADO**

Tu servidor de email personalizado `mail.lacasadelsueloradiante.es` está configurado y funcionando:

- ✅ **Host**: mail.lacasadelsueloradiante.es
- ✅ **Puerto**: 587 (STARTTLS)
- ✅ **Autenticación**: consultas@lacasadelsueloradiante.es
- ✅ **Conexión verificada**: Email de prueba enviado exitosamente

## 📋 Testing

### 1. **Script de Prueba**
```bash
# Probar con un email real
./test-password-reset.sh usuario@gmail.com
```

### 2. **Prueba Manual**
1. Ve a `/auth/forgot-password`
2. Introduce un email registrado
3. Revisa tu bandeja de entrada
4. Haz clic en el enlace del email
5. Cambia la contraseña en `/auth/reset-password?token=...`

## 🔧 Proveedores SMTP Alternativos

### **SendGrid**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=tu-sendgrid-api-key
```

### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@tu-dominio.mailgun.org
EMAIL_PASSWORD=tu-mailgun-password
```

### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## 🏗️ Arquitectura del Sistema

```
[Usuario] 
    ↓ (olvida contraseña)
[/auth/forgot-password] 
    ↓ (POST email)
[/api/send-reset-email] 
    ↓ (genera token UUID)
[Database: password_reset_tokens] 
    ↓ (envía email con Nodemailer)
[Email Provider: Gmail/SendGrid/etc]
    ↓ (usuario recibe email)
[Email con enlace + token]
    ↓ (clic en enlace)
[/auth/reset-password?token=uuid]
    ↓ (POST token + nueva contraseña)
[/api/reset-password]
    ↓ (valida token, actualiza password)
[Supabase Auth] ✅
```

## 🔐 Características de Seguridad

- ✅ **Tokens UUID únicos** (imposibles de adivinar)
- ✅ **Expiración automática** (1 hora)
- ✅ **Un solo uso** (tokens se marcan como usados)
- ✅ **Validación de usuario existente**
- ✅ **No revelación de información** (mismo mensaje si el email existe o no)
- ✅ **Limpieza automática** de tokens antiguos

## 📊 Estado de Dependencias

```json
{
  "nodemailer": "^7.0.6",        // ✅ Servicio SMTP
  "uuid": "^13.0.0",             // ✅ Generación de tokens
  "@types/nodemailer": "^7.0.2"  // ✅ Tipos TypeScript
}
```

## 🎯 Próximos Pasos

1. **Configura tu proveedor SMTP** (Gmail recomendado para desarrollo)
2. **Ejecuta la migración** de base de datos
3. **Prueba el flujo completo** con un email real
4. **Deploya a producción** con variables de entorno configuradas

¿Todo listo! 🚀 Tu sistema de recuperación de contraseñas ya no depende de Supabase y funciona de forma completamente independiente.