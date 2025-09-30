# 🚀 DEPLOY ULTRA-RÁPIDO - LA CASA DEL SUELO RADIANTE

## ⚡ DEPLOY EN 5 COMANDOS - TODO INCLUIDO

**¡Tu aplicación está 100% lista para deploy! Sólo necesitas ejecutar estos comandos:**

---

### 🖥️ **EN TU VPS:**

```bash
# 1. Instalar Docker (una sola vez)
curl -fsSL https://get.docker.com | sh && sudo apt install -y docker-compose

# 2. Clonar repositorio
git clone https://github.com/Martiiroth/lacasadelsueloradiante.git
cd lacasadelsueloradiante

# 3. Deploy automático ¡YA ESTÁ TODO CONFIGURADO!
chmod +x deploy.sh && ./deploy.sh
```

**¡Y LISTO! Tu aplicación estará funcionando en:**
- **🌐 https://lacasadelsueloradianteapp.com** (cuando configures el DNS)
- **🌐 https://tu_ip_del_vps** (inmediatamente)

---

## 🎯 **LO QUE YA ESTÁ CONFIGURADO:**

### ✅ **Variables de Entorno Completas**
- **Supabase**: Conexión configurada
- **Email Zoho**: SMTP listo (notificaciones@lacasadelsueloradianteapp.com)
- **Seguridad**: Claves generadas y configuradas
- **Base de datos**: PostgreSQL local opcional
- **URLs**: Dominio y API endpoints configurados

### ✅ **Configuración de Producción**
- **Docker**: Multi-stage optimizado
- **Nginx**: Proxy reverso + SSL automático
- **Next.js**: Output standalone para máximo rendimiento
- **Certificados**: Generación automática SSL
- **Firewall**: Configuración automática de puertos

### ✅ **Sistema de Email Completo**
- **SMTP Zoho**: `notificaciones@lacasadelsueloradianteapp.com`
- **Password**: `LaCasa2024!Email#Zoho*Secure`
- **Notificaciones**: Automáticas en cada cambio de estado de pedido
- **Templates**: HTML responsivos para cliente y admin

### ✅ **Información de Empresa**
- **Nombre**: La Casa del Suelo Radiante
- **Dirección**: Calle de los Sistemas de Calefacción 123, Madrid
- **Teléfono**: +34 91 123 45 67
- **Email**: info@lacasadelsueloradianteapp.com
- **CIF**: B-87654321

---

## 🔧 **CONFIGURACIÓN OPCIONAL (Solo si necesitas cambiar algo)**

### Cambiar Email SMTP:
```bash
nano .env.production
# Editar EMAIL_USER y EMAIL_PASSWORD
docker-compose restart nextjs-app
```

### Cambiar dominio:
```bash
nano .env.production
# Editar NEXTAUTH_URL y NEXT_PUBLIC_APP_URL
nano nginx/nginx.conf  
# Editar server_name
docker-compose restart
```

### Ver logs:
```bash
docker-compose logs -f
```

---

## 🌐 **CONFIGURAR DNS (Opcional - Para tu dominio)**

**En tu proveedor de dominio (GoDaddy, Namecheap, etc.):**

```
Tipo: A
Nombre: @
Valor: [IP_DE_TU_VPS]

Tipo: A  
Nombre: www
Valor: [IP_DE_TU_VPS]
```

---

## ✅ **VERIFICAR QUE FUNCIONA:**

### 🌐 **URLs de Acceso:**
- **Frontend**: https://tu_ip_del_vps
- **Admin**: https://tu_ip_del_vps/admin  
- **API**: https://tu_ip_del_vps/api
- **Test Email**: https://tu_ip_del_vps/api/test-email

### 📧 **Probar Email:**
```bash
# Desde el VPS
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "tu_email@gmail.com", "subject": "Test desde VPS"}'
```

### 🏪 **Funcionalidades Listas:**
- ✅ Registro e login de usuarios
- ✅ Catálogo de productos
- ✅ Carrito de compra  
- ✅ Checkout completo
- ✅ Panel de administración
- ✅ Gestión de pedidos
- ✅ Notificaciones automáticas por email
- ✅ Gestión de clientes e inventario

---

## 🔄 **ACTUALIZAR LA APLICACIÓN:**

```bash
cd lacasadelsueloradiante
git pull origin main
./deploy.sh
```

---

## 🆘 **SOLUCIÓN DE PROBLEMAS:**

### Problema: No funciona
```bash
# Ver qué pasa
docker-compose logs

# Reiniciar todo
docker-compose restart
```

### Problema: No llegan emails
```bash
# Verificar configuración email
docker-compose exec nextjs-app env | grep EMAIL

# Probar API email manualmente
curl -X POST http://localhost:3000/api/test-email
```

### Problema: SSL no funciona
```bash
# Regenerar certificados
rm -rf nginx/ssl/*
./deploy.sh
```

---

## 🎉 **¡TU E-COMMERCE ESTÁ LISTO!**

**Características incluidas:**
- 🛍️ **E-commerce completo** con carrito y checkout
- 📧 **Notificaciones automáticas** por email
- 👤 **Gestión de clientes** y usuarios  
- 📦 **Gestión de pedidos** e inventario
- 🔐 **Sistema de autenticación** seguro
- 💳 **Procesamiento de pedidos** completo
- 📊 **Panel de administración** completo
- 📱 **Responsive design** (móvil y desktop)
- 🔒 **HTTPS** automático con certificados SSL

**¡Solo necesitas ejecutar `./deploy.sh` y tendrás tu tienda online funcionando!**