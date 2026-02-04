'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import FeaturedProducts from '../components/home/FeaturedProducts'
import FeaturedCarousel from '../components/home/FeaturedCarousel'
import SaleProducts from '../components/home/SaleProducts'

// Lazy load RegisterPopup ya que aparece después de 5 segundos
const RegisterPopup = dynamic(() => import('../components/RegisterPopup'), {
  ssr: false,
})

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Popup de Registro */}
      <RegisterPopup delaySeconds={5} />

      {/* Hero Section - primero para que el mensaje principal sea visible de entrada */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 rounded-full opacity-20"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500 rounded-full opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 xl:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6 leading-tight">
                La Casa del 
                <span className="text-brand-500"> Suelo Radiante</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl mb-6 lg:mb-8 text-blue-100 leading-relaxed px-4 sm:px-0">
                Especialistas en sistemas de calefacción por suelo radiante. 
                Calidad, eficiencia y confort para tu hogar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
                <a
                  href="#productos"
                  className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-center min-h-[48px] sm:min-h-[auto]"
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Ver Productos</span>
                </a>
                
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-900 transition-all duration-200 text-center min-h-[48px] sm:min-h-[auto]"
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Contactanos</span>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">¿Por qué elegirnos?</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-lg">Más de 10 años de experiencia</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-lg">Productos de máxima calidad</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-lg">Asesoramiento por expertos</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-lg">Precios especiales para profesionales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel infinito de productos destacados */}
      <FeaturedCarousel />

      {/* Sección de Productos en Oferta */}
      <SaleProducts limit={6} />

      {/* Sección de Productos Destacados con Filtros */}
      <FeaturedProducts 
        title="Explora Nuestros Productos"
        showFilters={true}
        limit={8}
      />

      {/* Sección de Servicios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              En La Casa del Suelo Radiante ofrecemos todo lo que los instaladores necesitan para mantener instalaciones eficientes y seguras:
              <span className="font-semibold text-gray-900"> líquidos inhibidores, anticongelantes, biocidas, limpiadores y selladores</span>, así como 
              <span className="font-semibold text-gray-900"> máquinas desenlodadoras, equipos de impulsos, filtros magnéticos y adaptadores para bombas circuladoras</span>.
            </p>
            <p className="text-base text-gray-600 max-w-3xl mx-auto mt-4">
              Productos profesionales, certificados y fáciles de aplicar para una instalación más duradera y libre de averías.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Líquidos y Aditivos
              </h3>
              <p className="text-gray-600">
                Inhibidores, anticongelantes, biocidas, limpiadores y selladores para una protección completa del sistema.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Máquinas y Equipos
              </h3>
              <p className="text-gray-600">
                Máquinas desenlodadoras y equipos de impulsos profesionales para mantenimiento y limpieza de instalaciones.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Filtros y Adaptadores
              </h3>
              <p className="text-gray-600">
                Filtros magnéticos y adaptadores para bombas circuladoras que garantizan un funcionamiento óptimo y duradero.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Contacto */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                ¿Necesitas ayuda con tu proyecto?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Nuestro equipo de expertos está listo para ayudarte a encontrar 
                la solución perfecta para tu sistema de calefacción.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-brand-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-lg">+34 689 571 381</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-brand-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-lg">consultas@lacasadelsueloradiante.com</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">Contacto Rápido</h3>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-white/70 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Tu email"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-white/70 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Tu mensaje"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-white/70 text-white focus:outline-none focus:border-brand-500 resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-500 text-white font-semibold py-3 rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
