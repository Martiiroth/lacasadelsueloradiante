import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import { PricingProvider } from '../hooks/usePricing'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import WhatsAppButton from '../components/ui/WhatsAppButton'
import NetworkErrorHandler from '../components/NetworkErrorHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'La Casa del Suelo Radiante',
    template: '%s | La Casa del Suelo Radiante'
  },
  description: 'Tu tienda especializada en suelo radiante y sistemas de calefacción. Productos profesionales para instaladores, distribuidores y particulares.',
  keywords: ['suelo radiante', 'calefacción', 'sistemas de calefacción', 'instalación', 'productos profesionales'],
  authors: [{ name: 'La Casa del Suelo Radiante' }],
  creator: 'La Casa del Suelo Radiante',
  publisher: 'La Casa del Suelo Radiante',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://lacasadelsueloradiante.es',
    siteName: 'La Casa del Suelo Radiante',
    title: 'La Casa del Suelo Radiante - Sistemas de Calefacción',
    description: 'Tu tienda especializada en suelo radiante y sistemas de calefacción profesionales.',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'La Casa del Suelo Radiante - Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Casa del Suelo Radiante',
    description: 'Tu tienda especializada en suelo radiante y sistemas de calefacción profesionales.',
    images: ['/images/logo.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        {/* Preconnect a Supabase para mejorar LCP */}
        <link rel="preconnect" href="https://supabase.lacasadelsueloradianteapp.com" />
        <link rel="dns-prefetch" href="https://supabase.lacasadelsueloradianteapp.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/images/logo.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1023px) {
              .products-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 1rem !important;
              }
            }
          `
        }} />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <AuthProvider>
          <CartProvider>
            <PricingProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <WhatsAppButton />
                <NetworkErrorHandler />
              </div>
            </PricingProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}