# La Casa del Suelo Radiante Web

Aplicación web para La Casa del Suelo Radiante construida con Next.js 14 y Supabase.

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **Supabase** - Backend como servicio con PostgreSQL

## Configuración del Proyecto

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env.local
   ```

4. Configura las variables de entorno en `.env.local`

### Desarrollo

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Base de Datos

La aplicación utiliza Supabase como backend. El esquema de la base de datos se encuentra en `database.readme`.

### Estructura Principal

- **Clientes**: Gestión de usuarios y roles
- **Productos**: Catálogo con variantes y precios por rol
- **Pedidos**: Sistema completo de e-commerce
- **Inventario**: Control de stock y backorders
- **Facturación**: Sistema de facturas automáticas

## Despliegue

El proyecto está configurado para desplegarse en Vercel:

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── app/            # App Router de Next.js
├── components/     # Componentes reutilizables
├── lib/           # Utilidades y configuraciones
└── types/         # Tipos TypeScript
```