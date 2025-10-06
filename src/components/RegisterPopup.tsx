'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface RegisterPopupProps {
  delaySeconds?: number // Tiempo de espera antes de mostrar el popup (en segundos)
}

export default function RegisterPopup({ delaySeconds = 5 }: RegisterPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // ✅ NO mostrar el popup si el usuario está autenticado
    if (user) {
      console.log('[REGISTER_POPUP] Usuario autenticado, no mostrar popup')
      return
    }

    // Verificar si el usuario ya cerró el popup con "No volver a mostrar"
    const popupClosed = localStorage.getItem('registerPopupClosed')
    
    if (popupClosed === 'true') {
      console.log('[REGISTER_POPUP] Usuario ya cerró el popup permanentemente')
      return
    }

    console.log(`[REGISTER_POPUP] Programando popup para mostrar en ${delaySeconds} segundos`)

    // Mostrar el popup después del delay especificado
    const timer = setTimeout(() => {
      console.log('[REGISTER_POPUP] Mostrando popup de registro')
      setIsOpen(true)
    }, delaySeconds * 1000)

    return () => clearTimeout(timer)
  }, [delaySeconds, user])

  const handleClose = () => {
    setIsOpen(false)
    
    if (dontShowAgain) {
      localStorage.setItem('registerPopupClosed', 'true')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform animate-scaleIn">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10"
          aria-label="Cerrar"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>

        {/* Contenido */}
        <div className="px-8 py-12 md:px-12 md:py-16 text-center">
          {/* Título */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
            ¡REGÍSTRATE!
          </h2>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-white mb-10 leading-relaxed">
            Regístrate y nos pondremos en contacto contigo para ofrecerte las mejores tarifas!!!
          </p>

          {/* Botón de registro */}
          <Link
            href="/auth/register"
            onClick={handleClose}
            className="inline-block bg-white text-red-700 text-xl md:text-2xl font-bold px-12 py-4 rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl uppercase tracking-wide"
          >
            REGÍSTRATE AQUÍ
          </Link>

          {/* Checkbox "No volver a mostrar" */}
          <div className="mt-8 flex items-center justify-center">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-5 h-5 text-white bg-white/20 border-2 border-white rounded focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-700 cursor-pointer"
              />
              <span className="ml-3 text-white text-lg group-hover:text-gray-200 transition-colors">
                No volver a mostrar este mensaje
              </span>
            </label>
          </div>
        </div>

        {/* Decoración */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-red-500 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-red-400 rounded-full opacity-30 blur-xl"></div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
