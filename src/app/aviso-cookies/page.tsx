import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de Cookies | La Casa del Suelo Radiante',
  description: 'Información sobre el uso de cookies en La Casa del Suelo Radiante',
}

export default function AvisoCookies() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Aviso de Cookies
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ¿Qué son las cookies?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando 
              visita un sitio web. Nos ayudan a mejorar la funcionalidad del sitio, analizar el 
              tráfico web y personalizar su experiencia de navegación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Tipos de cookies que utilizamos
            </h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Cookies Técnicas (Necesarias)
                </h3>
                <p className="text-gray-600 mb-3">
                  Son esenciales para el funcionamiento básico del sitio web y no pueden desactivarse.
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Cookies que utilizamos:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>session_token:</strong> Mantiene su sesión iniciada (Duración: Sesión)</li>
                    <li><strong>cart_data:</strong> Almacena productos en su carrito (Duración: 7 días)</li>
                    <li><strong>csrf_token:</strong> Protección contra ataques CSRF (Duración: Sesión)</li>
                    <li><strong>cookie_consent:</strong> Recuerda su preferencia de cookies (Duración: 1 año)</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Cookies Analíticas
                </h3>
                <p className="text-gray-600 mb-3">
                  Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Cookies que utilizamos:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>_analytics:</strong> Análisis de tráfico web (Duración: 2 años)</li>
                    <li><strong>page_views:</strong> Contador de visitas (Duración: 30 días)</li>
                    <li><strong>user_behavior:</strong> Patrones de navegación (Duración: 1 año)</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-4 rounded-r-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Cookies de Preferencias
                </h3>
                <p className="text-gray-600 mb-3">
                  Permiten recordar sus preferencias para mejorar su experiencia de navegación.
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Cookies que utilizamos:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>language_pref:</strong> Idioma preferido (Duración: 1 año)</li>
                    <li><strong>theme_mode:</strong> Tema visual seleccionado (Duración: 6 meses)</li>
                    <li><strong>currency_pref:</strong> Moneda preferida (Duración: 1 año)</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-4 rounded-r-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Cookies de Marketing
                </h3>
                <p className="text-gray-600 mb-3">
                  Se utilizan para mostrar anuncios relevantes y medir la efectividad de campañas publicitarias.
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Cookies de terceros:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Google Analytics:</strong> Análisis de comportamiento (Duración: 2 años)</li>
                    <li><strong>Facebook Pixel:</strong> Seguimiento de conversiones (Duración: 90 días)</li>
                    <li><strong>Google Ads:</strong> Publicidad personalizada (Duración: 90 días)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Gestión de cookies
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Puede gestionar sus preferencias de cookies en cualquier momento. Tenga en cuenta que 
              desactivar ciertas cookies puede afectar la funcionalidad del sitio web.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Panel de Configuración</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Cookies Técnicas</h4>
                    <p className="text-sm text-gray-600">Necesarias para el funcionamiento básico</p>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded">
                    Siempre activas
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Cookies Analíticas</h4>
                    <p className="text-sm text-gray-600">Nos ayudan a mejorar el sitio web</p>
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors">
                    Aceptadas
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Cookies de Preferencias</h4>
                    <p className="text-sm text-gray-600">Personalizan su experiencia</p>
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors">
                    Aceptadas
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Cookies de Marketing</h4>
                    <p className="text-sm text-gray-600">Para publicidad relevante</p>
                  </div>
                  <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400 transition-colors">
                    Rechazadas
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                  Guardar Preferencias
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-50 transition-colors">
                  Rechazar Todo
                </button>
                <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors">
                  Aceptar Todo
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Configuración del navegador
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              También puede configurar su navegador para bloquear o eliminar cookies:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Navegadores de escritorio:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>
                    <strong>Chrome:</strong> Configuración → Privacidad → Cookies
                  </li>
                  <li>
                    <strong>Firefox:</strong> Preferencias → Privacidad → Cookies
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferencias → Privacidad → Cookies
                  </li>
                  <li>
                    <strong>Edge:</strong> Configuración → Privacidad → Cookies
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Navegadores móviles:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>
                    <strong>Chrome móvil:</strong> Configuración → Configuración del sitio → Cookies
                  </li>
                  <li>
                    <strong>Safari iOS:</strong> Configuración → Safari → Privacidad
                  </li>
                  <li>
                    <strong>Samsung Internet:</strong> Configuración → Privacidad → Cookies
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Cookies de terceros
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Algunos de nuestros servicios utilizan cookies de terceros:
            </p>
            
            <div className="space-y-4">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Google Analytics</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Utilizamos Google Analytics para analizar el uso de nuestro sitio web.
                </p>
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Política de privacidad de Google
                </a>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Redsys (Pagos)</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Para procesar pagos seguros a través del sistema Redsys.
                </p>
                <a 
                  href="https://www.redsys.es/politica-de-cookies" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Política de cookies de Redsys
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Contacto
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Si tiene alguna pregunta sobre nuestro uso de cookies, puede contactarnos en:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-blue-800">
                <strong>Email:</strong> 
                <a href="mailto:consultas@lacasadelsueloradiante.es" className="underline ml-1">
                  consultas@lacasadelsueloradiante.es
                </a>
              </p>
              <p className="text-blue-800 mt-1">
                <strong>Teléfono:</strong> +34 689 571 381
              </p>
            </div>
          </section>

          <div className="bg-gray-100 p-4 rounded-lg text-center mt-8">
            <p className="text-sm text-gray-600">
              <strong>Última actualización:</strong> Octubre 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}