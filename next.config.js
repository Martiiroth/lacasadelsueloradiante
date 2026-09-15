/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción
  output: 'standalone',
  
  // Ignorar errores ESLint durante el build (temporal)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de compilación para reducir transpilación innecesaria
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Configuración de transpilación para navegadores modernos
  transpilePackages: [],

  // Optimizaciones experimentales para navegadores modernos
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
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
      // Supabase Storage - Dominio correcto del proyecto (producción)
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradiante.es',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradiante.es',
        port: '',
        pathname: '/**',
      },
      // Supabase Storage - Dominio alternativo del proyecto
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradianteapp.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.lacasadelsueloradianteapp.com',
        port: '',
        pathname: '/**',
      },
      // Supabase - Wildcard para cualquier proyecto de Supabase (desarrollo/testing)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
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
    // Desactivar optimizador de Next/Image: en este despliegue _next/image responde 500
    // y rompe la carga de imágenes en home/producto.
    unoptimized: true,
  },

  // Compresión
  compress: true,
  
  // Configuración de webpack para excluir módulos del servidor del bundle del cliente
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // En el cliente, excluir módulos que solo funcionan en el servidor
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        child_process: false,
        net: false,
        tls: false,
        fs: false,
      }
      
      // Excluir nodemailer del bundle del cliente
      config.externals = config.externals || []
      config.externals.push({
        'nodemailer': 'commonjs nodemailer',
        'nodemailer/lib/mailer': 'commonjs nodemailer/lib/mailer',
      })
    }
    return config
  },
  
  // No usar `env` aquí para secretos (EMAIL_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, etc.):
  // Next los incrusta en el build y la app ignora el .env del runtime del contenedor.
  // El servidor lee process.env en runtime vía docker-compose `environment`.

  // Headers de seguridad y caché
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
      // Headers de caché para recursos estáticos
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig