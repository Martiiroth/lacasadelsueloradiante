/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción
  output: 'standalone',
  
  // Optimizaciones de imágenes  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradianteapp.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Optimizaciones adicionales
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
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