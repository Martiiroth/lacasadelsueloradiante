'use client'

import Link from 'next/link'
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CakeIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Información de la Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              La Casa del Suelo Radiante
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Especialistas en sistemas de calefacción por suelo radiante. 
              Ofrecemos soluciones eficientes y sostenibles para tu hogar.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <MapPinIcon className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">
                  APOSTOL SANTIAGO 59<br />
                  
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">+34 689 571 381</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <a 
                  href="mailto:consultas@lacasadelsueloradiante.es" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  consultas@lacasadelsueloradiante.es
                </a>
              </div>
              <div className="flex items-start space-x-2">
                <ClockIcon className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-xs">
                  Lunes a Viernes: 9:00 - 14:30
                </span>
              </div>
            </div>
          </div>



          {/* Atención al Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Atención al Cliente
            </h3>
            <nav className="space-y-2">
              <Link 
                href="/dashboard" 
                className="block text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                Mi Cuenta
              </Link>
              <Link 
                href="/dashboard/orders" 
                className="block text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                Mis Pedidos
              </Link>

              <Link 
                href="/cart" 
                className="block text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                Mi Carrito
              </Link>
              <div className="border-t border-gray-700 pt-2 mt-3">
                <p className="text-gray-400 text-xs mb-2">Soporte</p>
                <a 
                  href="mailto:consultas@lacasadelsueloradiante.es"
                  className="block text-gray-300 hover:text-blue-400 transition-colors text-sm"
                >
                  📧 Enviar Consulta
                </a>
            
              </div>
            </nav>
          </div>

          {/* Información Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Información Legal
            </h3>
            <nav className="space-y-2">
              <Link 
                href="/politicas-privacidad" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors text-sm group"
              >
                <ShieldCheckIcon className="h-4 w-4 group-hover:text-blue-400" />
                <span>Políticas de Privacidad</span>
              </Link>
              <Link 
                href="/aviso-cookies" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors text-sm group"
              >
                <CakeIcon className="h-4 w-4 group-hover:text-blue-400" />
                <span>Aviso de Cookies</span>
              </Link>
              <Link 
                href="/aviso-legal" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors text-sm group"
              >
                <DocumentTextIcon className="h-4 w-4 group-hover:text-blue-400" />
                <span>Aviso Legal</span>
              </Link>
              <Link 
                href="/politicas-devolucion" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors text-sm group"
              >
                <ArrowUturnLeftIcon className="h-4 w-4 group-hover:text-blue-400" />
                <span>Políticas de Devolución</span>
              </Link>
            </nav>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>T&V SERVICIOS Y COMPLEMENTOS, S.L.</strong></p>
                <p>CIF: B86715893</p>
              </div>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                © 2025 T&V SERVICIOS Y COMPLEMENTOS, S.L. Todos los derechos reservados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Especialistas en sistemas de calefacción eficiente y sostenible
              </p>
            </div>

            {/* Certificaciones y Sellos */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                <span>SSL Seguro</span>
              </div>
              <div className="text-xs text-gray-400 border-l border-gray-700 pl-4">
                <p>Pagos seguros</p>
                <p className="text-gray-500">Redsys • Transferencia</p>
              </div>
            </div>
          </div>

          {/* Mensaje de conformidad */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Este sitio web cumple con la normativa española de protección de datos (RGPD) y 
              comercio electrónico (LSSICE)
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}