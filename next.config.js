/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción
  output: 'standalone',
  
  // Ignorar errores ESLint durante el build (temporal)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración del webpack para manejar módulos de servidor
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Evitar que los módulos de Node.js se incluyan en el bundle del cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
      }
    }
    return config
  },
  
  // Optimizaciones de imágenes  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Supabase Storage - Dominio correcto del proyecto
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradianteapp.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase - Wildcard para cualquier proyecto de Supabase (desarrollo/testing)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Dominio personalizado de Supabase (si existe)
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradianteapp.com',
        port: '',
        pathname: '/**',
      },
      // Permitir localhost para desarrollo
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      // Permitir más dominios comunes de imágenes
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
    // Optimizaciones adicionales
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Permitir imágenes externas sin optimización en caso de error
    unoptimized: process.env.NODE_ENV === 'development' ? true : false,
  },

  // Compresión
  compress: true,
  
  // Variables de entorno para el runtime del servidor
  env: {
    // Variables de email necesarias en el servidor
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_ADMIN_ADDRESS: process.env.EMAIL_ADMIN_ADDRESS,
    
    // Variables de Supabase para el servidor
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Variables de autenticación
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    
    // Variables de negocio
    BUSINESS_NAME: process.env.BUSINESS_NAME,
    BUSINESS_EMAIL: process.env.BUSINESS_EMAIL,
    BUSINESS_PHONE: process.env.BUSINESS_PHONE,
    BUSINESS_ADDRESS: process.env.BUSINESS_ADDRESS,
    BUSINESS_CIF: process.env.BUSINESS_CIF,
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig