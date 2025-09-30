# 🏠 La Casa del Suelo Radiante - E-commerce Completo

**E-commerce profesional de sistemas de calefacción y suelo radiante construido con Next.js 14**

[![Deploy Status](https://img.shields.io/badge/Deploy-Ready-success)](./DEPLOY_DIRECTO.md)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

---

## 🚀 **DEPLOY INSTANTÁNEO EN VPS**

**¡Tu aplicación está 100% lista para producción! Solo ejecuta:**

```bash
# En tu VPS
curl -fsSL https://get.docker.com | sh && sudo apt install -y docker-compose
git clone https://github.com/Martiiroth/lacasadelsueloradiante.git
cd lacasadelsueloradiante
chmod +x deploy.sh && ./deploy.sh
```

**🎉 ¡Listo! Tu e-commerce estará funcionando inmediatamente**

📖 **[Guía completa de deploy →](./DEPLOY_DIRECTO.md)**

---

## ⚡ **Características Principales**

### �️ **E-commerce Completo**
- Catálogo de productos con categorías
- Carrito de compra persistente
- Checkout completo con direcciones de envío/facturación
- Gestión de inventario y variantes
- Sistema de cupones y descuentos

### 👤 **Gestión de Usuarios** 
- Registro y autenticación segura
- Panel de usuario (dashboard)
- Historial de pedidos
- Gestión de información personal

### � **Sistema de Notificaciones**
- **Emails automáticos** en cada cambio de estado de pedido
- **SMTP Zoho** pre-configurado
- **Templates HTML** responsivos
- Notificaciones a cliente y administrador

### ⚙️ **Panel de Administración**
- Gestión completa de productos y categorías
- Gestión de pedidos y estados
- Gestión de clientes
- Dashboard con estadísticas

### � **Seguridad y Rendimiento**
- **HTTPS** automático con certificados SSL
- **Docker** containerizado para máximo rendimiento
- **Nginx** como proxy reverso
- Headers de seguridad configurados

---

## 🏗️ **Arquitectura Técnica**

### **Frontend**
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para styling
- **Headless UI** para componentes

### **Backend**
- **Next.js API Routes**
- **Supabase** como base de datos
- **Nodemailer** para emails
- **Server-side rendering** optimizado

### **Deploy & DevOps**  
- **Docker** multi-stage builds
- **Docker Compose** con PostgreSQL, Next.js y Nginx
- **SSL/TLS** automático
- **Scripts de deploy** automatizados

---

## � **Estructura del Proyecto**

```
lacasadelsueloradiante/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── admin/             # Panel de administración
│   │   ├── api/               # API endpoints
│   │   ├── auth/              # Autenticación
│   │   ├── checkout/          # Proceso de compra
│   │   └── dashboard/         # Panel de usuario
│   ├── components/            # Componentes React
│   ├── lib/                   # Servicios y utilidades
│   └── types/                 # Definiciones TypeScript
├── docker-compose.yml         # Configuración Docker
├── Dockerfile                 # Imagen Docker optimizada
├── deploy.sh                  # Script de deploy automático
└── nginx/                     # Configuración Nginx + SSL
```

---

## 🌐 **URLs de la Aplicación**

Una vez desplegada, tendrás acceso a:

- **🏠 Frontend**: `https://lacasadelsueloradianteapp.com`
- **🛡️ Admin**: `https://lacasadelsueloradianteapp.com/admin`
- **👤 Dashboard**: `https://lacasadelsueloradianteapp.com/dashboard`
- **🛒 Checkout**: `https://lacasadelsueloradianteapp.com/checkout`
- **📧 API Email**: `https://lacasadelsueloradianteapp.com/api/email`

---

## � **Desarrollo Local**

Si quieres desarrollar localmente:

```bash
# Clonar repositorio
git clone https://github.com/Martiiroth/lacasadelsueloradiante.git
cd lacasadelsueloradiante

# Instalar dependencias
npm install

# Configurar variables locales
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📧 **Configuración de Email**

El sistema incluye **notificaciones automáticas** configuradas:

- **SMTP**: Zoho Mail pre-configurado
- **Usuario**: `notificaciones@lacasadelsueloradianteapp.com`
- **Eventos**: Cambios de estado de pedidos
- **Templates**: HTML responsivos incluidos

---

## 🔄 **Mantenimiento y Updates**

```bash
# Actualizar aplicación
cd lacasadelsueloradiante
git pull origin main
./deploy.sh

# Ver logs
docker-compose logs -f

# Backup base de datos
docker-compose exec postgres pg_dump -U postgres lacasadelsueloradiante > backup.sql
```

---

## 📚 **Documentación Completa**

- 📖 **[Deploy Directo VPS](./DEPLOY_DIRECTO.md)** - Guía ultra-rápida
- 📋 **[Deploy Paso a Paso](./DEPLOY_VPS.md)** - Guía detallada
- ✅ **[Verificación Completa](./VERIFICACION_COMPLETA.md)** - Checklist técnico
- 📧 **[Sistema de Email](./documentation/mail.readme)** - Configuración email

---

## 🆘 **Soporte**

¿Problemas con el deploy? Revisa:
1. **[Solución de problemas](./DEPLOY_DIRECTO.md#-solución-de-problemas)**
2. Logs: `docker-compose logs -f`
3. Estado: `docker-compose ps`

---

## 🎯 **Estado del Proyecto**

✅ **PRODUCTION READY** - Listo para usar en producción  
✅ **Código completo** - Todas las funcionalidades implementadas  
✅ **Deploy automático** - Script de deploy incluido  
✅ **Documentación completa** - Guías paso a paso  
✅ **Sistema de emails** - Notificaciones automáticas  
✅ **Configuración SSL** - HTTPS automático  

---

**🚀 ¡Tu e-commerce está listo para conquistar el mundo del suelo radiante!**