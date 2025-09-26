# 🏠 La Casa del Suelo Radiante - E-commerce

Sistema completo de e-commerce especializado en productos de suelo radiante, desarrollado con Next.js 14, TypeScript y Supabase.

## 🚀 Características Principales

### 💼 **Sistema Administrativo Completo**
- ✅ Gestión de productos con variantes y precios por roles
- ✅ Sistema de categorías jerárquicas (padre-hijo)
- ✅ Administración de usuarios y roles (admin, instalador, particular)
- ✅ Panel de pedidos y gestión de cupones
- ✅ Subida y gestión de imágenes y recursos

### 🛒 **Experiencia de Usuario**
- ✅ Carrito de compras completamente funcional
- ✅ Filtros avanzados con sidebar y búsqueda
- ✅ Precios dinámicos según el rol del usuario
- ✅ Galería de imágenes interactiva para productos
- ✅ Diseño responsive y optimizado para móviles

### 📞 **Contacto y Comunicación**
- ✅ Botón de WhatsApp dinámico (689571381)
- ✅ Sistema de contacto integrado
- ✅ Navegación optimizada sin elementos innecesarios

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticación**: Supabase Auth con roles personalizados
- **Almacenamiento**: Supabase Storage para imágenes
- **Despliegue**: Docker + Docker Compose + Nginx

## 📋 Configuración para Desarrollo

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Martiiroth/lacasadelsueloradianteweb.git
cd lacasadelsueloradianteweb
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Completar con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
```

4. **Configurar la base de datos**
```bash
node scripts/setup-database.js
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🐳 Despliegue en Producción

### Despliegue con Docker en VPS

1. **Preparar el VPS**
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Configurar variables de entorno**
```bash
cp .env.production.example .env.production
# Editar con valores reales
nano .env.production
```

3. **Configurar SSL (opcional)**
```bash
mkdir -p nginx/ssl
# Copiar certificados SSL o generar con Let's Encrypt
```

4. **Desplegar**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Base de Datos

La aplicación utiliza Supabase como backend con las siguientes tablas principales:

- **Clientes**: Gestión de usuarios y roles (admin, instalador, particular)
- **Productos**: Catálogo con variantes y precios por rol
- **Categorías**: Sistema jerárquico padre-hijo
- **Pedidos**: Sistema completo de e-commerce
- **Inventario**: Control de stock y backorders

## 📁 Estructura del Proyecto

```
lacasadelsueloradianteweb/
├── src/
│   ├── app/                    # App Router de Next.js 14
│   │   ├── admin/             # Panel de administración
│   │   ├── products/          # Páginas de productos
│   │   ├── api/               # API Routes
│   │   └── ...
│   ├── components/            # Componentes React
│   │   ├── admin/            # Componentes del admin
│   │   ├── ui/               # Componentes de UI
│   │   └── ...
│   ├── lib/                   # Utilidades y servicios
│   └── types/                 # Definiciones de TypeScript
├── scripts/                   # Scripts de configuración
├── nginx/                     # Configuración de Nginx
├── docker-compose.yml         # Configuración de Docker
├── Dockerfile                 # Imagen de la aplicación
└── deploy.sh                  # Script de despliegue
```

## 🔐 Seguridad

- Autenticación basada en JWT con Supabase
- Políticas de seguridad RLS (Row Level Security)
- Headers de seguridad configurados
- Validación de datos en frontend y backend
- Gestión segura de imágenes y archivos

## 📞 Contacto

**WhatsApp**: 689571381 (integrado en la aplicación)

## 🚀 Estado del Proyecto

✅ **Completado**: Sistema completamente funcional con todas las características implementadas  
🔧 **En desarrollo**: Mejoras continuas y nuevas funcionalidades  
📱 **Optimizado**: Para desktop y móviles  
🐳 **Listo para producción**: Con configuración completa de Docker