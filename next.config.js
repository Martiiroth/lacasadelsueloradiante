/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción
  output: 'standalone',

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
      // Supabase Storage - Dominio principal del proyecto
      {
        protocol: 'https',
        hostname: 'lacasadelsueloradianteapp.supabase.co',
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
  
  // Variables de entorno públicas (agregar según necesidad)
  // env: {
  //   CUSTOM_KEY: process.env.CUSTOM_KEY,
  // },

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