import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import WhatsAppButton from '../components/ui/WhatsAppButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'La Casa del Suelo Radiante',
  description: 'Tu tienda especializada en suelo radiante',
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
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}